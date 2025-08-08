import { createServerSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface AuditLogEntry {
  usuarioId: string;
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
        criado_em: new Date().toISOString()
      };

      const { error } = await supabase
        .from('logs_auditoria')
        .insert({
          usuario_id: entry.usuarioId,
          action: entry.action,
          table_nome: 'auth_events',
          record_id: null,
          new_values: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          criado_em: logEntry.criado_em
        });

      if (error) {
        logger.error('Erro ao salvar log de auditoria', { error, entry });
      } else {
        logger.info('Log de auditoria salvo', { action: entry.action, usuarioId: entry.usuarioId });
      }
    } catch (error) {
      logger.error('Erro inesperado ao salvar log de auditoria', { error, entry });
    }
  }

  async logLogin(usuarioId: string, success: boolean, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      usuarioId,
      action: 'LOGIN',
      details: {
        ...details,
        event_type: 'authentication',
        method: 'email_password'
      },
      success
    });
  }

  async logLogout(usuarioId: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      usuarioId,
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
      usuarioId: 'anonymous',
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

  async logPasswordReset(usuarioId: string, success: boolean, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      usuarioId,
      action: 'PASSWORD_RESET',
      details: {
        ...details,
        event_type: 'authentication',
        method: 'email'
      },
      success
    });
  }

  async logAccountLocked(usuarioId: string, reason: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      usuarioId,
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

  async logSuspiciousActivity(usuarioId: string, activity: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      usuarioId,
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

  async logSessionRefresh(usuarioId: string, success: boolean, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      usuarioId,
      action: 'SESSION_REFRESH',
      details: {
        ...details,
        event_type: 'authentication',
        method: 'automatic'
      },
      success
    });
  }

  async logAccessDenied(usuarioId: string, resource: string, reason: string, details: Record<string, unknown> = {}) {
    await this.logAuthEvent({
      usuarioId,
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
  async getUserLogs(usuarioId: string, limit = 50, offset = 0) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('logs_auditoria')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Erro ao buscar logs do usuário', { error, usuarioId });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro inesperado ao buscar logs do usuário', { error, usuarioId });
      return [];
    }
  }

  // Método para buscar logs de atividades suspeitas
  async getSuspiciousActivityLogs(limit = 50) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('logs_auditoria')
        .select('*')
        .in('action', ['LOGIN_FAILED', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED', 'ACCESS_DENIED'])
        .order('criado_em', { ascending: false })
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



