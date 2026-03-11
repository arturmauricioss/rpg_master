import express from 'express';
import cors from 'cors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

let db;

async function initDb() {
  db = await open({ filename: './rpg_master.db', driver: sqlite3.Database });
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaignId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL,
      FOREIGN KEY(campaignId) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaignId INTEGER NOT NULL,
      sessionId INTEGER NOT NULL,
      name TEXT NOT NULL,
      playerName TEXT NOT NULL,
      race TEXT DEFAULT 'Humano',
      class TEXT,
      level INTEGER NOT NULL DEFAULT 1,
      hp INTEGER NOT NULL DEFAULT 1,
      mp INTEGER NOT NULL DEFAULT 0,
      strength INTEGER NOT NULL DEFAULT 1,
      dexterity INTEGER NOT NULL DEFAULT 1,
      constitution INTEGER NOT NULL DEFAULT 1,
      intelligence INTEGER NOT NULL DEFAULT 1,
      wisdom INTEGER NOT NULL DEFAULT 1,
      charisma INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      statusEffects TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      FOREIGN KEY(campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    );
  `);

  // Migration: add race column to existing black if missing
  try {
    await db.run("ALTER TABLE characters ADD COLUMN race TEXT DEFAULT 'Humano'");
  } catch (e) {
    if (!/(duplicate column name|already exists)/i.test(e.message || '')) {
      throw e;
    }
  }
}

app.get('/api/campaigns', async (req, res) => {
  const rows = await db.all('SELECT * FROM campaigns ORDER BY createdAt DESC');
  res.json(rows);
});

app.post('/api/campaigns', async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'O nome da campanha é obrigatório' });
  }
  const createdAt = new Date().toISOString();
  const result = await db.run('INSERT INTO campaigns (name, description, createdAt) VALUES (?, ?, ?)', [name, description ?? '', createdAt]);
  const campaign = await db.get('SELECT * FROM campaigns WHERE id = ?', [result.lastID]);
  res.status(201).json(campaign);
});

app.get('/api/campaigns/:campaignId/sessions', async (req, res) => {
  const { campaignId } = req.params;
  const sessions = await db.all('SELECT * FROM sessions WHERE campaignId = ? ORDER BY createdAt DESC', [campaignId]);
  res.json(sessions);
});

app.post('/api/campaigns/:campaignId/sessions', async (req, res) => {
  const { campaignId } = req.params;
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'O nome da sessão é obrigatório' });
  const createdAt = new Date().toISOString();
  const result = await db.run('INSERT INTO sessions (campaignId, name, description, status, createdAt) VALUES (?, ?, ?, ?, ?)', [campaignId, name, description ?? '', 'active', createdAt]);
  const session = await db.get('SELECT * FROM sessions WHERE id = ?', [result.lastID]);
  res.status(201).json(session);
});

app.patch('/api/sessions/:id/close', async (req, res) => {
  const { id } = req.params;
  const existing = await db.get('SELECT * FROM sessions WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Sessão não encontrada' });
  await db.run('UPDATE sessions SET status = ? WHERE id = ?', ['closed', id]);
  const updated = await db.get('SELECT * FROM sessions WHERE id = ?', [id]);
  res.json(updated);
});

app.get('/api/characters', async (req, res) => {
  const { campaignId, sessionId } = req.query;
  if (!campaignId || !sessionId) {
    return res.status(400).json({ error: 'campaignId e sessionId são obrigatórios' });
  }
  const rows = await db.all('SELECT * FROM characters WHERE campaignId = ? AND sessionId = ? ORDER BY createdAt DESC', [campaignId, sessionId]);
  const parsed = rows.map((r) => ({
    ...r,
    statusEffects: r.statusEffects ? JSON.parse(r.statusEffects) : [],
  }));
  res.json(parsed);
});

app.post('/api/characters', async (req, res) => {
  const {
    campaignId,
    sessionId,
    name,
    playerName,
    race,
    class: charClass,
    level,
    hp,
    mp,
    strength,
    dexterity,
    constitution,
    intelligence,
    wisdom,
    charisma,
    active,
    statusEffects,
  } = req.body;

  if (!campaignId || !sessionId || !name || !playerName) {
    return res.status(400).json({ error: 'campaignId, sessionId, name e playerName são obrigatórios' });
  }
  const createdAt = new Date().toISOString();
  const result = await db.run(
    `INSERT INTO characters
      (campaignId, sessionId, name, playerName, race, class, level, hp, mp, strength, dexterity, constitution, intelligence, wisdom, charisma, active, statusEffects, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      campaignId,
      sessionId,
      name,
      playerName,
      race ?? 'Humano',
      charClass ?? 'Bardo',
      level ?? 1,
      hp ?? 1,
      mp ?? 0,
      strength ?? 1,
      dexterity ?? 1,
      constitution ?? 1,
      intelligence ?? 1,
      wisdom ?? 1,
      charisma ?? 1,
      active ?? 1,
      JSON.stringify(statusEffects ?? []),
      createdAt,
    ]
  );
  const character = await db.get('SELECT * FROM characters WHERE id = ?', [result.lastID]);
  res.status(201).json({
    ...character,
    statusEffects: character?.statusEffects ? JSON.parse(character.statusEffects) : [],
  });
});

app.put('/api/characters/:id', async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  const existing = await db.get('SELECT * FROM characters WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Personagem não encontrado' });

  const merged = { ...existing, ...updateFields };
  await db.run(
    `UPDATE characters SET
      name = ?, playerName = ?, race = ?, class = ?, level = ?, hp = ?, mp = ?,
      strength = ?, dexterity = ?, constitution = ?, intelligence = ?, wisdom = ?, charisma = ?, active = ?, statusEffects = ?
      WHERE id = ?`,
    [
      merged.name,
      merged.playerName,
      merged.race,
      merged.class,
      merged.level,
      merged.hp,
      merged.mp,
      merged.strength,
      merged.dexterity,
      merged.constitution,
      merged.intelligence,
      merged.wisdom,
      merged.charisma,
      merged.active,
      JSON.stringify(merged.statusEffects ?? []),
      id,
    ]
  );
  const updated = await db.get('SELECT * FROM characters WHERE id = ?', [id]);
  res.json({
    ...updated,
    statusEffects: updated?.statusEffects ? JSON.parse(updated.statusEffects) : [],
  });
});

app.patch('/api/characters/:id/active', async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'active deve ser boolean' });
  await db.run('UPDATE characters SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  const updated = await db.get('SELECT * FROM characters WHERE id = ?', [id]);
  res.json({
    ...updated,
    statusEffects: updated?.statusEffects ? JSON.parse(updated.statusEffects) : [],
  });
});

app.delete('/api/characters/:id', async (req, res) => {
  const { id } = req.params;
  const existing = await db.get('SELECT * FROM characters WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Personagem não encontrado' });
  await db.run('DELETE FROM characters WHERE id = ?', [id]);
  res.status(204).send();
});

app.get('/api/monsters', (req, res) => {
  const monsters = [
    { name: 'Goblin', cr: 1 / 3, hp: 6, ac: 15, type: 'Humanoide (goblinoide)', XP: 135 },
    { name: 'Kobold', cr: 1 / 4, hp: 5, ac: 12, type: 'Humanoide (kobold)', XP: 100 },
    { name: 'Esqueleto', cr: 1 / 2, hp: 13, ac: 13, type: 'Mortos-Vivos', XP: 200 },
    { name: 'Orc', cr: 1, hp: 15, ac: 13, type: 'Humanoide (orc)', XP: 600 },
    { name: 'Lobo', cr: 1/4, hp: 11, ac: 13, type: 'Animal', XP: 100 },
    { name: 'Troll', cr: 5, hp: 84, ac: 15, type: 'Gigante', XP: 1600 },
    { name: 'Dragão Vermelho Jovem', cr: 10, hp: 178, ac: 18, type: 'Dragão', XP: 9600 },
  ];
  res.json(monsters);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao iniciar o DB', err);
  });
