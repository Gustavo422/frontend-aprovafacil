"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AlertNotificationConfigProps {
  channel: 'email' | 'slack' | 'in-app';
}

export function AlertNotificationConfig({ channel }: AlertNotificationConfigProps) {
  type EmailConfig = { enabled?: boolean; recipients?: string[] };
  type SlackConfig = { enabled?: boolean; webhookUrl?: string; channel?: string };
  type InAppConfig = { enabled?: boolean };
  type ConfigType = EmailConfig | SlackConfig | InAppConfig;
  const [config, setConfig] = useState<ConfigType>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/monitor/alerts');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch configuration: ${response.status}`);
        }
        
        const data = await response.json();
        const channelConfig = data.notificationChannels?.[channel] || {};
        
        setConfig(channelConfig);
        setError(null);
      } catch (err) {
        setError(`Error loading configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Error fetching alert configuration:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, [channel]);

  // Save configuration
  const saveConfig = async () => {
    try {
      setSaving(true);
      setSuccess(false);
      setError(null);
      
      const response = await fetch('/api/monitor/alerts/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          config
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status}`);
      }
      
      setSuccess(true);
    } catch (err) {
      setError(`Error saving configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error saving alert configuration:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle form changes
  const handleChange = (key: string, value: unknown) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear success message when form changes
    if (success) {
      setSuccess(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="default" className="bg-primary/10 border-primary">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription>Configuração salva com sucesso</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <Label htmlFor={`${channel}-enabled`} className="text-base">Ativar Notificações</Label>
        <Switch
          id={`${channel}-enabled`}
          checked={!!config.enabled}
          onCheckedChange={(checked) => handleChange('enabled', checked)}
        />
      </div>
      
      {channel === 'email' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-recipients">Destinatários</Label>
            <Textarea
              id="email-recipients"
              placeholder="email@exemplo.com, outro@exemplo.com"
              value={Array.isArray((config as EmailConfig).recipients) ? (config as EmailConfig).recipients!.join(', ') : ''}
              onChange={(e) => handleChange('recipients', e.target.value.split(',').map(email => email.trim()).filter(Boolean))}
              className="mt-1"
              disabled={!config.enabled}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separe múltiplos emails com vírgulas
            </p>
          </div>
        </div>
      )}
      
      {channel === 'slack' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="slack-webhook">Webhook URL</Label>
            <Input
              id="slack-webhook"
              type="text"
              placeholder="https://hooks.slack.com/services/..."
              value={(config as SlackConfig).webhookUrl || ''}
              onChange={(e) => handleChange('webhookUrl', e.target.value)}
              className="mt-1"
              disabled={!config.enabled}
            />
          </div>
          
          <div>
            <Label htmlFor="slack-channel">Canal</Label>
            <Input
              id="slack-channel"
              type="text"
              placeholder="#alertas"
              value={(config as SlackConfig).channel || ''}
              onChange={(e) => handleChange('channel', e.target.value)}
              className="mt-1"
              disabled={!config.enabled}
            />
          </div>
        </div>
      )}
      
      {channel === 'in-app' && (
        <div className="space-y-4">
          <p className="text-sm">
            As notificações no aplicativo serão exibidas no ícone de sino na barra de navegação.
          </p>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}