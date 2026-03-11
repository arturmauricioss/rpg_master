import { useEffect, useState } from 'react';
import './App.css';
import { api } from './api';
import type { Campaign, Character, Session } from './types';

function App() {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);

  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');

  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');

  const DND_CLASSES = [
    'Bardo',
    'Clérigo',
    'Druida',
    'Ladino',
    'Mago',
    'Guerreiro',
    'Arqueiro',
    'Paladino',
    'Bárbaro',
    'Monge',
  ] as const;

  const DND_RACES = [
    'Humano',
    'Elfo',
    'Anão',
    'Halfling',
    'Meio-Elfo',
    'Meio-Orc',
    'Gnomo',
    'Tiefling',
    'Draconato',
  ] as const;

  const classHitDie: Record<typeof DND_CLASSES[number], number> = {
    Bardo: 8,
    Clérigo: 8,
    Druida: 8,
    Ladino: 6,
    Mago: 4,
    Guerreiro: 10,
    Arqueiro: 8,
    Paladino: 10,
    Bárbaro: 12,
    Monge: 8,
  };

  const classMana: Record<typeof DND_CLASSES[number], number> = {
    Bardo: 6,
    Clérigo: 8,
    Druida: 8,
    Ladino: 2,
    Mago: 10,
    Guerreiro: 0,
    Arqueiro: 4,
    Paladino: 6,
    Bárbaro: 0,
    Monge: 0,
  };

  const roll4d6DropLowest = () => {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    const total = rolls.slice(1).reduce((sum, v) => sum + v, 0);
    return { rolls, total };
  };

  const generateStats = () => {
    const stats = {
      strength: roll4d6DropLowest(),
      dexterity: roll4d6DropLowest(),
      constitution: roll4d6DropLowest(),
      intelligence: roll4d6DropLowest(),
      wisdom: roll4d6DropLowest(),
      charisma: roll4d6DropLowest(),
    };

    setNewChar((prev) => {
      const updated = {
        ...prev,
        strength: stats.strength.total,
        dexterity: stats.dexterity.total,
        constitution: stats.constitution.total,
        intelligence: stats.intelligence.total,
        wisdom: stats.wisdom.total,
        charisma: stats.charisma.total,
        agility: stats.dexterity.total,
      };
      const hp = calcHP(updated.level, updated.class as typeof DND_CLASSES[number], updated.constitution);
      const mp = calcMP(updated.level, updated.class as typeof DND_CLASSES[number], updated.charisma);
      return { ...updated, hp, mp };
    });

    setAttributeRolls({
      strength: stats.strength.rolls,
      dexterity: stats.dexterity.rolls,
      constitution: stats.constitution.rolls,
      intelligence: stats.intelligence.rolls,
      wisdom: stats.wisdom.rolls,
      charisma: stats.charisma.rolls,
    });
  };

  const calcConMod = (con: number) => Math.floor((con - 10) / 2);

  const calcHP = (level: number, charClass: typeof DND_CLASSES[number], constitution: number) => {
    const hd = classHitDie[charClass] || 8;
    const conMod = calcConMod(constitution);
    const base = hd + conMod;
    return Math.max(1, base + (level - 1) * Math.max(1, hd / 2 + 1));
  };

  const calcMP = (level: number, charClass: typeof DND_CLASSES[number], charisma: number) => {
    const base = classMana[charClass] || 0;
    const chaMod = calcConMod(charisma);
    return Math.max(0, level * Math.max(1, base + chaMod));
  };

  const [newChar, setNewChar] = useState({
    name: '',
    playerName: '',
    race: 'Humano',
    class: 'Bardo',
    level: 1,
    hp: 10,
    mp: 0,
    strength: 10,
    agility: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    statusEffects: [] as string[],
  });
  const [attributeRolls, setAttributeRolls] = useState<Record<string, number[]>>({});

  const [activeTab, setActiveTab] = useState<'menu' | 'campaign' | 'session' | 'characters'>('menu');

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadSessions(selectedCampaign.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaign]);

  useEffect(() => {
    if (selectedCampaign && selectedSession) {
      loadCharacters(selectedCampaign.id, selectedSession.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaign, selectedSession]);

  const safe = async <T,>(fn: () => Promise<T>) => {
    try {
      setError(null);
      setLoading(true);
      return await fn();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Erro no servidor');
      }
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    const data = await safe(() => api.getCampaigns());
    setCampaigns(data as Campaign[]);
  };

  const loadSessions = async (campaignId: number) => {
    const data = await safe(() => api.getSessions(campaignId));
    setSessions(data as Session[]);
  };

  const loadCharacters = async (campaignId: number, sessionId: number) => {
    const data = await safe(() => api.getCharacters(campaignId, sessionId));
    setCharacters(data as Character[]);
  };

  const chooseCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setActiveTab('session');
  };

  const chooseSession = (session: Session) => {
    if (session.status === 'closed') {
      setError('Sessão encerrada não pode ser retomada. Crie outra sessão.');
      return;
    }
    setSelectedSession(session);
    setActiveTab('characters');
  };

  const closeSession = async (sessionId: number) => {
    await safe(() => api.closeSession(sessionId));
    if (selectedCampaign) {
      await loadSessions(selectedCampaign.id);
    }
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
    }
  };

  const createCampaign = async () => {
    if (!newCampaignName.trim()) return;
    const created = await safe(() => api.createCampaign(newCampaignName.trim(), newCampaignDescription.trim()));
    setCampaigns((p) => [...p, created]);
    setNewCampaignName('');
    setNewCampaignDescription('');
    setSelectedCampaign(created);
    setActiveTab('session');
  };

  const createSession = async () => {
    if (!selectedCampaign || !newSessionName.trim()) return;
    const created = await safe(() => api.createSession(selectedCampaign.id, newSessionName.trim(), newSessionDescription.trim()));
    setSessions((p) => [...p, created]);
    setNewSessionName('');
    setNewSessionDescription('');
    setSelectedSession(created);
    setActiveTab('characters');
  };

  const createCharacter = async () => {
    if (!selectedCampaign || !selectedSession) return;
    if (!newChar.name.trim() || !newChar.playerName.trim()) return;

    const charClass = (newChar.class as typeof DND_CLASSES[number]) || 'Bardo';
    const level = Number(newChar.level);
    const con = Number(newChar.constitution);
    const cha = Number(newChar.charisma);
    const hp = calcHP(level, charClass, con);
    const mp = calcMP(level, charClass, cha);

    const payload = {
      campaignId: selectedCampaign.id,
      sessionId: selectedSession.id,
      name: newChar.name.trim(),
      playerName: newChar.playerName.trim(),
      race: newChar.race.trim(),
      class: charClass,
      level,
      hp,
      mp,
      strength: Number(newChar.strength),
      agility: Number(newChar.agility),
      dexterity: Number(newChar.dexterity),
      constitution: con,
      intelligence: Number(newChar.intelligence),
      wisdom: Number(newChar.wisdom),
      charisma: cha,
      active: 1 as 0 | 1,
      statusEffects: newChar.statusEffects ?? [],
    };
    const created = await safe(() => api.createCharacter(payload));
    setCharacters((p) => [...p, created]);

    setNewChar({
      name: '',
      playerName: '',
      race: 'Humano',
      class: 'Bardo',
      level: 1,
      hp: 10,
      mp: 0,
      strength: 10,
      agility: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      statusEffects: [],
    });
  };

  const toggleActiveCharacter = async (char: Character) => {
    const updated = await safe(() => api.setActive(char.id, char.active === 0));
    setCharacters((p) => p.map((c) => (c.id === updated.id ? updated : c)));
  };

  const deleteCharacter = async (id: number) => {
    await safe(() => api.deleteCharacter(id));
    setCharacters((p) => p.filter((c) => c.id !== id));
  };

  const renderMenu = () => (
    <div>
      <h1>Tabletop RPG Master</h1>
      <p>Gerencie campanhas, sessões e personagens no seu servidor local.</p>
      <button onClick={() => setActiveTab('campaign')}>Continuar / Gerenciar Campanhas</button>
      <button onClick={() => setActiveTab('campaign')}>Criar Campanha</button>
    </div>
  );

  const renderCampaign = () => (
    <div>
      <h2>Campanhas</h2>
      <button onClick={() => setActiveTab('menu')}>Voltar</button>

      <div className="box">
        <h3>Criar nova campanha</h3>
        <input value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} placeholder="Nome da campanha" />
        <input value={newCampaignDescription} onChange={(e) => setNewCampaignDescription(e.target.value)} placeholder="Descrição" />
        <button onClick={createCampaign}>Criar</button>
      </div>

      <div className="box">
        <h3>Campanhas existentes</h3>
        {campaigns.length === 0 && <p>Nenhuma campanha ainda.</p>}
        <ul>
          {campaigns.map((camp) => (
            <li key={camp.id}>
              <strong>{camp.name}</strong> ({camp.createdAt.split('T')[0]})
              <button onClick={() => chooseCampaign(camp)}>Abrir</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderSession = () => (
    <div>
      <h2>Sessões de {selectedCampaign?.name}</h2>
      <button onClick={() => setActiveTab('campaign')}>Voltar para campanhas</button>

      <div className="box">
        <h3>Criar sessão da campanha</h3>
        <input value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} placeholder="Nome da sessão" />
        <input value={newSessionDescription} onChange={(e) => setNewSessionDescription(e.target.value)} placeholder="Descrição" />
        <button onClick={createSession}>Criar sessão</button>
      </div>

      <div className="box">
        <h3>Sessões existentes</h3>
        {sessions.length === 0 && <p>Nenhuma sessão ainda.</p>}
        <ul>
          {sessions.map((session) => (
            <li key={session.id} className={session.status === 'closed' ? 'inactive' : ''}>
              <strong>{session.name}</strong> ({session.createdAt.split('T')[0]}) - <em>{session.status}</em>
              <button onClick={() => chooseSession(session)} disabled={session.status === 'closed'}>Abrir</button>
              {session.status === 'active' && (
                <button onClick={() => closeSession(session.id)}>Encerrar sessão</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderCharacters = () => (
    <div>
      <h2>Personagens - Campanha: {selectedCampaign?.name} / Sessão: {selectedSession?.name}</h2>
      <button onClick={() => setActiveTab('session')}>Voltar para sessões</button>

      <div className="box">
        <h3>Adicionar personagem</h3>
        <label>
          Nome do personagem
          <input value={newChar.name} onChange={(e) => setNewChar((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nome do personagem" />
        </label>
        <label>
          Nome do jogador
          <input value={newChar.playerName} onChange={(e) => setNewChar((prev) => ({ ...prev, playerName: e.target.value }))} placeholder="Nome do jogador" />
        </label>
        <label>
          Raça
          <select value={newChar.race} onChange={(e) => setNewChar((prev) => ({ ...prev, race: e.target.value }))}>
            {DND_RACES.map((race) => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>
        </label>
        <label>
          Classe
          <select value={newChar.class} onChange={(e) => setNewChar((prev) => ({ ...prev, class: e.target.value }))}>
            {DND_CLASSES.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </label>

        <div className="grid-3">
          <label>
            Nível
            <input type="number" min={1} value={newChar.level} onChange={(e) => setNewChar((prev) => ({ ...prev, level: Number(e.target.value) }))} placeholder="Nível" />
          </label>
          <label>
            HP
            <input type="number" min={1} value={newChar.hp} readOnly placeholder="HP" />
          </label>
          <label>
            MP
            <input type="number" min={0} value={newChar.mp} readOnly placeholder="MP" />
          </label>
        </div>

        <h4>Atributos (4d6, drop lowest)</h4>
        <div className="grid-3">
          <label>
            Força
            <input type="number" min={1} value={newChar.strength} onChange={(e) => setNewChar((prev) => ({ ...prev, strength: Number(e.target.value) }))} placeholder="Força" />
          </label>
          <label>
            Destreza
            <input type="number" min={1} value={newChar.dexterity} onChange={(e) => setNewChar((prev) => ({ ...prev, dexterity: Number(e.target.value), agility: Number(e.target.value) }))} placeholder="Destreza" />
          </label>
          <label>
            Constituição
            <input type="number" min={1} value={newChar.constitution} onChange={(e) => setNewChar((prev) => ({ ...prev, constitution: Number(e.target.value) }))} placeholder="Constituição" />
          </label>
          <label>
            Inteligência
            <input type="number" min={1} value={newChar.intelligence} onChange={(e) => setNewChar((prev) => ({ ...prev, intelligence: Number(e.target.value) }))} placeholder="Inteligência" />
          </label>
          <label>
            Sabedoria
            <input type="number" min={1} value={newChar.wisdom} onChange={(e) => setNewChar((prev) => ({ ...prev, wisdom: Number(e.target.value) }))} placeholder="Sabedoria" />
          </label>
          <label>
            Carisma
            <input type="number" min={1} value={newChar.charisma} onChange={(e) => setNewChar((prev) => ({ ...prev, charisma: Number(e.target.value) }))} placeholder="Carisma" />
          </label>
        </div>

        {Object.entries(attributeRolls).length > 0 && (
          <div className="box">
            <h4>Rolls de atributos</h4>
            <ul>
              {Object.entries(attributeRolls).map(([attr, rolls]) => (
                <li key={attr}>
                  {attr.toUpperCase()}: {rolls.join(', ')} (total {rolls.sort((a, b) => b - a).slice(0, 3).reduce((sum, v) => sum + v, 0)})
                </li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={() => {
          const hp = calcHP(Number(newChar.level), newChar.class as typeof DND_CLASSES[number], Number(newChar.constitution));
          const mp = calcMP(Number(newChar.level), newChar.class as typeof DND_CLASSES[number], Number(newChar.charisma));
          setNewChar((prev) => ({ ...prev, hp, mp }));
        }}>Recalcular HP/MP</button>
        <button onClick={generateStats}>Randomizar atributos (4d6, descartar menor)</button>
        <button onClick={createCharacter}>Criar personagem</button>
      </div>

      <div className="box">
        <h3>Lista de personagens</h3>
        {characters.length === 0 && <p>Nenhum personagem na sessão.</p>}
        <ul>
          {characters.map((char) => (
            <li
              key={char.id}
              className={char.active === 1 ? 'active-character' : 'inactive'}
              onClick={() => toggleActiveCharacter(char)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <strong>{char.name}</strong> (Jogador: {char.playerName}) - {char.race} {char.class} Nível {char.level}
                <div>HP {char.hp} / MP {char.mp}</div>
                <div>STR {char.strength} DEX {char.dexterity} CON {char.constitution}</div>
                <div>INT {char.intelligence} WIS {char.wisdom} CHA {char.charisma}</div>
                {char.statusEffects?.length ? <div>Status: {char.statusEffects.join(', ')}</div> : <div>Status: Normal</div>}
              </div>
              <div className="actions">
                <button onClick={(e) => {e.stopPropagation(); deleteCharacter(char.id);}} >Remover</button>
              </div>
            </li>
          ))}
        </ul>
      </div>


    </div>
  );

  return (
    <div className="app">
      {isLoading && <div className="status">Carregando...</div>}
      {error && <div className="status error">{error}</div>}

      {activeTab === 'menu' && renderMenu()}
      {activeTab === 'campaign' && renderCampaign()}
      {activeTab === 'session' && renderSession()}
      {activeTab === 'characters' && renderCharacters()}
    </div>
  );
}

export default App;
