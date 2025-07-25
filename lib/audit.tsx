import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import { Json } from './database.types';

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
  userId?: string | null;
  action: AuditAction;
  tablenome: string;
  recordId?: string | null;
  oldValues?: Json | null;
  newValues?: Json | null;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
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
          user_id: data.userId,
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

  async logLogin(userId: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN',
      tablenome: 'usuarios',
      recordId: userId,
      newValues: { login_at: new Date().toISOString() },
    });
  }

  async logLogout(userId: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      tablenome: 'usuarios',
      recordId: userId,
    });
  }

  async logCreate(
    userId: string,
    tablenome: string,
    recordId: string,
    newValues: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CREATE',
      tablenome,
      recordId,
      newValues: newValues as Json,
    });
  }

  async logUpdate(
    userId: string,
    tablenome: string,
    recordId: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE',
      tablenome,
      recordId,
      oldValues: oldValues as Json,
      newValues: newValues as Json,
    });
  }

  async logDelete(
    userId: string,
    tablenome: string,
    recordId: string,
    oldValues: Record<string, unknown> | null
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DELETE',
      tablenome,
      recordId,
      oldValues: oldValues as Json,
    });
  }

  async logAccess(
    userId: string,
    tablenome: string,
    recordId: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'ACCESS',
      tablenome,
      recordId,
    });
  }

  async logSimuladoComplete(
    userId: string,
    simuladoId: string,
    score: number,
    timeTaken: number
  ): Promise<void> {
    await this.log({
      userId,
      action: 'COMPLETE_SIMULADO',
      tablenome: 'progresso_usuario_simulado',
      recordId: simuladoId,
      newValues: {
        score,
        time_taken_minutes: timeTaken,
        concluido_at: new Date().toISOString(),
      },
    });
  }

  async logQuestaoComplete(
    userId: string,
    questaoId: string,
    score: number
  ): Promise<void> {
    await this.log({
      userId,
      action: 'COMPLETE_QUESTAO',
      tablenome: 'progresso_usuario_questoes_semanais',
      recordId: questaoId,
      newValues: {
        score,
        concluido_at: new Date().toISOString(),
      },
    });
  }

  async logProgressUpdate(
    userId: string,
    tablenome: string,
    recordId: string,
    oldProgress: Record<string, unknown> | null,
    newProgress: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE_PROGRESS',
      tablenome,
      recordId,
      oldValues: oldProgress as Json,
      newValues: newProgress as Json,
    });
  }

  async getUserLogs(userId: string, limit: number = 50): Promise<AuditLogData[]> {
    try {
      const params = new URLSearchParams({
        user_id: userId,
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

  async getResourceLogs(tablenome: string, recordId: string, limit: number = 50): Promise<AuditLogData[]> {
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

  async getLogsByPeriod(startDate: string, endDate: string, userId?: string): Promise<AuditLogData[]> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        ...(userId && { user_id: userId }),
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



