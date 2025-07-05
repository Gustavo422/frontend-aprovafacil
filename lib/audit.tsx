import { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import { Database, Json } from './database.types';

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
  tableName: string;
  recordId?: string | null;
  oldValues?: Json | null;
  newValues?: Json | null;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  async log(data: AuditLogData): Promise<void> {
    try {
      const headersList = await headers();
      const userAgent = headersList.get('user-agent') || null;
      const forwardedFor = headersList.get('x-forwarded-for') || null;
      const realIp = headersList.get('x-real-ip') || null;
      const ipAddress = forwardedFor || realIp || null;

      const { error } = await this.supabase.from('audit_logs').insert({
        user_id: data.userId,
        action: data.action,
        table_name: data.tableName,
        record_id: data.recordId,
        old_values: data.oldValues,
        new_values: data.newValues,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      });

      if (error) {
        logger.error('Erro ao registrar log de auditoria:', {
          error: error.message,
          details: error,
        });
      }
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
      tableName: 'users',
      recordId: userId,
      newValues: { login_at: new Date().toISOString() },
    });
  }

  async logLogout(userId: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      tableName: 'users',
      recordId: userId,
    });
  }

  async logCreate(
    userId: string,
    tableName: string,
    recordId: string,
    newValues: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CREATE',
      tableName,
      recordId,
      newValues: newValues as Json,
    });
  }

  async logUpdate(
    userId: string,
    tableName: string,
    recordId: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE',
      tableName,
      recordId,
      oldValues: oldValues as Json,
      newValues: newValues as Json,
    });
  }

  async logDelete(
    userId: string,
    tableName: string,
    recordId: string,
    oldValues: Record<string, unknown> | null
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DELETE',
      tableName,
      recordId,
      oldValues: oldValues as Json,
    });
  }

  async logAccess(
    userId: string,
    tableName: string,
    recordId: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'ACCESS',
      tableName,
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
      tableName: 'user_simulado_progress',
      recordId: simuladoId,
      newValues: {
        score,
        time_taken_minutes: timeTaken,
        completed_at: new Date().toISOString(),
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
      tableName: 'user_questoes_semanais_progress',
      recordId: questaoId,
      newValues: {
        score,
        completed_at: new Date().toISOString(),
      },
    });
  }

  async logProgressUpdate(
    userId: string,
    tableName: string,
    recordId: string,
    oldProgress: Record<string, unknown> | null,
    newProgress: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE_PROGRESS',
      tableName,
      recordId,
      oldValues: oldProgress as Json,
      newValues: newProgress as Json,
    });
  }

  async getUserLogs(userId: string, limit: number = 50): Promise<AuditLogData[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Erro ao buscar logs do usuário:', { error: error.message, details: error });
      return [];
    }

    return data || [];
  }

  async getResourceLogs(tableName: string, recordId: string, limit: number = 50): Promise<AuditLogData[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Erro ao buscar logs do recurso:', { error: error.message, details: error });
      return [];
    }

    return data || [];
  }

  async getLogsByPeriod(startDate: string, endDate: string, userId?: string): Promise<AuditLogData[]> {
    let query = this.supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar logs por período:', { error: error.message, details: error });
      return [];
    }

    return data || [];
  }
}

export const getAuditLogger = (supabaseClient: SupabaseClient<Database>) => {
  return new AuditLogger(supabaseClient);
};
