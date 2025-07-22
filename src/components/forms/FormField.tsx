import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

/**
 * Props base para campos de formulário
 */
interface BaseFieldProps {
  /**
   * Label do campo
   */
  label?: string;
  
  /**
   * Texto de ajuda
   */
  helpText?: string;
  
  /**
   * Erro do campo
   */
  error?: FieldError | string;
  
  /**
   * Se o campo é obrigatório
   */
  required?: boolean;
  
  /**
   * Classes CSS adicionais
   */
  className?: string;
  
  /**
   * Classes CSS para o container
   */
  containerClassName?: string;
}

/**
 * Props para input
 */
interface InputProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {}

/**
 * Props para textarea
 */
interface TextareaProps extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {}

/**
 * Props para select
 */
interface SelectProps extends BaseFieldProps {
  /**
   * Opções do select
   */
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  
  /**
   * Placeholder
   */
  placeholder?: string;
  
  /**
   * Valor selecionado
   */
  value?: string;
  
  /**
   * Callback de mudança
   */
  onChange?: (value: string) => void;
  
  /**
   * Se está desabilitado
   */
  disabled?: boolean;
  
  /**
   * Nome do campo
   */
  name?: string;
}

/**
 * Componente de input
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helpText, error, required, className = '', containerClassName = '', ...props }, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    
    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {label && (
          <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm
            ${hasError 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
            ${props.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${props.name}-error` : helpText ? `${props.name}-help` : undefined
          }
          {...props}
        />
        
        {helpText && !hasError && (
          <p id={`${props.name}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
        
        {hasError && (
          <p id={`${props.name}-error`} className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Componente de textarea
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helpText, error, required, className = '', containerClassName = '', ...props }, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    
    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {label && (
          <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm
            ${hasError 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
            ${props.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${props.name}-error` : helpText ? `${props.name}-help` : undefined
          }
          {...props}
        />
        
        {helpText && !hasError && (
          <p id={`${props.name}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
        
        {hasError && (
          <p id={`${props.name}-error`} className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Componente de select
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helpText, error, required, className = '', containerClassName = '', options, placeholder, ...props }, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    
    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {label && (
          <label htmlFor={props.name} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <select
          ref={ref}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm
            ${hasError 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
            ${props.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${props.name}-error` : helpText ? `${props.name}-help` : undefined
          }
          {...props}
          onChange={e => props.onChange && props.onChange(e.target.value)}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {helpText && !hasError && (
          <p id={`${props.name}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
        
        {hasError && (
          <p id={`${props.name}-error`} className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * Componente de checkbox
 */
export const Checkbox = forwardRef<HTMLInputElement, BaseFieldProps & {
  /**
   * Texto do checkbox
   */
  children: React.ReactNode;
  
  /**
   * Se está marcado
   */
  checked?: boolean;
  
  /**
   * Callback de mudança
   */
  onChange?: (checked: boolean) => void;
  
  /**
   * Se está desabilitado
   */
  disabled?: boolean;
  
  /**
   * Nome do campo
   */
  name?: string;
  
  /**
   * Valor do checkbox
   */
  value?: string;
}>(
  ({ label, helpText, error, required, className = '', containerClassName = '', children, ...props }, ref) => {
    const hasError = !!error;
    const errorMessage = typeof error === 'string' ? error : error?.message;
    
    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {label && (
          <div className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
        )}
        
        <div className="flex items-center">
          <input
            ref={ref}
            type="checkbox"
            className={`
              h-4 w-4 rounded border-gray-300 text-blue-600 
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${hasError ? 'border-red-300' : ''}
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${props.name}-error` : helpText ? `${props.name}-help` : undefined
            }
            {...props}
            onChange={e => props.onChange && props.onChange(e.target.checked)}
          />
          <label htmlFor={props.name} className="ml-2 block text-sm text-gray-900 cursor-pointer">
            {children}
          </label>
        </div>
        
        {helpText && !hasError && (
          <p id={`${props.name}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
        
        {hasError && (
          <p id={`${props.name}-error`} className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';