// Frontend Feature Flags for Guru rollout
// Lê variáveis NEXT_PUBLIC_* e define os endpoints a usar

export type RolloutStrategy = 'off' | 'on' | 'canary';

export interface GuruFeatureFlagConfig {
  strategy: RolloutStrategy;
  canaryPercent: number;
  guruNewModuleEndpoint: {
    enhancedStats: string;
    activities: string;
  };
}

function parseStrategy(value: string | undefined): RolloutStrategy {
  const v = (value ?? 'on').toLowerCase().trim();
  if (v === 'off' || v === '0' || v === 'false') return 'off';
  if (v === 'canary') return 'canary';
  return 'on';
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.floor(n);
}

export function getFeatureFlagConfig(): GuruFeatureFlagConfig {
  const strategy = parseStrategy(process.env.NEXT_PUBLIC_GURU_NEW_MODULE_FLAG);
  const canaryPercent = clamp(parseInt(process.env.NEXT_PUBLIC_GURU_NEW_MODULE_CANARY_PERCENT ?? '0', 10));
  const useNew = strategy === 'on' || strategy === 'canary';

  // Em canário, o gateway do frontend continua apontando para alias versionados; a decisão fina é no backend
  const enhancedStats = useNew
    ? '/api/guru/v1/dashboard/enhanced-stats'
    : '/api/dashboard/enhanced-stats';
  const activities = useNew
    ? '/api/guru/v1/dashboard/activities'
    : '/api/dashboard/activities';

  return {
    strategy,
    canaryPercent,
    guruNewModuleEndpoint: {
      enhancedStats,
      activities,
    },
  };
}


