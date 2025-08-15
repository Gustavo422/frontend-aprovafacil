import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import type { Json } from './database.types';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ACCESS'
  | 'DOWNLOAD'
  | 'SHARE'
  | 'COMPLETE_SIMULADO'
  | 'COMPLETE_QUESTAO'
  | 'UPDATE_PROGRESS';

export interface AuditLogData {
  usuarioId?: string | null;
  action: AuditAction;
  tablenome: string;
  recordId?: string | null;
  oldValues?: Json | null;
  newValues?: Json | null;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  private readonly baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async log(data: AuditLogData): Promise<void> {
    try {
      const headersList = await headers();
      const userAgent = headersList.get('user-agent') || null;
      const forwardedFor = headersList.get('x-forwarded-for') || null;
      const realIp = headersList.get('x-real-ip') || null;
      const ipAddress = forwardedFor || realIp || null;

      await this.makeRequest('/audit/logs', {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: data.usuarioId,
          action: data.action,
          table_nome: data.tablenome,
          record_id: data.recordId,
          old_values: data.oldValues,
          new_values: data.newValues,
          ip_address: ipAddress,
          user_agent: userAgent,
          criado_em: new Date().toISOString(),
        }),
      });
    } catch (error) {
      logger.error('Erro ao registrar log de auditoria:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async logLogin(usuarioId: string): Promise<void> {
    await this.log({
      usuarioId,
      action: 'LOGIN',
      tablenome: 'usuarios',
      recordId: usuarioId,
      newValues: { login_at: new Date().toISOString() },
    });
  }

  async logLogout(usuarioId: string): Promise<void> {
    await this.log({
      usuarioId,
      action: 'LOGOUT',
      tablenome: 'usuarios',
      recordId: usuarioId,
    });
  }

  async logCreate(
    usuarioId: string,
    tablenome: string,
    recordId: string,
    newValues: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      usuarioId,
      action: 'CREATE',
      tablenome,
      recordId,
      newValues: newValues as Json,
    });
  }

  async logUpdate(
    usuarioId: string,
    tablenome: string,
    recordId: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      usuarioId,
      action: 'UPDATE',
      tablenome,
      recordId,
      oldValues: oldValues as Json,
      newValues: newValues as Json,
    });
  }

  async logDelete(
    usuarioId: string,
    tablenome: string,
    recordId: string,
    oldValues: Record<string, unknown> | null
  ): Promise<void> {
    await this.log({
      usuarioId,
      action: 'DELETE',
      tablenome,
      recordId,
      oldValues: oldValues as Json,
    });
  }

  async logAccess(
    usuarioId: string,
    tablenome: string,
    recordId: string
  ): Promise<void> {
    await this.log({
      usuarioId,
      action: 'ACCESS',
      tablenome,
      recordId,
    });
  }

  async logSimuladoComplete(
    usuarioId: string,
    simuladoId: string,
    score: number,
    timeTaken: number
  ): Promise<void> {
    await this.log({
      usuarioId,
      action: 'COMPLETE_SIMULADO',
      tablenome: 'progresso_usuario_simulado',
      recordId: simuladoId,
      newValues: {
        pontuacao: score,
        tempo_gasto_minutos: timeTaken,
        concluido_em: new Date().toISOString(),
      },
    });
  }

  async logQuestaoComplete(
    usuarioId: string,
    questaoId: string,
    score: number
  ): Promise<void> {
    await this.log({
      usuarioId,
      action: 'COMPLETE_QUESTAO',
      tablenome: 'progresso_usuario_questoes_semanais',
      recordId: questaoId,
      newValues: {
        pontuacao: score,
        concluido_em: new Date().toISOString(),
      },
    });
  }

  async logProgressUpdate(
    usuarioId: string,
    tablenome: string,
    recordId: string,
    oldProgress: Record<string, unknown> | null,
    newProgress: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      usuarioId,
      action: 'UPDATE_PROGRESS',
      tablenome,
      recordId,
      oldValues: oldProgress as Json,
      newValues: newProgress as Json,
    });
  }

  async getUserLogs(usuarioId: string, limit = 50): Promise<AuditLogData[]> {
    try {
      const params = new URLSearchParams({
        usuario_id: usuarioId,
        limit: limit.toString(),
      });

      return await this.makeRequest<AuditLogData[]>(`/audit/logs?${params}`);
    } catch (error) {
      logger.error('Erro ao buscar logs do usuário:', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return [];
    }
  }

  async getResourceLogs(tablenome: string, recordId: string, limit = 50): Promise<AuditLogData[]> {
    try {
      const params = new URLSearchParams({
        table_nome: tablenome,
        record_id: recordId,
        limit: limit.toString(),
      });

      return await this.makeRequest<AuditLogData[]>(`/audit/logs?${params}`);
    } catch (error) {
      logger.error('Erro ao buscar logs do recurso:', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return [];
    }
  }

  async getLogsByPeriod(startDate: string, endDate: string, usuarioId?: string): Promise<AuditLogData[]> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        ...(usuarioId && { usuario_id: usuarioId }),
      });

      return await this.makeRequest<AuditLogData[]>(`/audit/logs?${params}`);
    } catch (error) {
      logger.error('Erro ao buscar logs por período:', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return [];
    }
  }
}

export const getAuditLogger = (baseUrl?: string) => {
  return new AuditLogger(baseUrl);
};



