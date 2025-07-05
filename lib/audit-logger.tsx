import { createServerSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface AuditLogEntry {
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  async logAuthEvent(entry: AuditLogEntry) {
    try {
      const supabase = await createServerSupabaseClient();
      const logEntry = {
        ...entry,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.userId,
          action: entry.action,
          details: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          success: entry.success,
          error_message: entry.errorMessage,
          created_at: logEntry.created_at
        });

      if (error) {
        logger.error('Erro ao salvar log de auditoria', { error, entry });
      } else {
        logger.info('Log de auditoria salvo', { action: entry.action, userId: entry.userId });
      }
    } catch (error) {
      logger.error('Erro inesperado ao salvar log de auditoria', { error, entry });
    }
  }

  async logLogin(userId: string, success: boolean, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      userId,
      action: 'LOGIN',
      details: {
        ...details,
        event_type: 'authentication',
        method: 'email_password'
      },
      success
    });
  }

  async logLogout(userId: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      userId,
      action: 'LOGOUT',
      details: {
        ...details,
        event_type: 'authentication',
        method: 'manual'
      },
      success: true
    });
  }

  async logFailedLogin(email: string, reason: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      userId: 'anonymous',
      action: 'LOGIN_FAILED',
      details: {
        ...details,
        email,
        reason,
        event_type: 'authentication',
        method: 'email_password'
      },
      success: false,
      errorMessage: reason
    });
  }

  async logPasswordReset(userId: string, success: boolean, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      userId,
      action: 'PASSWORD_RESET',
      details: {
        ...details,
        event_type: 'authentication',
        method: 'email'
      },
      success
    });
  }

  async logAccountLocked(userId: string, reason: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      userId,
      action: 'ACCOUNT_LOCKED',
      details: {
        ...details,
        reason,
        event_type: 'security',
        method: 'automatic'
      },
      success: false,
      errorMessage: reason
    });
  }

  async logSuspiciousActivity(userId: string, activity: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      userId,
      action: 'SUSPICIOUS_ACTIVITY',
      details: {
        ...details,
        activity,
        event_type: 'security',
        severity: 'high'
      },
      success: false,
      errorMessage: activity
    });
  }

  async logSessionRefresh(userId: string, success: boolean, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      userId,
      action: 'SESSION_REFRESH',
      details: {
        ...details,
        event_type: 'authentication',
        method: 'automatic'
      },
      success
    });
  }

  async logAccessDenied(userId: string, resource: string, reason: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      userId,
      action: 'ACCESS_DENIED',
      details: {
        ...details,
        resource,
        reason,
        event_type: 'authorization',
        severity: 'medium'
      },
      success: false,
      errorMessage: reason
    });
  }

  // Método para buscar logs de um usuário específico
  async getUserLogs(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Erro ao buscar logs do usuário', { error, userId });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro inesperado ao buscar logs do usuário', { error, userId });
      return [];
    }
  }

  // Método para buscar logs de atividades suspeitas
  async getSuspiciousActivityLogs(limit: number = 50) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', ['LOGIN_FAILED', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED', 'ACCESS_DENIED'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Erro ao buscar logs de atividades suspeitas', { error });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro inesperado ao buscar logs de atividades suspeitas', { error });
      return [];
    }
  }
}

// Instância global para uso em toda a aplicação
export const auditLogger = new AuditLogger(); 