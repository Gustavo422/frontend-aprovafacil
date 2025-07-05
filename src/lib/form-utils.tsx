import { useForm as useReactHookForm } from 'react-hook-form';
import type { 
  SubmitHandler, 
  FieldValues, 
  UseFormProps, 
  Path, 
  DefaultValues,
  Resolver,
  FieldErrors,
  UseFormReturn as RHFUseFormReturn
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, type ZodType } from 'zod';

// Re-export for backward compatibility
export type UseFormReturn<T extends FieldValues> = RHFUseFormReturn<T>;

// Type-safe wrapper for zodResolver
function createZodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  // @ts-expect-error - Workaround for zodResolver type issues
  return zodResolver(schema);
}

// Define FormValues type for type safety
export type FormValues = Record<string, unknown>;

// Extended form configuration type
type UseFormWithZodParams<T extends FieldValues> = {
  schema: ZodType<T>;
  defaultValues?: DefaultValues<T>;
  options?: Omit<UseFormProps<T>, 'resolver' | 'defaultValues'>;
};

// Type for form field props
export interface FieldPropsOptions<T extends FormValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  className?: string;
}

// Base input props that are common to all form inputs
type BaseInputProps = {
  id: string;
  name: string;
  type?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | undefined;
  'aria-describedby'?: string;
  min?: string | number;
  max?: string | number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
};

// React Hook Form specific field props
type HookFormFieldProps = {
  ref: (instance: HTMLElement | null) => void;
  onChange: (event: React.ChangeEvent<HTMLElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLElement>) => void;
  name: string;
};

// Custom props for our form fields
type CustomFieldProps = {
  label?: string;
  error?: string;
  errorElement?: ErrorElement;
};

// Combine all the prop types
export type FieldProps = BaseInputProps & HookFormFieldProps & CustomFieldProps;

// Type for error element
interface ErrorElement {
  id: string;
  className: string;
  message: string;
}

/**
 * Creates a form with Zod validation
 */
/**
 * Creates a form with Zod validation
 */
export function useFormWithZod<T extends FieldValues>({
  schema,
  defaultValues,
  options = {},
}: UseFormWithZodParams<T>): UseFormReturn<T> {
  return useReactHookForm<T>({
    resolver: createZodResolver(schema),
    defaultValues,
    mode: 'onChange',
    criteriaMode: 'all',
    ...options,
  });
}

// Common validation schemas
export const validationSchemas = {
  /**
   * Email validation schema
   * - Required
   * - Must be a valid email format
   */
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  
  /**
   * Password validation schema
   * - Required
   * - Minimum 8 characters
   * - Must contain at least one uppercase, one lowercase, one number, and one special character
   */
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  
  /**
   * CPF (Brazilian Individual Taxpayer Registry) validation schema
   * - Required
   * - Must be in format 000.000.000-00
   * - Must be a valid CPF number (checksum validation)
   */
  cpf: z
    .string()
    .min(1, 'CPF is required')
    .regex(
      /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      'Invalid CPF format. Use 000.000.000-00'
    )
    .refine(
      (value) => {
        // Remove non-numeric characters
        const cleanCpf = value.replace(/\D/g, '');
        
        // Check if all digits are the same
        if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
        
        // Validate first digit
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cleanCpf.charAt(i), 10) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit > 9) digit = 0;
        if (digit !== parseInt(cleanCpf.charAt(9), 10)) return false;
        
        // Validate second digit
        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cleanCpf.charAt(i), 10) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit > 9) digit = 0;
        if (digit !== parseInt(cleanCpf.charAt(10), 10)) return false;
        
        return true;
      },
      { message: 'Invalid CPF number' }
    ),
};

// Helper function to create a form with common validation
export function useZodForm<T extends FieldValues>(
  schema: ZodType<T>,
  defaultValues?: Partial<T>,
  options?: Omit<UseFormProps<T>, 'resolver' | 'defaultValues'>
): UseFormReturn<T> {
  return useFormWithZod<T>({
    schema,
    defaultValues: defaultValues as DefaultValues<T>,
    options,
  });
}

// Helper function to handle form submission
export function createFormHandler<T extends FieldValues>(
  onSubmit: SubmitHandler<T>,
  onError?: (error: unknown) => void
): (data: T) => Promise<void> {
  return async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Using console.error for error logging in development
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Form submission error:', error);
      }
      if (onError) {
        onError(error);
      }
    }
  };
}

// Helper function to handle form submission
export function handleFormSubmit<T extends FieldValues>(
  onSubmit: SubmitHandler<T>,
  onError?: (error: unknown) => void
): React.FormEventHandler<HTMLFormElement> {
  return async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries()) as unknown as T;

    try {
      await onSubmit(data);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Form submission error:', error);
      }
      if (onError) {
        onError(error);
      }
      onError?.(error);
    }
  };
}

// Type for file upload handler
export type FileUploadHandler = (file: File) => Promise<void> | void;

// Helper function to handle file uploads
export function useFileUpload(
  onSuccess: FileUploadHandler,
  onError?: (error: Error) => void
) {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onSuccess(file);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to upload file'));
    }
  };

  return { handleFileChange };
}

// Type for field props options
export interface FieldPropsOptions<T extends FormValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  className?: string;
}

/**
 * Creates props for form fields with proper TypeScript types
 */
// Type-safe field props creator
export function createFieldProps<T extends FormValues>({
  form,
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  type = 'text',
  className = '',
}: FieldPropsOptions<T>): FieldProps {
  const fieldName = name.toString();
  const error = form.formState.errors[name as keyof FieldErrors<T>];
  const { ref, ...field } = form.register(name);
  
  // Format the label if not provided
  const formattedLabel = label || fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
  
  // Format the placeholder if not provided
  const formattedPlaceholder = placeholder || 
    `Enter ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`;
  
  // Create base field props with proper typing
  const baseProps: Omit<BaseInputProps & CustomFieldProps, 'name' | 'error' | 'errorElement'> = {
    id: fieldName,
    label: formattedLabel,
    placeholder: formattedPlaceholder,
    disabled,
    required,
    type,
    className: `form-control ${className}`.trim(),
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${fieldName}-error` : undefined,
  };

  // Create error message if there's an error
  const errorMessage = error?.message as string | undefined;
  
  // Create error element data (without JSX)
  const errorElement: ErrorElement | null = errorMessage ? {
    id: `${fieldName}-error`,
    className: 'error-message',
    message: errorMessage
  } : null;

  // Create field props with proper typing
  const fieldProps: FieldProps = {
    ...baseProps,
    ...field,
    ref: ref as (instance: HTMLElement | null) => void,
    name: fieldName,
    // Ensure required props are included
    onChange: field.onChange || (() => {}),
    onBlur: field.onBlur || (() => {}),
  };

  // Add error-related props if there's an error
  if (errorMessage) {
    fieldProps.error = errorMessage;
  }

  if (errorElement) {
    fieldProps.errorElement = errorElement;
  }

  // Ensure aria-invalid is properly set
  if (error) {
    fieldProps['aria-invalid'] = true;
  }

  return fieldProps;
}

// Helper function to format form errors
export function formatFormErrors(errors: FieldErrors) {
  return Object.entries(errors).reduce((acc, [key, value]) => {
    if (value && typeof value === 'object' && 'message' in value) {
      acc[key] = (value as { message: string }).message;
    }
    return acc;
  }, {} as Record<string, string>);
}
