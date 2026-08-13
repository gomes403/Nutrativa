const { createDataStore } = require("../server/db");

(async () => {
  const dataStore = createDataStore();
  await dataStore.init();
  const store = await dataStore.readStore();
  const keys = ["schools", "students", "users", "years", "campaigns", "nutritionists", "evaluations"];
  console.log(JSON.stringify({
    client: dataStore.config.client,
    counts: Object.fromEntries(keys.map((key) => [key, (store[key] || []).length])),
    users: (store.users || []).map((user) => ({ id: user.id, login: user.login, name: user.name, profile: user.profile, status: user.status })),
  }, null, 2));
  await dataStore.destroy();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
