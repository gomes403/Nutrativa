const fs = require("fs");
const path = require("path");
const knexFactory = require("knex");
const { arrayCollections, createEmptyStore, normalizeStore } = require("./store-utils");

const schemaVersion = "1";

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJsonFile(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, value) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function createKnexConfig(config) {
  if (config.client === "mysql" || config.client === "mysql2") {
    return {
      client: "mysql2",
      connection: {
        host: config.mysqlHost,
        port: config.mysqlPort,
        user: config.mysqlUser,
        password: config.mysqlPassword,
        database: config.mysqlDatabase,
      },
      pool: { min: 0, max: 10 },
    };
  }

  ensureParentDir(config.sqliteFile);
  return {
    client: "sqlite3",
    connection: {
      filename: config.sqliteFile,
    },
    useNullAsDefault: true,
  };
}

function createDataStore(options = {}) {
  const config = {
    client: process.env.DB_CLIENT || "sqlite",
    sqliteFile: options.sqliteFile || process.env.SQLITE_FILE || path.join(__dirname, "..", "data", "app.sqlite"),
    legacyJsonFile: options.legacyJsonFile || path.join(__dirname, "..", "data", "store.json"),
    legacyBackupFile: options.legacyBackupFile || path.join(__dirname, "..", "data", "store.pre-sqlite-backup.json"),
    initialStateFile: options.initialStateFile || path.join(__dirname, "..", "data", "initial-state.json"),
    mysqlHost: process.env.MYSQL_HOST || "127.0.0.1",
    mysqlPort: Number(process.env.MYSQL_PORT || 3306),
    mysqlUser: process.env.MYSQL_USER || "root",
    mysqlPassword: process.env.MYSQL_PASSWORD || "",
    mysqlDatabase: process.env.MYSQL_DATABASE || "abdesm",
  };

  const knex = knexFactory(createKnexConfig(config));

  async function ensureSchema() {
    const hasRecordsTable = await knex.schema.hasTable("records");
    if (!hasRecordsTable) {
      await knex.schema.createTable("records", (table) => {
        table.string("collection_name", 80).notNullable();
        table.string("record_id", 120).notNullable();
        table.integer("position").notNullable().defaultTo(0);
        table.text("payload", "longtext").notNullable();
        table.string("created_at", 40).notNullable();
        table.string("updated_at", 40).notNullable();
        table.primary(["collection_name", "record_id"]);
        table.index(["collection_name", "position"], "records_collection_position_idx");
      });
    }

    const hasMetaTable = await knex.schema.hasTable("app_meta");
    if (!hasMetaTable) {
      await knex.schema.createTable("app_meta", (table) => {
        table.string("meta_key", 120).primary();
        table.text("meta_value", "longtext").notNullable();
      });
    }
  }

  async function setMeta(metaKey, value, trx = knex) {
    const payload = JSON.stringify(value);
    const existing = await trx("app_meta").where({ meta_key: metaKey }).first();
    if (existing) {
      await trx("app_meta").where({ meta_key: metaKey }).update({ meta_value: payload });
      return;
    }
    await trx("app_meta").insert({ meta_key: metaKey, meta_value: payload });
  }

  async function getMeta(metaKey) {
    const row = await knex("app_meta").where({ meta_key: metaKey }).first();
    if (!row) return null;
    try {
      return JSON.parse(row.meta_value);
    } catch {
      return row.meta_value;
    }
  }

  async function listCollection(collectionName) {
    const rows = await knex("records")
      .where({ collection_name: collectionName })
      .orderBy("position", "asc")
      .orderBy("created_at", "asc");

    return rows.map((row) => JSON.parse(row.payload));
  }

  async function getCollectionItem(collectionName, id) {
    const row = await knex("records")
      .where({ collection_name: collectionName, record_id: String(id) })
      .first();

    return row ? JSON.parse(row.payload) : null;
  }

  async function nextPosition(collectionName, trx = knex) {
    const row = await trx("records")
      .where({ collection_name: collectionName })
      .max({ maxPosition: "position" })
      .first();

    const currentMax = Number(row?.maxPosition);
    return Number.isFinite(currentMax) ? currentMax + 1 : 0;
  }

  async function exportStore() {
    const store = createEmptyStore();

    for (const collectionName of arrayCollections) {
      store[collectionName] = await listCollection(collectionName);
    }

    const settingsRow = await getCollectionItem("settings", "settings");
    store.settings = settingsRow || createEmptyStore().settings;

    return normalizeStore(store);
  }

  async function syncLegacyJsonSnapshot() {
    writeJsonFile(config.legacyJsonFile, await exportStore());
  }

  async function replaceStore(nextStore, trx = null) {
    const normalizedStore = normalizeStore(nextStore);
    const executor = trx || knex;

    await executor.transaction(async (transaction) => {
      await transaction("records").del();

      for (const collectionName of arrayCollections) {
        const rows = normalizedStore[collectionName] || [];
        for (const [index, item] of rows.entries()) {
          const timestamp = item.updatedAt || item.createdAt || new Date().toISOString();
          await transaction("records").insert({
            collection_name: collectionName,
            record_id: String(item.id),
            position: index,
            payload: JSON.stringify(item),
            created_at: item.createdAt || timestamp,
            updated_at: timestamp,
          });
        }
      }

      await transaction("records").insert({
        collection_name: "settings",
        record_id: "settings",
        position: 0,
        payload: JSON.stringify(normalizedStore.settings || createEmptyStore().settings),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await setMeta("schemaVersion", schemaVersion, transaction);
      await setMeta("lastImportAt", new Date().toISOString(), transaction);
    });

    await syncLegacyJsonSnapshot();
  }

  async function ensureSeedData() {
    const row = await knex("records").count({ total: "*" }).first();
    const totalRecords = Number(row?.total || 0);
    if (totalRecords > 0) {
      await syncLegacyJsonSnapshot();
      return;
    }

    const legacyStore = readJsonFile(config.legacyJsonFile, null);
    const initialState = readJsonFile(config.initialStateFile, createEmptyStore());
    const sourceStore = legacyStore || initialState;

    if (legacyStore && !fs.existsSync(config.legacyBackupFile)) {
      fs.copyFileSync(config.legacyJsonFile, config.legacyBackupFile);
    }

    await replaceStore(sourceStore);
  }

  async function init() {
    await ensureSchema();
    await ensureSeedData();
  }

  return {
    config,
    async destroy() {
      await knex.destroy();
    },
    async readStore() {
      return exportStore();
    },
    async getCollection(collectionName) {
      return listCollection(collectionName);
    },
    async clearCollection(collectionName) {
      await knex("records").where({ collection_name: collectionName }).del();
      await syncLegacyJsonSnapshot();
    },
    async getCollectionItem(collectionName, id) {
      return getCollectionItem(collectionName, id);
    },
    async createCollectionItem(collectionName, item) {
      const timestamp = item.updatedAt || item.createdAt || new Date().toISOString();
      const position = await nextPosition(collectionName);
      await knex("records").insert({
        collection_name: collectionName,
        record_id: String(item.id),
        position,
        payload: JSON.stringify(item),
        created_at: item.createdAt || timestamp,
        updated_at: timestamp,
      });
      await syncLegacyJsonSnapshot();
      return item;
    },
    async updateCollectionItem(collectionName, id, item) {
      const existing = await knex("records")
        .where({ collection_name: collectionName, record_id: String(id) })
        .first();

      if (!existing) return null;

      await knex("records")
        .where({ collection_name: collectionName, record_id: String(id) })
        .update({
          payload: JSON.stringify(item),
          updated_at: item.updatedAt || new Date().toISOString(),
        });

      await syncLegacyJsonSnapshot();
      return item;
    },
    async deleteCollectionItem(collectionName, id) {
      const affectedRows = await knex("records")
        .where({ collection_name: collectionName, record_id: String(id) })
        .del();

      if (!affectedRows) return false;

      await syncLegacyJsonSnapshot();
      return true;
    },
    async updateSettings(patch) {
      const currentSettings = await getCollectionItem("settings", "settings") || createEmptyStore().settings;
      const nextSettings = { ...currentSettings, ...patch };
      const exists = await getCollectionItem("settings", "settings");

      if (exists) {
        await knex("records")
          .where({ collection_name: "settings", record_id: "settings" })
          .update({
            payload: JSON.stringify(nextSettings),
            updated_at: new Date().toISOString(),
          });
      } else {
        await knex("records").insert({
          collection_name: "settings",
          record_id: "settings",
          position: 0,
          payload: JSON.stringify(nextSettings),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await syncLegacyJsonSnapshot();
      return nextSettings;
    },
    async reset() {
      const initialState = readJsonFile(config.initialStateFile, createEmptyStore());
      await replaceStore(initialState);
      return exportStore();
    },
    async initAndRead() {
      await init();
      return exportStore();
    },
    init,
    getMeta,
  };
}

module.exports = {
  createDataStore,
};
