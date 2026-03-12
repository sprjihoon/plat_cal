import type { PlatformPreset, SalesChannel } from '@/types';
import { PLATFORM_PRESETS } from '@/constants';

const STORAGE_KEY = 'margin_calculator_platforms';

export interface StoredPlatformSettings {
  platforms: Record<SalesChannel, PlatformPreset>;
  updatedAt: string;
}

export function savePlatformSettings(platforms: Record<SalesChannel, PlatformPreset>): void {
  const data: StoredPlatformSettings = {
    platforms,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadPlatformSettings(): Record<SalesChannel, PlatformPreset> {
  if (typeof window === 'undefined') {
    return PLATFORM_PRESETS;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return PLATFORM_PRESETS;
    }
    
    const data: StoredPlatformSettings = JSON.parse(stored);
    return data.platforms;
  } catch {
    return PLATFORM_PRESETS;
  }
}

export function resetPlatformSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredUpdatedAt(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const data: StoredPlatformSettings = JSON.parse(stored);
    return data.updatedAt;
  } catch {
    return null;
  }
}
