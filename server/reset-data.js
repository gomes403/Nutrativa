const { createDataStore } = require("./db");

async function main() {
  const dataStore = createDataStore();
  try {
    await dataStore.init();
    await dataStore.reset();
    console.log("Dados locais resetados a partir do estado inicial.");
  } finally {
    await dataStore.destroy();
  }
}

main().catch((error) => {
  console.error("Falha ao resetar a base local:", error);
  process.exit(1);
});
