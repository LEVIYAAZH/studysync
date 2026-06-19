'use client';
import { AppState, TimetableEvent } from '@/types';

const KEY = 'studysync_v2';

export function saveState(patch: Partial<AppState>) {
  try {
    const existing = loadState() || {} as AppState;
    localStorage.setItem(KEY, JSON.stringify({ ...existing, ...patch }));
  } catch {}
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function getShareableLink(events: TimetableEvent[]): string {
  try {
    const encoded = btoa(encodeURIComponent(JSON.stringify(events)));
    return `${window.location.origin}/timetable?data=${encoded}`;
  } catch { return window.location.href; }
}
