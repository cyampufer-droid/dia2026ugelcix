import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'dia2026-offline';
const DB_VERSION = 1;
const STORE_DIGITACION = 'digitacion_pendiente';

interface PendingDigitacion {
  id: string; // `${estudianteId}_${evaluacionId}`
  estudiante_id: string;
  evaluacion_id: string;
  respuestas: string[];
  timestamp: number;
  synced: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_DIGITACION)) {
          const store = db.createObjectStore(STORE_DIGITACION, { keyPath: 'id' });
          store.createIndex('synced', 'synced');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveDigitacionOffline(
  estudianteId: string,
  evaluacionId: string,
  respuestas: string[]
): Promise<void> {
  const db = await getDb();
  const record: PendingDigitacion = {
    id: `${estudianteId}_${evaluacionId}`,
    estudiante_id: estudianteId,
    evaluacion_id: evaluacionId,
    respuestas,
    timestamp: Date.now(),
    synced: false,
  };
  await db.put(STORE_DIGITACION, record);
}

export async function getPendingDigitaciones(): Promise<PendingDigitacion[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_DIGITACION);
  return all.filter((r: PendingDigitacion) => !r.synced);
}

export async function markAsSynced(id: string): Promise<void> {
  const db = await getDb();
  const record = await db.get(STORE_DIGITACION, id);
  if (record) {
    record.synced = true;
    await db.put(STORE_DIGITACION, record);
  }
}

export async function getAllDigitaciones(): Promise<PendingDigitacion[]> {
  const db = await getDb();
  return db.getAll(STORE_DIGITACION);
}

export async function clearSyncedRecords(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_DIGITACION, 'readwrite');
  const store = tx.objectStore(tx.objectStoreNames[0]);
  const allRecords = await store.getAll();
  for (const record of allRecords) {
    if (record.synced) {
      await store.delete(record.id);
    }
  }
  await tx.done;
}
