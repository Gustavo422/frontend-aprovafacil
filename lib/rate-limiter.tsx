export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    // Se não há tentativas registradas ou a janela expirou
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { 
        count: 1, 
        resetTime: now + windowMs,
        blocked: false
      });
      return true;
    }
    
    // Se está bloqueado, verificar se o tempo de bloqueio expirou
    if (attempt.blocked) {
      if (now > attempt.resetTime) {
        // Resetar após o tempo de bloqueio
        this.attempts.set(key, { 
          count: 1, 
          resetTime: now + windowMs,
          blocked: false
        });
        return true;
      }
      return false;
    }
    
    // Incrementar contador
    attempt.count++;
    
    // Se excedeu o limite, bloquear
    if (attempt.count >= maxAttempts) {
      attempt.blocked = true;
      attempt.resetTime = now + windowMs; // Bloquear pelo mesmo tempo
      return false;
    }
    
    return true;
  }
  
  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 5; // Máximo padrão
    
    if (attempt.blocked) return 0;
    
    return Math.max(0, 5 - attempt.count);
  }
  
  getTimeUntilReset(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    
    const now = Date.now();
    return Math.max(0, attempt.resetTime - now);
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  // Limpar tentativas antigas (para evitar vazamento de memória)
  cleanup(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      if (now > attempt.resetTime + 24 * 60 * 60 * 1000) { // 24 horas após expiração
        this.attempts.delete(key);
      }
    }
  }
}

// Instância global para uso em toda a aplicação
export const rateLimiter = new RateLimiter();

// Limpar tentativas antigas a cada hora
if (typeof window === 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 60 * 60 * 1000); // 1 hora
} 