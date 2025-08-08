import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';
import { 
  createAuthError, 
  mapHttpStatusToAuthError, 
  mapNetworkErrorToAuthError,
  AUTH_ERRORS
} from '@/lib/auth-error-types';
import { authLogger } from '@/lib/auth-logger';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5;

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

/**
 * Enhanced login API route with comprehensive error handling and logging
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  let requestBody: { email?: string; senha?: string } | null = null;
  let userEmail: string | undefined;

  return withErrorHandling(async () => {
    try {
      // Parse request body
      const bodyText = await request.text();
      requestBody = JSON.parse(bodyText);
      userEmail = requestBody?.email;

      // Log login attempt
      await authLogger.logLoginAttempt(userEmail || 'unknown', {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        timestamp: new Date().toISOString()
      });

      // Validate request body
      if (!requestBody?.email || !requestBody?.senha) {
        const validationError = createAuthError(
          AUTH_ERRORS.INVALID_CREDENTIALS,
          'Email and password are required',
          { providedFields: requestBody ? Object.keys(requestBody) : [] }
        );
        
        await authLogger.logLoginFailure(userEmail || 'unknown', validationError);
        
        return NextResponse.json({
          success: false,
          error: {
            message: validationError.userMessage,
            code: validationError.code,
            suggestions: validationError.suggestions
          }
        }, { status: 400 });
      }

      // Check rate limiting
      const clientId = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      const rateLimitResult = checkRateLimit(clientId);
      if (!rateLimitResult.allowed) {
        const rateLimitError = createAuthError(
          AUTH_ERRORS.TOO_MANY_REQUESTS,
          `Rate limit exceeded. ${rateLimitResult.attemptsRemaining} attempts remaining.`,
          { 
            clientId,
            resetTime: rateLimitResult.resetTime,
            attemptsUsed: rateLimitResult.attemptsUsed
          }
        );

        await authLogger.logRateLimitHit(userEmail || 'unknown', {
          clientId,
          attemptsUsed: rateLimitResult.attemptsUsed,
          resetTime: rateLimitResult.resetTime
        });

        return NextResponse.json({
          success: false,
          error: {
            message: rateLimitError.userMessage,
            code: rateLimitError.code,
            suggestions: rateLimitError.suggestions,
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          }
        }, { status: 429 });
      }

      // Get backend URL with validation
      const { isValid, url, error: urlError } = getBackendUrl('/api/auth/login');

      if (!isValid) {
        const configError = createAuthError(
          AUTH_ERRORS.BACKEND_URL_MISSING,
          urlError,
          { requestedPath: '/api/auth/login' }
        );

        await authLogger.logConfigurationError(configError, {
          urlError,
          environment: process.env.NODE_ENV
        });

        return NextResponse.json({
          success: false,
          error: {
            message: configError.userMessage,
            code: configError.code,
            suggestions: configError.suggestions
          }
        }, { status: 500 });
      }

      await authLogger.debug('Making login request to backend', {
        url: url.replace(/\/\/.*@/, '//***@'), // Sanitize any credentials in URL
        timeout: REQUEST_TIMEOUT
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      let backendResponse: Response;
      let responseData: {
        success?: boolean;
        data?: {
          token?: string;
          usuario?: Record<string, unknown>;
          expiresIn?: number;
        };
        accessToken?: string;
        user?: Record<string, unknown>;
        expiresIn?: number;
        error?: string;
      };

      try {
        // Make request to backend
        backendResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': request.headers.get('user-agent') || 'AprovaFacil-Frontend',
            'X-Request-ID': authLogger.getSessionId(),
            'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
          },
          body: bodyText,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        const responseText = await backendResponse.text();
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          await authLogger.error('Failed to parse backend response as JSON', parseError as Error, {
            responseText: responseText.substring(0, 500), // Limit log size
            status: backendResponse.status
          });
          
          const parseErrorAuth = createAuthError(
            AUTH_ERRORS.SERVER_ERROR,
            'Invalid response format from authentication server',
            { status: backendResponse.status }
          );

          return NextResponse.json({
            success: false,
            error: {
              message: parseErrorAuth.userMessage,
              code: parseErrorAuth.code,
              suggestions: parseErrorAuth.suggestions
            }
          }, { status: 502 });
        }

        await authLogger.debug('Backend response received', {
          status: backendResponse.status,
          success: responseData.success,
          hasToken: !!responseData.data?.token,
          responseTime: Date.now() - startTime
        });

      } catch (networkError) {
        clearTimeout(timeoutId);
        
        const authError = mapNetworkErrorToAuthError(networkError as Error, {
          url,
          timeout: REQUEST_TIMEOUT,
          userEmail
        });

        await authLogger.logNetworkError('/api/auth/login', networkError as Error, {
          userEmail,
          responseTime: Date.now() - startTime
        });

        // Update rate limit on network errors (they still count as attempts)
        updateRateLimit(clientId);

        return NextResponse.json({
          success: false,
          error: {
            message: authError.userMessage,
            code: authError.code,
            suggestions: authError.suggestions,
            isRetryable: authError.isRetryable
          }
        }, { status: 503 });
      }

      // Handle non-successful responses
      if (!backendResponse.ok) {
        const authError = mapHttpStatusToAuthError(
          backendResponse.status,
          responseData,
          {
            userEmail,
            responseTime: Date.now() - startTime,
            backendUrl: url
          }
        );

        await authLogger.logLoginFailure(userEmail || 'unknown', authError, {
          status: backendResponse.status,
          responseTime: Date.now() - startTime
        });

        // Update rate limit for failed attempts
        updateRateLimit(clientId);

        return NextResponse.json({
          success: false,
          error: {
            message: authError.userMessage,
            code: authError.code,
            suggestions: authError.suggestions,
            isRetryable: authError.isRetryable
          }
        }, { status: backendResponse.status });
      }

      // Handle successful response
      if (responseData.success) {
        // Normalize response format
        if (responseData.accessToken && responseData.user && !responseData.data) {
          responseData.data = {
            token: responseData.accessToken,
            usuario: responseData.user,
            expiresIn: responseData.expiresIn || 60 * 60 * 24 * 7 // Default 7 days
          };
          
          await authLogger.debug('Normalized backend response format', {
            hadOldFormat: true,
            hasNewFormat: !!responseData.data
          });
        }

        // Validate response structure
        if (!responseData.data?.token || !responseData.data?.usuario) {
          const structureError = createAuthError(
            AUTH_ERRORS.SERVER_ERROR,
            'Invalid response structure from authentication server',
            { 
              hasData: !!responseData.data,
              hasToken: !!responseData.data?.token,
              hasUser: !!responseData.data?.usuario
            }
          );

          await authLogger.error('Invalid response structure from backend', undefined, {
            responseStructure: {
              success: responseData.success,
              hasData: !!responseData.data,
              hasToken: !!responseData.data?.token,
              hasUser: !!responseData.data?.usuario
            }
          });

          return NextResponse.json({
            success: false,
            error: {
              message: structureError.userMessage,
              code: structureError.code,
              suggestions: structureError.suggestions
            }
          }, { status: 502 });
        }

        // Create successful response
        const response = NextResponse.json(responseData, { status: 200 });

        // Set authentication cookies
        const token = responseData.data.token;
        const expiresIn = responseData.data.expiresIn || 60 * 60 * 24 * 7; // 7 days default

        try {
          // HTTP-only cookie for security
          response.cookies.set('auth_token_secure', token, {
            httpOnly: true,
            path: '/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: expiresIn
          });
          
          // Client-accessible cookie for frontend use
          response.cookies.set('auth_token', token, {
            httpOnly: false,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: expiresIn
          });

          await authLogger.debug('Authentication cookies set', {
            tokenLength: token.length,
            expiresIn,
            secure: process.env.NODE_ENV === 'production'
          });

        } catch {
          await authLogger.warn('Failed to set authentication cookies', {
            tokenPresent: !!token,
            expiresIn
          });
        }

        // Log successful login
        const userId = (responseData.data.usuario.id as string) || (responseData.data.usuario.email as string) || 'unknown';
        await authLogger.logLoginSuccess(
          userId,
          userEmail || 'unknown',
          {
            responseTime: Date.now() - startTime,
            userRole: responseData.data.usuario.role,
            firstLogin: responseData.data.usuario.primeiro_login
          }
        );

        // Reset rate limit on successful login
        resetRateLimit(clientId);

        return response;
      }

      // Handle unexpected response format
      const unexpectedError = createAuthError(
        AUTH_ERRORS.SERVER_ERROR,
        'Unexpected response format from authentication server',
        { responseData }
      );

      await authLogger.error('Unexpected response format from backend', undefined, {
        success: responseData.success,
        hasError: !!responseData.error,
        responseKeys: Object.keys(responseData)
      });

      return NextResponse.json({
        success: false,
        error: {
          message: unexpectedError.userMessage,
          code: unexpectedError.code,
          suggestions: unexpectedError.suggestions
        }
      }, { status: 502 });

    } catch (error) {
      // Handle any unexpected errors
      const unexpectedError = error instanceof Error ? error : new Error('Unknown error during login');
      
      await authLogger.error('Unexpected error in login route', unexpectedError, {
        userEmail,
        requestBody: requestBody ? Object.keys(requestBody) : undefined,
        responseTime: Date.now() - startTime
      });

      const authError = createAuthError(
        AUTH_ERRORS.SERVER_ERROR,
        unexpectedError.message,
        { 
          errorType: unexpectedError.constructor.name,
          userEmail
        }
      );

      return NextResponse.json({
        success: false,
        error: {
          message: authError.userMessage,
          code: authError.code,
          suggestions: authError.suggestions
        }
      }, { status: 500 });
    }
  });
}

/**
 * Rate limiting functions
 */
interface RateLimitResult {
  allowed: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  resetTime: number;
}

function checkRateLimit(clientId: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry || now > entry.resetTime) {
    // No entry or window expired, allow request
    return {
      allowed: true,
      attemptsUsed: 0,
      attemptsRemaining: MAX_ATTEMPTS_PER_WINDOW,
      resetTime: now + RATE_LIMIT_WINDOW
    };
  }

  const attemptsUsed = entry.attempts;
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS_PER_WINDOW - attemptsUsed);
  const allowed = attemptsUsed < MAX_ATTEMPTS_PER_WINDOW;

  return {
    allowed,
    attemptsUsed,
    attemptsRemaining,
    resetTime: entry.resetTime
  };
}

function updateRateLimit(clientId: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    rateLimitStore.set(clientId, {
      attempts: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
  } else {
    // Update existing entry
    entry.attempts += 1;
    rateLimitStore.set(clientId, entry);
  }
}

function resetRateLimit(clientId: string): void {
  rateLimitStore.delete(clientId);
} 