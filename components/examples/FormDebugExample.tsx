/**
 * Exemplo de uso das ferramentas de debug em um formulário React
 */

'use client';

import { useState } from 'react';
import { createModuleDebugger } from '../../utils/debugger';
import { measure } from '../../utils/performance-debug';

// Criar um debugger específico para este componente
const debug = createModuleDebugger('component', 'formDebug');

// Interface para os dados do formulário
interface FormData {
  name: string;
  email: string;
  message: string;
}

export default function FormDebugExample() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);
  
  // Exemplo de uso do debug em manipuladores de eventos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    debug.debug(`Campo ${name} alterado para: ${value}`);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando o campo é alterado
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Exemplo de uso do debug com validação
  const validateForm = () => {
    debug.info('Validando formulário');
    
    return measure('formValidation', () => {
      const newErrors: Partial<FormData> = {};
      
      if (!formData.name.trim()) {
        debug.warn('Validação: Nome é obrigatório');
        newErrors.name = 'Nome é obrigatório';
      }
      
      if (!formData.email.trim()) {
        debug.warn('Validação: Email é obrigatório');
        newErrors.email = 'Email é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        debug.warn('Validação: Email inválido');
        newErrors.email = 'Email inválido';
      }
      
      if (!formData.message.trim()) {
        debug.warn('Validação: Mensagem é obrigatória');
        newErrors.message = 'Mensagem é obrigatória';
      }
      
      setErrors(newErrors);
      const isValid = Object.keys(newErrors).length === 0;
      
      debug.info(`Validação concluída: ${isValid ? 'formulário válido' : 'formulário inválido'}`);
      return isValid;
    });
  };
  
  // Exemplo de uso do debug em submissão de formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    debug.info('Tentativa de envio do formulário');
    
    const isValid = validateForm();
    
    if (isValid) {
      debug.info('Formulário válido, enviando dados', formData);
      
      // Simulação de envio para API
      setTimeout(() => {
        debug.info('Dados enviados com sucesso');
        setSubmitted(true);
      }, 1000);
    } else {
      debug.error('Formulário inválido, envio cancelado');
    }
  };
  
  // Registrar cada renderização
  debug('Renderizando FormDebugExample');
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Exemplo de Debug em Formulário</h2>
      
      <p className="mb-4">
        Este componente demonstra o uso das ferramentas de debug em um formulário.
        Abra o console do navegador e execute <code>localStorage.debug = &apos;app:frontend:component:formDebug&apos;</code> para ver os logs.
      </p>
      
      {submitted ? (
        <div className="p-4 bg-green-100 text-green-700 rounded">
          Formulário enviado com sucesso!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Nome:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block mb-1">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block mb-1">Mensagem:</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className={`w-full p-2 border rounded ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}