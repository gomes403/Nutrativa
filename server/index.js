const cors = require("cors");
const { randomUUID } = require("crypto");
const express = require("express");
const { createDataStore } = require("./db");

const app = express();
const port = Number(process.env.API_PORT || 3001);
const cfnBaseUrl = "https://cfn.org.br";
const cfnNewsApiUrl = `${cfnBaseUrl}/wp-json/wp/v2/posts?per_page=4&_fields=link,date,title,excerpt`;
const newsCacheTtlMs = 15 * 60 * 1000;
const authSessions = new Map();
const dataStore = createDataStore();
let latestNewsCache = { items: [], fetchedAt: 0 };
const authUser = {
  id: "admin-local",
  login: process.env.AUTH_LOGIN || "admin",
  password: process.env.AUTH_PASSWORD || "123456",
  name: "Administrador",
  profile: "Administrador",
};

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function nextSchoolCode(rows = []) {
  return rows.reduce((maxCode, school) => Math.max(maxCode, Number(school.schoolCode) || 0), 0) + 1;
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&hellip;/g, "...")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNewsLink(link) {
  if (!link) return cfnBaseUrl;
  return String(link).startsWith("http") ? String(link) : `${cfnBaseUrl}${link}`;
}

async function fetchLatestCfnNews() {
  if (latestNewsCache.fetchedAt && Date.now() - latestNewsCache.fetchedAt < newsCacheTtlMs) {
    return latestNewsCache.items;
  }

  try {
    const response = await fetch(cfnNewsApiUrl);
    if (!response.ok) throw new Error("CFN news unavailable");
    const payload = await response.json();
    const items = Array.isArray(payload) ? payload.map((item) => ({
      title: stripHtml(item?.title?.rendered),
      excerpt: stripHtml(item?.excerpt?.rendered),
      date: item?.date || "",
      link: normalizeNewsLink(item?.link),
    })) : [];

    latestNewsCache = { items, fetchedAt: Date.now() };
    return items;
  } catch {
    return latestNewsCache.items || [];
  }
}

function serializeAuthUser(user) {
  return {
    id: user.id,
    login: user.login || user.email || "",
    name: user.name || "Usuario",
    profile: user.profile || "Usuario",
  };
}

function sanitizeUserRecord(user) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

function sanitizeCollectionPayload(name, value) {
  if (name === "users") {
    if (Array.isArray(value)) return value.map(sanitizeUserRecord);
    return sanitizeUserRecord(value);
  }
  return value;
}

function normalizeLogin(value) {
  return String(value || "").trim().toLowerCase();
}

function findAuthenticableUser(login, store) {
  if (normalizeLogin(authUser.login) === login) return authUser;

  return (store.users || []).find((user) => {
    const possibleLogins = [user.login, user.email].map(normalizeLogin).filter(Boolean);
    return possibleLogins.includes(login);
  }) || null;
}

function createSession(user) {
  const token = randomUUID();
  authSessions.set(token, { userId: user.id, user: serializeAuthUser(user), createdAt: Date.now() });
  return token;
}

function listActiveUsers() {
  const latestByUserId = new Map();

  for (const [token, session] of authSessions.entries()) {
    if (!session?.location || !Number.isFinite(Number(session.location.latitude)) || !Number.isFinite(Number(session.location.longitude))) {
      continue;
    }

    const user = session.user || serializeAuthUser(authUser);
    const capturedAt = new Date(session.location.capturedAt || session.createdAt || Date.now()).getTime();
    const normalizedSession = {
      sessionKey: token.slice(0, 8),
      user,
      location: {
        latitude: Number(session.location.latitude),
        longitude: Number(session.location.longitude),
        accuracy: Number.isFinite(Number(session.location.accuracy)) ? Number(session.location.accuracy) : null,
        capturedAt: session.location.capturedAt || null,
      },
      _capturedAt: capturedAt,
    };

    const existing = latestByUserId.get(user.id);
    if (!existing || normalizedSession._capturedAt >= existing._capturedAt) {
      latestByUserId.set(user.id, normalizedSession);
    }
  }

  return Array.from(latestByUserId.values())
    .sort((a, b) => b._capturedAt - a._capturedAt)
    .map(({ _capturedAt, ...item }) => item);
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  const session = token ? authSessions.get(token) : null;
  if (!token || !session) {
    return res.status(401).json({ error: "Autenticacao obrigatoria." });
  }

  req.authToken = token;
  req.authUser = session.user || serializeAuthUser(authUser);
  next();
}

function collectionRoute(name) {
  app.get(`/api/${name}`, async (_req, res) => {
    const rows = await dataStore.getCollection(name);
    res.json(sanitizeCollectionPayload(name, rows));
  });

  app.delete(`/api/${name}`, async (_req, res) => {
    await dataStore.clearCollection(name);
    res.status(204).end();
  });

  app.get(`/api/${name}/:id`, async (req, res) => {
    const item = await dataStore.getCollectionItem(name, req.params.id);
    if (!item) return res.status(404).json({ error: "Registro nao encontrado." });
    res.json(sanitizeCollectionPayload(name, item));
  });

  app.post(`/api/${name}`, async (req, res) => {
    const rows = await dataStore.getCollection(name);
    const item = {
      id: req.body.id || randomUUID(),
      ...req.body,
      ...(name === "schools" ? { schoolCode: nextSchoolCode(rows) } : {}),
    };

    await dataStore.createCollectionItem(name, item);
    res.status(201).json(sanitizeCollectionPayload(name, item));
  });

  app.put(`/api/${name}/:id`, async (req, res) => {
    const currentItem = await dataStore.getCollectionItem(name, req.params.id);
    if (!currentItem) return res.status(404).json({ error: "Registro nao encontrado." });

    const item = { ...currentItem, ...req.body, id: currentItem.id };
    await dataStore.updateCollectionItem(name, req.params.id, item);
    res.json(sanitizeCollectionPayload(name, item));
  });

  app.delete(`/api/${name}/:id`, async (req, res) => {
    const deleted = await dataStore.deleteCollectionItem(name, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Registro nao encontrado." });
    res.status(204).end();
  });
}

app.get("/api/health", async (_req, res) => {
  const schemaVersion = await dataStore.getMeta("schemaVersion");
  res.json({
    ok: true,
    service: "abdesm-local-api",
    database: {
      client: dataStore.config.client === "sqlite" ? "sqlite" : "mysql2",
      schemaVersion: schemaVersion || "1",
    },
  });
});

app.post("/api/auth/login", async (req, res) => {
  const store = await dataStore.readStore();
  const login = normalizeLogin(req.body?.login);
  const password = String(req.body?.password || "");
  const user = findAuthenticableUser(login, store);

  if (!user || String(user.password || "") !== password) {
    return res.status(401).json({ error: "Login ou senha invalidos." });
  }

  const consent = req.body?.consent || {};
  const location = req.body?.location || {};
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const accuracy = Number(location.accuracy);

  if (!consent.locationAccepted) {
    return res.status(403).json({ error: "A coleta de localizacao precisa ser aceita para liberar o login." });
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(403).json({ error: "Localizacao invalida ou nao informada." });
  }

  const token = createSession(user);
  authSessions.set(token, {
    ...(authSessions.get(token) || {}),
    location: {
      latitude,
      longitude,
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
      capturedAt: location.capturedAt || new Date().toISOString(),
    },
    consent: {
      optionalCookiesAccepted: !!consent.optionalCookiesAccepted,
      locationAccepted: true,
    },
  });

  res.json({ token, user: serializeAuthUser(user) });
});

app.use("/api", requireAuth);

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.authUser });
});

app.post("/api/auth/logout", (req, res) => {
  authSessions.delete(req.authToken);
  res.json({ ok: true });
});

app.get("/api/bootstrap", async (_req, res) => {
  const store = await dataStore.readStore();
  const schools = store.schools || [];
  const students = store.students || [];
  const users = store.users || [];
  const nutritionists = store.nutritionists || [];
  const evaluations = store.evaluations || [];
  const news = await fetchLatestCfnNews();
  const activeUsers = listActiveUsers();
  const studentsByYearMap = students.reduce((acc, student) => {
    const key = student.grade || student.serie || "Sem serie";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  res.json({
    ...store,
    users: sanitizeCollectionPayload("users", users),
    news,
    activeUsers,
    newsSource: {
      label: "CFN - Conselho Federal de Nutrição",
      url: `${cfnBaseUrl}/noticias/`,
    },
    dashboard: {
      schools: schools.length,
      students: students.length,
      nutritionists: nutritionists.length,
      users: users.length,
      studentsByYear: Object.entries(studentsByYearMap).map(([label, total]) => ({ label, total })),
      topSchools: schools
        .slice()
        .map((school) => ({
          ...school,
          students: students.filter((student) => String(student.schoolId || student.escola_id) === String(school.id)).length,
        }))
        .sort((a, b) => Number(b.students || 0) - Number(a.students || 0))
        .slice(0, 5),
      recentEvaluations: evaluations.slice(-5).reverse(),
    },
  });
});

app.put("/api/settings", async (req, res) => {
  const settings = await dataStore.updateSettings(req.body);
  res.json(settings);
});

app.post("/api/reset", async (_req, res) => {
  await dataStore.reset();
  res.json({ ok: true });
});

app.put("/api/users/:id/password", async (req, res) => {
  if (req.authUser?.profile !== "Administrador") {
    return res.status(403).json({ error: "Somente administradores podem redefinir senhas." });
  }

  const nextPassword = String(req.body?.password || "").trim();
  if (nextPassword.length < 6) {
    return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  const user = await dataStore.getCollectionItem("users", req.params.id);
  if (!user) {
    return res.status(404).json({ error: "Usuario nao encontrado." });
  }

  const updatedUser = { ...user, password: nextPassword };
  await dataStore.updateCollectionItem("users", req.params.id, updatedUser);

  res.json({ ok: true, user: sanitizeUserRecord(updatedUser) });
});

["schools", "students", "users", "years", "campaigns", "nutritionists", "evaluations"].forEach(collectionRoute);

async function start() {
  await dataStore.init();
  app.listen(port, () => {
    console.log(`ABDESM local API running at http://127.0.0.1:${port}`);
    console.log(`Database client: ${dataStore.config.client === "sqlite" ? "sqlite" : "mysql2"}`);
  });
}

start().catch((error) => {
  console.error("Falha ao iniciar a API local:", error);
  process.exit(1);
});
