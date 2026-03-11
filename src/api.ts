import type { Campaign, Session, Character } from './types';

const API_ROOT = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API request failed ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  getCampaigns: () => safeFetch<Campaign[]>(`${API_ROOT}/campaigns`),
  createCampaign: (name: string, description?: string) =>
    safeFetch<Campaign>(`${API_ROOT}/campaigns`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  getSessions: (campaignId: number) => safeFetch<Session[]>(`${API_ROOT}/campaigns/${campaignId}/sessions`),
  createSession: (campaignId: number, name: string, description?: string) =>
    safeFetch<Session>(`${API_ROOT}/campaigns/${campaignId}/sessions`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  getCharacters: (campaignId: number, sessionId: number) =>
    safeFetch<Character[]>(`${API_ROOT}/characters?campaignId=${campaignId}&sessionId=${sessionId}`),
  createCharacter: (payload: Omit<Character, 'id' | 'createdAt'>) =>
    safeFetch<Character>(`${API_ROOT}/characters`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCharacter: (id: number, updates: Partial<Character>) =>
    safeFetch<Character>(`${API_ROOT}/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCharacter: (id: number) =>
    safeFetch<void>(`${API_ROOT}/characters/${id}`, {
      method: 'DELETE',
    }),
  setActive: (id: number, active: boolean) =>
    safeFetch<Character>(`${API_ROOT}/characters/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
  getMonsters: () => safeFetch<Monster[]>(`${API_ROOT}/monsters`),
  closeSession: (id: number) =>
    safeFetch<Session>(`${API_ROOT}/sessions/${id}/close`, {
      method: 'PATCH',
    }),
};

export interface Monster {
  name: string;
  cr: number;
  hp: number;
  ac: number;
  type: string;
  XP: number;
};
