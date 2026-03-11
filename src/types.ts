export interface Campaign {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Session {
  id: number;
  campaignId: number;
  name: string;
  description?: string;
  status: 'active' | 'closed';
  createdAt: string;
}

export interface Character {
  id: number;
  campaignId: number;
  sessionId: number;
  name: string;
  playerName: string;
  race: string;
  class: Dnd35Class;
  level: number;
  hp: number;
  mp: number;
  strength: number;
  agility: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  active: 0 | 1;
  statusEffects: string[];
  createdAt: string;
}

export type Dnd35Class =
  | 'Bardo'
  | 'Clérigo'
  | 'Druida'
  | 'Ladino'
  | 'Mago'
  | 'Guerreiro'
  | 'Arqueiro'
  | 'Paladino'
  | 'Bárbaro'
  | 'Monge';
