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

export async function loadPlatformSettingsFromServer(): Promise<Record<SalesChannel, PlatformPreset> | null> {
  try {
    const res = await fetch('/api/platform-settings');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.custom_presets) return null;
    return data.custom_presets as Record<SalesChannel, PlatformPreset>;
  } catch {
    return null;
  }
}

export async function savePlatformSettingsToServer(platforms: Record<SalesChannel, PlatformPreset>): Promise<boolean> {
  try {
    const res = await fetch('/api/platform-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_presets: platforms }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function resetPlatformSettingsOnServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/platform-settings', { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadPlatformSettingsWithFallback(): Promise<Record<SalesChannel, PlatformPreset>> {
  const serverSettings = await loadPlatformSettingsFromServer();
  if (serverSettings) {
    savePlatformSettings(serverSettings);
    return serverSettings;
  }

  return loadPlatformSettings();
}
