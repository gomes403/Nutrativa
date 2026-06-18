const defaultSettings = {
  systemName: "ABDESM",
  version: "1.6.0-beta.260105",
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
  maintenanceMode: false,
};

const arrayCollections = [
  "schools",
  "students",
  "users",
  "years",
  "campaigns",
  "nutritionists",
  "evaluations",
];

function normalizeSchoolRows(rows = []) {
  let nextSchoolCodeValue = 1;
  return rows.map((school) => {
    const schoolCode = Number(school.schoolCode);
    const normalizedCode = Number.isInteger(schoolCode) && schoolCode > 0 ? schoolCode : nextSchoolCodeValue;
    nextSchoolCodeValue = Math.max(nextSchoolCodeValue, normalizedCode + 1);
    return { ...school, schoolCode: normalizedCode };
  });
}

function createEmptyStore() {
  return {
    schools: [],
    students: [],
    users: [],
    years: [],
    campaigns: [],
    nutritionists: [],
    evaluations: [],
    settings: { ...defaultSettings },
  };
}

function normalizeStore(store = {}) {
  const nextStore = createEmptyStore();

  for (const collectionName of arrayCollections) {
    nextStore[collectionName] = Array.isArray(store[collectionName]) ? [...store[collectionName]] : [];
  }

  nextStore.schools = normalizeSchoolRows(nextStore.schools);
  nextStore.settings = { ...defaultSettings, ...(store.settings || {}) };

  return nextStore;
}

module.exports = {
  arrayCollections,
  createEmptyStore,
  defaultSettings,
  normalizeSchoolRows,
  normalizeStore,
};
