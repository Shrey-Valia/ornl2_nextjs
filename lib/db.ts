import Database from 'better-sqlite3';
import path from 'path';

// Create database file in project root
const dbPath = path.join(process.cwd(), 'predictions.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      m REAL NOT NULL,
      s REAL NOT NULL,
      i REAL NOT NULL,
      temp REAL NOT NULL,
      time REAL NOT NULL,
      reaction REAL NOT NULL,
      conversion REAL NOT NULL,
      mn REAL NOT NULL,
      mw REAL NOT NULL,
      mz REAL NOT NULL,
      mz_plus_1 REAL NOT NULL,
      mv REAL NOT NULL,
      mwd_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_timestamp ON predictions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_created_at ON predictions(created_at);
  `);
}

// Call on startup
initializeDatabase();

export type PredictionData = {
  id: string;
  timestamp: string;
  inputs: {
    M: number;
    S: number;
    I: number;
    temp: number;
    time: number;
    Reaction: number;
  };
  outputs: {
    conversion: number;
    mn: number;
    mw: number;
    mz: number;
    mzPlus1: number;
    mv: number;
  };
  mwdData: Array<{ mw: number; predicted: number }>;
};

// Save a prediction
export function savePrediction(prediction: PredictionData): boolean {
  try {
    const stmt = db.prepare(`
      INSERT INTO predictions (
        id, timestamp, m, s, i, temp, time, reaction,
        conversion, mn, mw, mz, mz_plus_1, mv, mwd_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      prediction.id,
      prediction.timestamp,
      prediction.inputs.M,
      prediction.inputs.S,
      prediction.inputs.I,
      prediction.inputs.temp,
      prediction.inputs.time,
      prediction.inputs.Reaction,
      prediction.outputs.conversion,
      prediction.outputs.mn,
      prediction.outputs.mw,
      prediction.outputs.mz,
      prediction.outputs.mzPlus1,
      prediction.outputs.mv,
      JSON.stringify(prediction.mwdData)
    );

    return true;
  } catch (error) {
    console.error('Error saving prediction:', error);
    return false;
  }
}

// Get all predictions
export function getAllPredictions(): PredictionData[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM predictions ORDER BY created_at DESC
    `);

    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      inputs: {
        M: row.m,
        S: row.s,
        I: row.i,
        temp: row.temp,
        time: row.time,
        Reaction: row.reaction,
      },
      outputs: {
        conversion: row.conversion,
        mn: row.mn,
        mw: row.mw,
        mz: row.mz,
        mzPlus1: row.mz_plus_1,
        mv: row.mv,
      },
      mwdData: JSON.parse(row.mwd_data),
    }));
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
}

// Get single prediction
export function getPrediction(id: string): PredictionData | null {
  try {
    const stmt = db.prepare(`
      SELECT * FROM predictions WHERE id = ?
    `);

    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      timestamp: row.timestamp,
      inputs: {
        M: row.m,
        S: row.s,
        I: row.i,
        temp: row.temp,
        time: row.time,
        Reaction: row.reaction,
      },
      outputs: {
        conversion: row.conversion,
        mn: row.mn,
        mw: row.mw,
        mz: row.mz,
        mzPlus1: row.mz_plus_1,
        mv: row.mv,
      },
      mwdData: JSON.parse(row.mwd_data),
    };
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return null;
  }
}

// Delete prediction
export function deletePrediction(id: string): boolean {
  try {
    const stmt = db.prepare('DELETE FROM predictions WHERE id = ?');
    stmt.run(id);
    return true;
  } catch (error) {
    console.error('Error deleting prediction:', error);
    return false;
  }
}

// Delete all predictions
export function deleteAllPredictions(): boolean {
  try {
    db.prepare('DELETE FROM predictions').run();
    return true;
  } catch (error) {
    console.error('Error deleting all predictions:', error);
    return false;
  }
}

// Get statistics
export function getStatistics() {
  try {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        AVG(conversion) as avg_conversion,
        AVG(mw) as avg_mw,
        MIN(mw) as min_mw,
        MAX(mw) as max_mw,
        AVG(temp) as avg_temp
      FROM predictions
    `);

    const result = stmt.get() as any;

    return {
      total: result.total || 0,
      avgConversion: result.avg_conversion || 0,
      avgMw: result.avg_mw || 0,
      minMw: result.min_mw || 0,
      maxMw: result.max_mw || 0,
      avgTemp: result.avg_temp || 0,
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return {
      total: 0,
      avgConversion: 0,
      avgMw: 0,
      minMw: 0,
      maxMw: 0,
      avgTemp: 0,
    };
  }
}

export default db;