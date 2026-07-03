import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BarChart3,
  Bold,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Download,
  Edit,
  Eye,
  FileBarChart,
  FileText,
  Globe2,
  GraduationCap,
  Image as ImageIcon,
  Italic,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  PlusCircle,
  Redo2,
  Save,
  Search,
  Settings,
  Table2,
  Trash2,
  Underline,
  Undo2,
  Upload,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import {
  BarElement,
  BarController,
  CategoryScale,
  Chart as ChartJS,
  ArcElement,
  LinearScale,
  Legend,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import "leaflet/dist/leaflet.css";
import {
  buildBmiSummary,
  buildBmiGrowthChartModel,
  calculateAgeOnDate,
  calculateBmi,
  evaluateAnthropometricStatus,
} from "./anthropometry";
import "./styles.css";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, LineController, LineElement, PointElement, ArcElement, Tooltip, Legend);

const apiBase = "";
const authStorageKey = "abdesm-auth-token";
const consentStorageKey = "abdesm-login-consent";
const emptyData = {
  schools: [],
  students: [],
  users: [],
  years: [],
  campaigns: [],
  nutritionists: [],
  evaluations: [],
  news: [],
  activeUsers: [],
  newsSource: {
    label: "CFN - Conselho Federal de Nutrição",
    url: "https://cfn.org.br/noticias/",
  },
  dashboard: {
    schools: 0,
    students: 0,
    nutritionists: 0,
    users: 0,
    studentsByYear: [],
    topSchools: [],
    recentEvaluations: [],
  },
  settings: {
    systemName: "NUTRATIVA",
    version: "2026.06 Local",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    maintenanceMode: false,
    sidebarColor: "Verde grafite",
    logo: "",
    companyName: "",
    tradeName: "",
    document: "",
    phone: "",
    email: "",
    address: "",
  },
};

const defaultConsentState = {
  optionalCookiesAccepted: false,
  locationAccepted: false,
  location: null,
  dismissedOptional: false,
};

const DataContext = React.createContext(null);

const adminMenu = [
  { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
  { label: "Escolas", icon: Building2, children: [["Lista", "/escolas"], ["Cadastro", "/escolas/create"]] },
  { label: "Alunos", icon: GraduationCap, children: [["Lista", "/alunos"], ["Cadastro", "/alunos/create"]] },
  { label: "Usuarios", icon: Users, children: [["Lista", "/usuarios"], ["Cadastro", "/usuarios/create"]] },
  { label: "Anos Letivos", icon: CalendarDays, children: [["Lista", "/anos"], ["Cadastro", "/anos/create"]] },
  { label: "Campanhas", icon: Megaphone, children: [["Lista", "/campanhas"], ["Cadastro", "/campanhas/create"]] },
  { label: "Vinculo", icon: UserCog, children: [["Lista", "/nutricionistas"], ["Cadastro", "/nutricionistas/create"]] },
  { label: "Relatorios", icon: FileText, path: "/relatorios" },
];

const nutritionistMenu = [
  { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
  { label: "Escolas", icon: Building2, path: "/escolas" },
  { label: "Avaliacoes", icon: ClipboardList, path: "/avaliacoes" },
];

const educationTypeOptions = [
  ["", "Selecione"],
  ["Educacao Infantil", "Educacao Infantil"],
  ["Ensino Fundamental I", "Ensino Fundamental I"],
  ["Ensino Fundamental II", "Ensino Fundamental II"],
  ["Ensino Medio", "Ensino Medio"],
  ["EJA", "EJA"],
];

const gradesByEducationType = {
  "Educacao Infantil": ["Bercario", "Maternal", "Maternal I", "Maternal II", "Maternalzinho", "Nivel 1", "Nivel 2", "Nivel 3", "Nivel 4", "Nivel 5"],
  "Ensino Fundamental I": ["1o Ano", "2o Ano", "3o Ano", "4o Ano", "5o Ano"],
  "Ensino Fundamental II": ["6o Ano", "7o Ano", "8o Ano", "9o Ano"],
  "Ensino Medio": ["1o Ano", "2o Ano", "3o Ano"],
  EJA: ["Modulo I", "Modulo II", "Modulo III", "Modulo IV", "Modulo V", "Modulo VI", "Modulo VII", "Modulo VIII", "Modulo IX", "Modulo X"],
};

const evaluationSectionDefaults = {
  eatingHabits: {
    enabled: true,
    friedFoods: false,
    skipMeals: false,
    sweets: false,
    lowWater: false,
    dailyFruit: false,
    notes: "",
  },
  medications: {
    enabled: false,
    items: "",
    notes: "",
  },
  allergies: {
    enabled: false,
    lactose: false,
    gluten: false,
    eggs: false,
    peanuts: false,
    dyes: false,
    notes: "",
  },
  record24h: {
    enabled: true,
    breakfast: "",
    morningSnack: "",
    lunch: "",
    afternoonSnack: "",
    dinner: "",
    supper: "",
    beverages: "",
  },
  familyHistory: {
    enabled: false,
    notes: "",
  },
  clinicalSigns: {
    enabled: false,
    notes: "",
  },
  diagnosis: {
    enabled: true,
    notes: "",
  },
  mealPlan: {
    enabled: false,
    preset: "Plano Equilibrado",
    customFoods: "",
    breakfast: "",
    snacks: "",
    lunchDinner: "",
    beverages: "",
    weeklyPlan: "",
  },
};

const studentCsvAliases = {
  name: ["nome", "nome completo", "aluno", "student"],
  cpf: ["cpf"],
  birthDate: ["data de nascimento", "nascimento", "birthdate", "data_nascimento"],
  sex: ["sexo", "sex"],
  phone: ["telefone", "fone", "celular", "phone"],
  email: ["email", "e-mail"],
  responsible: ["responsavel", "responsavel legal", "pai_mae", "guardian"],
  school: ["escola", "school", "nome da escola"],
  schoolId: ["escola id", "schoolid", "school id", "id escola", "escola_id", "school_id"],
  registration: ["matricula", "registro", "registration"],
  shift: ["turno", "shift"],
  educationType: ["tipo de ensino", "ensino", "educationtype", "education type", "tipo_ensino"],
  grade: ["serie", "série", "ano", "grade"],
  classroom: ["turma", "class", "sala"],
};

function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || "/login");
  useEffect(() => {
    const update = () => setRoute(window.location.hash.replace("#", "") || "/login");
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return [route, (path) => { window.location.hash = path; }];
}

function useAppData() {
  const context = React.useContext(DataContext);
  if (!context) throw new Error("DataContext indisponivel");
  return context;
}

function App() {
  const [route, go] = useRoute();
  const [data, setData] = useState(emptyData);
  const [toast, setToast] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem(authStorageKey) || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [consentState, setConsentState] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(consentStorageKey) || "null");
      return saved ? { ...defaultConsentState, ...saved } : defaultConsentState;
    } catch {
      return defaultConsentState;
    }
  });
  const activeCampaign = useMemo(() => getActiveCampaign(data.campaigns), [data.campaigns]);

  const showToast = (text, type = "success") => {
    setToast({ text, type, id: Date.now() });
  };

  const persistAuthToken = (token) => {
    if (token) window.localStorage.setItem(authStorageKey, token);
    else window.localStorage.removeItem(authStorageKey);
    setAuthToken(token || "");
  };

  const persistConsentState = (nextState) => {
    window.localStorage.setItem(consentStorageKey, JSON.stringify(nextState));
    setConsentState(nextState);
  };

  const clearSession = () => {
    persistAuthToken("");
    setCurrentUser(null);
    setData(emptyData);
    setApiUnavailable(false);
    setIsBootstrapping(false);
  };

  const updateConsentState = (updates) => {
    const nextState = typeof updates === "function" ? updates(consentState) : { ...consentState, ...updates };
    persistConsentState(nextState);
    return nextState;
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const readError = async (response, fallback) => {
    try {
      const payload = await response.json();
      return payload.error || fallback;
    } catch {
      return fallback;
    }
  };

  const apiFetch = async (path, options = {}, { token = authToken, allowUnauthorized = false } = {}) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${apiBase}${path}`, { ...options, headers });
    if (response.status === 401 && !allowUnauthorized) {
      clearSession();
      setLoginError("Sua sessao expirou. Entre novamente.");
      go("/login");
      showToast("Sua sessao expirou. Entre novamente.", "error");
    }
    return response;
  };

  const refresh = async (token = authToken) => {
    if (!token) {
      setData(emptyData);
      setApiUnavailable(false);
      setIsBootstrapping(false);
      return false;
    }

    setIsBootstrapping(true);
    try {
      const response = await apiFetch("/api/bootstrap", {}, { token });
      if (response.status === 401) return false;
      if (!response.ok) throw new Error("API indisponivel");
      const payload = await response.json();
      setData({ ...emptyData, ...payload, settings: { ...emptyData.settings, ...(payload.settings || {}) } });
      setApiUnavailable(false);
      return true;
    } catch {
      setData(emptyData);
      setApiUnavailable(true);
      return false;
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (!authToken) {
        setAuthReady(true);
        return;
      }

      setIsAuthenticating(true);
      try {
        const response = await apiFetch("/api/auth/me", {}, { token: authToken, allowUnauthorized: true });
        if (!active) return;
        if (!response.ok) {
          clearSession();
          setAuthReady(true);
          return;
        }

        const payload = await response.json();
        if (!active) return;
        setCurrentUser(payload.user);
        setLoginError("");
        await refresh(authToken);
      } catch {
        if (!active) return;
        clearSession();
        setLoginError("Nao foi possivel validar sua sessao.");
      } finally {
        if (!active) return;
        setIsAuthenticating(false);
        setAuthReady(true);
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (currentUser && route === "/login") go("/dashboard");
    if (!currentUser && route !== "/login") go("/login");
  }, [authReady, currentUser, route, go]);

  useEffect(() => {
    const systemName = data.settings?.systemName || "NUTRATIVA";
    const viewLabel = currentUser ? resolveRouteLabel(route) : "Login";
    document.title = `${systemName} | ${viewLabel}`;
  }, [currentUser, data.settings, route]);

  const requestRealLocation = async () => {
    if (!("geolocation" in navigator)) {
      throw new Error("Este navegador nao suporta geolocalizacao.");
    }

    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt: new Date().toISOString(),
          });
        },
        () => reject(new Error("Nao foi possivel coletar a localizacao real deste acesso.")),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  };

  const acceptLocationConsent = async () => {
    try {
      const location = await requestRealLocation();
      updateConsentState((current) => ({
        ...current,
        optionalCookiesAccepted: true,
        dismissedOptional: false,
        locationAccepted: true,
        location,
      }));
      setLoginError("");
      showToast("Localizacao coletada. O login foi liberado.");
      return true;
    } catch (error) {
      setLoginError(error.message || "Nao foi possivel liberar o login.");
      showToast(error.message || "Nao foi possivel liberar o login.", "error");
      return false;
    }
  };

  const rejectOptionalCookies = () => {
    updateConsentState((current) => ({
      ...current,
      optionalCookiesAccepted: false,
      dismissedOptional: true,
    }));
    setLoginError("O login continua bloqueado ate a coleta de localizacao ser aceita.");
    showToast("Cookies opcionais recusados. Aceite a localizacao para continuar.", "error");
  };

  const authenticate = async ({ login, password }) => {
    if (!consentState.locationAccepted || !consentState.location) {
      const message = "Aceite a coleta de localizacao para liberar o login.";
      setLoginError(message);
      showToast(message, "error");
      return false;
    }

    setIsAuthenticating(true);
    setLoginError("");
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          password,
          consent: {
            optionalCookiesAccepted: consentState.optionalCookiesAccepted,
            locationAccepted: consentState.locationAccepted,
          },
          location: consentState.location,
        }),
      });
      if (!response.ok) {
        setLoginError(await readError(response, "Nao foi possivel entrar."));
        return false;
      }

      const payload = await response.json();
      persistAuthToken(payload.token);
      setCurrentUser(payload.user);
      await refresh(payload.token);
      showToast("Login realizado com sucesso.");
      go("/dashboard");
      return true;
    } catch {
      setLoginError("Nao foi possivel conectar com a API local.");
      return false;
    } finally {
      setIsAuthenticating(false);
      setAuthReady(true);
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        await apiFetch("/api/auth/logout", { method: "POST" }, { allowUnauthorized: true });
      }
    } finally {
      clearSession();
      setLoginError("");
      go("/login");
      showToast("Sessao encerrada com sucesso.");
    }
  };

  const saveRecord = async (collection, payload, id) => {
    if (collection === "campaigns") {
      const validationError = validateCampaignRecord(payload);
      if (validationError) {
        showToast(validationError, "error");
        return false;
      }

      const nextCampaign = id ? { ...(findById(data.campaigns, id) || {}), ...payload, id } : payload;
      const blockingCampaign = isCampaignClosed(nextCampaign) ? null : getBlockingCampaign(data.campaigns, nextCampaign);
      if (blockingCampaign) {
        showToast(`A campanha "${blockingCampaign.name}" ainda nao foi finalizada. Feche a campanha atual antes de criar uma nova.`, "error");
        return false;
      }
    }

    if (collection === "evaluations" && !activeCampaign) {
      showToast("Nenhuma campanha ativa foi encontrada. O administrador precisa cadastrar uma campanha com data de inicio e fim para liberar as avaliacoes.", "error");
      return false;
    }

    try {
      const response = await apiFetch(`/api/${collection}${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) return false;
      if (!response.ok) throw new Error(await readError(response, "Nao foi possivel salvar o registro."));
      await refresh();
      showToast("Registro salvo com sucesso.");
      return true;
    } catch (error) {
      showToast(error.message || "Falha ao salvar registro.", "error");
      return false;
    }
  };

  const deleteRecord = async (collection, id) => {
    if (!window.confirm("Excluir este registro?")) return;
    try {
      const response = await apiFetch(`/api/${collection}/${id}`, { method: "DELETE" });
      if (response.status === 401) return false;
      if (!response.ok) throw new Error("Nao foi possivel excluir o registro.");
      await refresh();
      showToast("Registro excluido com sucesso.");
      return true;
    } catch (error) {
      showToast(error.message || "Falha ao excluir registro.", "error");
      return false;
    }
  };

  const clearCollection = async (collection) => {
    try {
      const response = await apiFetch(`/api/${collection}`, { method: "DELETE" });
      if (response.status === 401) return false;
      if (!response.ok) throw new Error("Nao foi possivel limpar os registros.");
      await refresh();
      showToast("Registros removidos com sucesso.");
      return true;
    } catch (error) {
      showToast(error.message || "Falha ao limpar registros.", "error");
      return false;
    }
  };

  const importRecords = async (collection, payloads) => {
    if (!payloads.length) {
      showToast("Nenhum registro valido foi encontrado no arquivo.", "error");
      return { ok: false, imported: 0, failed: 0 };
    }

    let imported = 0;
    let failed = 0;

    for (const payload of payloads) {
      const response = await apiFetch(`/api/${collection}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        return { ok: false, imported, failed: payloads.length - imported };
      }

      if (!response.ok) failed += 1;
      else imported += 1;
    }

    await refresh();
    if (failed) showToast(`Importacao concluida: ${imported} registro(s) importado(s) e ${failed} falha(s).`, "error");
    else showToast(`${imported} registro(s) importado(s) com sucesso.`);
    return { ok: failed === 0, imported, failed };
  };

  const saveSettings = async (payload) => {
    try {
      const response = await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) return false;
      if (!response.ok) throw new Error("Nao foi possivel salvar as configuracoes.");
      await refresh();
      showToast("Configuracoes salvas com sucesso.");
      return true;
    } catch (error) {
      showToast(error.message || "Falha ao salvar configuracoes.", "error");
      return false;
    }
  };

  const resetUserPassword = async (userId, password) => {
    try {
      const response = await apiFetch(`/api/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.status === 401) return false;
      if (!response.ok) {
        throw new Error(await readError(response, "Nao foi possivel redefinir a senha."));
      }
      await refresh();
      showToast("Senha redefinida com sucesso.");
      return true;
    } catch (error) {
      showToast(error.message || "Falha ao redefinir senha.", "error");
      return false;
    }
  };

  if (!authReady) return <AuthLoading message={authToken ? "Validando sessao..." : "Preparando acesso..."} />;
  if (!currentUser) {
    return (
      <Login
        onLogin={authenticate}
        onAcceptConsent={acceptLocationConsent}
        onRejectOptional={rejectOptionalCookies}
        consentState={consentState}
        error={loginError}
        isSubmitting={isAuthenticating}
      />
    );
  }

  return (
    <DataContext.Provider value={{ currentUser, data, activeCampaign, refresh, saveRecord, deleteRecord, clearCollection, importRecords, saveSettings, resetUserPassword, showToast, logout }}>
      <Shell route={route} go={go} onLogout={logout}>
        {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}
        {isBootstrapping && <div className="alert">Carregando dados do sistema...</div>}
        {apiUnavailable && <div className="alert error">API local indisponivel. Verifique se o backend do sistema esta ativo.</div>}
        <Page route={route} go={go} />
      </Shell>
    </DataContext.Provider>
  );
}

function BrandMark({ small = false, src = "" }) {
  if (src) {
    return <img className={`brand-logo ${small ? "brand-logo-small" : ""}`} src={src} alt="Logo do sistema" />;
  }

  return (
    <div className={`brand-mark ${small ? "brand-mark-small" : ""}`}>
      <span />
      <Lightbulb size={small ? 21 : 34} strokeWidth={2.4} />
    </div>
  );
}

function AuthLoading({ message }) {
  return (
    <main className="login-screen">
      <section className="login-panel">
        <BrandMark />
        <div className="login-card">
          <h1>{message}</h1>
        </div>
      </section>
    </main>
  );
}

function Login({ onLogin, onAcceptConsent, onRejectOptional, consentState, error, isSubmitting }) {
  const submit = async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    await onLogin({ login: values.login, password: values.password });
  };

  const loginEnabled = consentState.locationAccepted && !!consentState.location;

  return (
    <main className="login-screen">
      <section className="login-panel">
        <BrandMark />
        <form className="login-card" onSubmit={submit}>
          <h1>NUTRATIVA</h1>
          <p className="login-hint">Entre com suas credenciais para acessar a central de operacoes nutricionais.</p>
          <label className="input-icon">
            <input name="login" type="text" placeholder="Digite seu login" autoComplete="username" required />
            <User size={18} />
          </label>
          <label className="input-icon">
            <input name="password" type="password" placeholder="Digite sua senha" autoComplete="current-password" required />
            <Lock size={18} />
          </label>
          <ConsentStatus consentState={consentState} />
          {error && <div className="alert error login-alert">{error}</div>}
          <div className="login-row">
            <label className="checkline"><input type="checkbox" /> <span>Lembrar de mim</span></label>
            <button className="btn primary" type="submit" disabled={isSubmitting || !loginEnabled}><LogIn size={17} /> {isSubmitting ? "Entrando..." : "Entrar"}</button>
          </div>
          <button type="button" className="forgot">Esqueceu sua senha?</button>
        </form>
      </section>
      {!consentState.locationAccepted && <CookieBar consentState={consentState} onAccept={onAcceptConsent} onRejectOptional={onRejectOptional} />}
    </main>
  );
}

function ConsentStatus({ consentState }) {
  if (consentState.locationAccepted && consentState.location) {
    return <div className="alert success login-alert">Localizacao validada. O login esta liberado para este dispositivo.</div>;
  }

  if (consentState.dismissedOptional) {
    return <div className="alert error login-alert">Cookies opcionais foram recusados. Aceite a coleta de localizacao para liberar o acesso.</div>;
  }

  return <div className="alert consent-alert login-alert">Aceite a coleta de localizacao real para habilitar o login.</div>;
}

function Shell({ route, go, onLogout, children }) {
  const { data, currentUser } = useAppData();
  const pageLabel = resolveRouteLabel(route);
  const menuItems = getMenuForUser(currentUser);
  const brandName = data.settings.tradeName || data.settings.systemName || "NUTRATIVA";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" onClick={() => go("/dashboard")}>
          <BrandMark small src={data.settings.logo} />
          <div>
            <strong>{brandName}</strong>
          </div>
        </div>
        <nav>
          {menuItems.map((item) => <MenuItem key={item.label} item={item} route={route} go={go} />)}
        </nav>
        <div className="sidebar-bottom">
          <div className="news">
            <span>RADAR NUTRI</span>
            <a className="news-source" href={data.newsSource?.url} target="_blank" rel="noreferrer">{data.newsSource?.label || "Atualizacoes oficiais do CFN"}</a>
            <NewsCarousel items={data.news || []} />
          </div>
          <button className={`side-link ${route === "/configuracoes" ? "active" : ""}`} onClick={() => go("/configuracoes")}>
            <Settings size={19} /> Ajustes
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-main">
            <button className="icon-btn topbar-menu" title="Menu"><Menu size={21} /></button>
            <div className="topbar-copy">
              <strong>{pageLabel}</strong>
              <span>{formatHeaderDate(new Date())}</span>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-status"><span />Operacao ativa</div>
            <button className="profile" onClick={() => go("/profile")}><span className="avatar"><User size={16} /></span> {currentUser?.name || "Usuario"}</button>
            <button className="profile logout-btn" onClick={onLogout}><LogOut size={16} /> Sair</button>
          </div>
        </header>
        <main className="content">{children}</main>
        <footer><span>(c) 2026 NUTRATIVA</span><em>Painel local para operacao e monitoramento nutricional</em></footer>
      </div>
    </div>
  );
}

function MenuItem({ item, route, go }) {
  const Icon = item.icon;
  const active = item.path === route || item.children?.some((child) => child[1] === route);
  if (!item.children) {
    return <button className={`side-link ${active ? "active" : ""}`} onClick={() => go(item.path)}><Icon size={19} /> {item.label}</button>;
  }
  return (
    <div className={`menu-group ${active ? "open" : ""}`}>
      <button className="side-link parent" type="button" onClick={() => go(item.children[0][1])}><Icon size={19} /> {item.label}<ChevronDown size={16} /></button>
      <div className="submenu">
        {item.children.map(([label, path]) => (
          <button key={path} className={route === path ? "active" : ""} onClick={() => go(path)}>
            {label === "Lista" ? <List size={16} /> : <PlusCircle size={16} />} {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NewsCarousel({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [items]);

  if (!items.length) {
    return <p>Sem noticias no momento.</p>;
  }

  const currentItem = items[activeIndex];

  return (
    <div className="news-carousel">
      <a className="news-item compact" href={currentItem.link} target="_blank" rel="noreferrer">
        <strong>{currentItem.title}</strong>
        <small>{formatNewsDate(currentItem.date)}</small>
        <p>{currentItem.excerpt}</p>
      </a>
      {items.length > 1 && (
        <div className="news-dots" aria-label="Navegacao das noticias">
          {items.slice(0, 4).map((item, index) => (
            <button
              key={item.link}
              className={`news-dot ${index === activeIndex ? "active" : ""}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Exibir noticia ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Page({ route, go }) {
  const { currentUser } = useAppData();
  const id = editId(route);
  if (route === "/dashboard") return <Dashboard go={go} />;
  if (route === "/profile") return <Profile />;
  if (route === "/escolas") return <Schools go={go} />;
  if (route === "/escolas/create") return <SchoolForm go={go} />;
  if (route.match(/^\/escolas\/.+\/edit$/)) return <SchoolForm id={id} go={go} />;
  if (route.match(/^\/escolas\/.+$/)) return <SchoolDetail id={route.split("/")[2]} go={go} />;
  if (route === "/alunos") return <Students go={go} />;
  if (route === "/alunos/create") return <StudentForm go={go} />;
  if (route.match(/^\/alunos\/.+\/edit$/)) return <StudentForm id={id} go={go} />;
  if (route === "/usuarios") return <UsersPage go={go} />;
  if (route === "/usuarios/create") return <UserForm go={go} />;
  if (route.match(/^\/usuarios\/.+\/edit$/)) return <UserForm id={id} go={go} />;
  if (route === "/anos") return <Years go={go} />;
  if (route === "/anos/create") return <YearForm go={go} />;
  if (route.match(/^\/anos\/.+\/edit$/)) return <YearForm id={id} go={go} />;
  if (route === "/campanhas") return <Campaigns go={go} />;
  if (route === "/campanhas/create") return <CampaignForm go={go} />;
  if (route.match(/^\/campanhas\/.+\/edit$/)) return <CampaignForm id={id} go={go} />;
  if (route === "/nutricionistas") return <Nutritionists go={go} />;
  if (route === "/nutricionistas/create") return <NutritionistForm go={go} />;
  if (route.match(/^\/nutricionistas\/.+\/edit$/)) return <NutritionistForm id={id} go={go} />;
  if (route === "/avaliacoes") return <NutritionEvaluationsPage go={go} />;
  if (route.match(/^\/avaliacoes\/.+$/)) return <NutritionEvaluationForm studentId={route.split("/")[2]} go={go} />;
  if (route === "/relatorios/nutricionista") return <NutritionEvaluationsPage go={go} />;
  if (route.match(/^\/relatorios\/nutricionista\/.+$/)) return <NutritionEvaluationsPage go={go} />;
  if (route === "/relatorios") return currentUser?.profile === "Nutricionista" ? <NutritionEvaluationsPage go={go} /> : <Reports go={go} />;
  if (route === "/relatorios/escolas") return <ReportSchools />;
  if (route === "/relatorios/avaliacoes") return <ReportEvaluations />;
  if (route === "/relatorios/individual") return <ReportIndividual go={go} />;
  if (route.match(/^\/relatorios\/individual\/.+$/)) return <AdminIndividualReportDetail evaluationId={route.split("/")[3]} go={go} />;
  if (route === "/relatorios/campanha") return <ReportCampaign />;
  if (route === "/configuracoes") return <SettingsPage />;
  return <Dashboard go={go} />;
}

function editId(route) {
  const parts = route.split("/");
  return parts.length >= 4 ? parts[2] : undefined;
}

function PageCard({ title, crumb, children, icon, className = "" }) {
  const isReportPage = className.split(" ").includes("report-page");
  return (
    <section className={`page-card ${className}`.trim()}>
      <div className="page-head">
        <div className="page-title-wrap">
          {isReportPage && <ReportHeaderLogo />}
          <h1>{icon}{title}</h1>
        </div>
        <div className="crumb">Dashboard {crumb ? `/ ${crumb}` : ""}</div>
      </div>
      {isReportPage && (
        <div className="report-print-header">
          <ReportHeaderLogo />
          <h2>{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

function Dashboard({ go }) {
  const { data, currentUser } = useAppData();
  if (currentUser?.profile === "Nutricionista") {
    return <NutritionistDashboard go={go} />;
  }

  const studentsByYear = data.dashboard.studentsByYear || [];
  const chartData = useMemo(() => ({
    labels: studentsByYear.map((item) => item.label),
    datasets: [{ label: "Total de Alunos", data: studentsByYear.map((item) => item.total), backgroundColor: "#68b35a", borderColor: "#3d8f41", borderWidth: 1, borderRadius: 10 }],
  }), [studentsByYear]);
  return (
    <PageCard title="Central de Operacoes" crumb="Admin / Dashboard">
      <div className="alert success">Ambiente administrativo ativo. Perfil conectado: <b>{currentUser?.profile || "Administrador"}</b>.</div>
      <div className="stats">
        <Stat tone="amber" icon={Building2} value={data.dashboard.schools} label="Escolas Cadastradas" onClick={() => go("/escolas")} />
        <Stat tone="blue" icon={GraduationCap} value={data.dashboard.students} label="Alunos Cadastrados" onClick={() => go("/alunos")} />
        <Stat tone="emerald" icon={UserCog} value={data.dashboard.nutritionists} label="Nutricionistas" onClick={() => go("/nutricionistas")} />
        <Stat tone="rose" icon={Users} value={data.dashboard.users} label="Contas Ativas" onClick={() => go("/usuarios")} />
      </div>
      <div className="grid two">
        <Panel title="Alunos por Ano Letivo">{studentsByYear.length ? <div className="chart-box"><Bar data={chartData} options={chartOptions} /></div> : <EmptyState text="Nenhum dado disponivel." />}</Panel>
        <Panel title="Avaliacoes por Mes"><EmptyState text="Nenhum dado disponivel." /></Panel>
        <Panel title="Top 5 Escolas com mais alunos"><Table headers={["Escola", "Total de Alunos"]} rows={(data.dashboard.topSchools || []).map((s) => [s.name, s.students || 0])} empty="Nenhuma escola cadastrada." /></Panel>
        <Panel title="Ultimas Avaliacoes Realizadas"><EmptyState text="Nenhuma avaliacao registrada." /></Panel>
      </div>
      <Panel title="Mapa de Acessos em Tempo Real">
        <ConnectedUsersMap users={data.activeUsers || []} />
      </Panel>
    </PageCard>
  );
}

function NutritionistDashboard({ go }) {
  const { data, currentUser, activeCampaign } = useAppData();
  const context = useMemo(() => getNutritionistContext(data, currentUser), [data, currentUser]);
  const campaignEvaluations = useMemo(() => getEvaluationsForCampaign(context.myEvaluations, activeCampaign), [context.myEvaluations, activeCampaign]);
  const campaignEvaluationByStudentId = useMemo(() => indexEvaluationsByStudent(campaignEvaluations), [campaignEvaluations]);
  const pendingStudents = context.linkedStudents.filter((student) => !campaignEvaluationByStudentId[student.id]).length;
  const evaluationsBySchool = context.linkedSchools.map((school) => [
    school.name,
    campaignEvaluations.filter((evaluation) => String(evaluation.schoolId) === String(school.id)).length,
  ]);
  const evaluationsByMonth = Object.entries(campaignEvaluations.reduce((acc, evaluation) => {
    const label = formatMonthYear(evaluation.evaluatedAt || evaluation.updatedAt || evaluation.createdAt);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {}));
  const studentsBySex = Object.entries(context.linkedStudents.reduce((acc, student) => {
    const label = student.sex || "Nao informado";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {}));

  return (
    <PageCard title="Dashboard - Nutricionista" crumb="Nutricionista / Dashboard">
      <div className="alert success">Bem-vindo, <b>{currentUser?.name}</b>. Este painel exibe apenas escolas, alunos e avaliacoes vinculadas ao seu atendimento.</div>
      {activeCampaign && (
        <div className="alert success">
          Campanha ativa: <strong>{activeCampaign.name}</strong> | Periodo de {formatDate(activeCampaign.startDate)} ate {formatDate(activeCampaign.endDate)}.
        </div>
      )}
      <div className="stats">
        <Stat tone="blue" icon={GraduationCap} value={context.linkedStudents.length} label="Alunos Vinculados" onClick={() => go("/avaliacoes")} />
        <Stat tone="emerald" icon={ClipboardList} value={campaignEvaluations.length} label="Avaliacoes Finalizadas" onClick={() => go("/avaliacoes")} />
        <Stat tone="amber" icon={Building2} value={context.linkedSchools.length} label="Escolas Vinculadas" onClick={() => go("/escolas")} />
        <Stat tone="rose" icon={UserCog} value={pendingStudents} label="Alunos Pendentes" onClick={() => go("/avaliacoes")} />
      </div>
      <div className="grid two">
        <Panel title="Avaliacoes por Escola">
          <Table headers={["Escola", "Avaliacoes"]} rows={evaluationsBySchool} empty="Nenhuma escola vinculada." />
        </Panel>
        <Panel title="Avaliacoes por Mes">
          <Table headers={["Mes", "Total"]} rows={evaluationsByMonth} empty="Nenhuma avaliacao registrada ainda." />
        </Panel>
        <Panel title="Status das Avaliacoes">
          <Table
            headers={["Status", "Total"]}
            rows={[
              ["Finalizadas", campaignEvaluations.length],
              ["Pendentes", pendingStudents],
            ]}
            empty="Nenhum dado disponivel."
          />
        </Panel>
        <Panel title="Distribuicao por Sexo">
          <Table headers={["Sexo", "Alunos"]} rows={studentsBySex} empty="Nenhum dado disponivel." />
        </Panel>
      </div>
    </PageCard>
  );
}

function NutritionEvaluationsPage({ go }) {
  const { data, currentUser, activeCampaign } = useAppData();
  const context = useMemo(() => getNutritionistContext(data, currentUser), [data, currentUser]);
  const [filters, setFilters] = useState({
    schoolId: "",
    grade: "",
    shift: "",
    classroom: "",
    search: "",
  });
  const campaignEvaluations = useMemo(() => getEvaluationsForCampaign(context.myEvaluations, activeCampaign), [context.myEvaluations, activeCampaign]);
  const campaignEvaluationByStudentId = useMemo(() => indexEvaluationsByStudent(campaignEvaluations), [campaignEvaluations]);
  const studentsToEvaluate = useMemo(
    () => context.linkedStudents.filter((student) => !campaignEvaluationByStudentId[student.id]),
    [context.linkedStudents, campaignEvaluationByStudentId],
  );

  const filteredStudents = useMemo(() => {
    const search = normalizeCsvKey(filters.search);
    return studentsToEvaluate.filter((student) => {
      const school = findById(data.schools, student.schoolId);
      const matchesSearch = !search || [
        student.name,
        student.registration,
        student.responsible,
        school?.name,
      ].some((value) => normalizeCsvKey(value).includes(search));
      const matchesSchool = !filters.schoolId || String(student.schoolId) === String(filters.schoolId);
      const matchesGrade = !filters.grade || String(student.grade) === String(filters.grade);
      const matchesShift = !filters.shift || String(student.shift) === String(filters.shift);
      const matchesClassroom = !filters.classroom || String(student.classroom) === String(filters.classroom);
      return matchesSearch && matchesSchool && matchesGrade && matchesShift && matchesClassroom;
    });
  }, [studentsToEvaluate, data.schools, filters]);

  const gradeOptions = [["", "Todas as series"], ...uniqueValues(studentsToEvaluate.map((student) => student.grade)).map((value) => [value, value])];
  const shiftOptions = [["", "Todos os turnos"], ...uniqueValues(studentsToEvaluate.map((student) => student.shift)).map((value) => [value, value])];
  const classroomOptions = [["", "Todas as turmas"], ...uniqueValues(studentsToEvaluate.map((student) => student.classroom)).map((value) => [value, value])];

  if (!context.nutritionistLink) {
    return <PageCard title="Avaliacoes" crumb="Nutricionista / Avaliacoes"><EmptyState text="Nenhum vinculo de nutricionista foi encontrado para o seu usuario." /></PageCard>;
  }

  if (!activeCampaign) {
    const latestCampaign = getLatestCampaign(data.campaigns);
    return (
      <PageCard title="Alunos para Avaliacao" crumb="Nutricionista / Avaliacoes">
        <div className="alert error">
          Nenhuma campanha ativa foi encontrada. O administrador precisa cadastrar uma campanha com data de inicio e fim vigente para liberar as avaliacoes.
          {latestCampaign ? ` Ultima campanha registrada: ${latestCampaign.name} (${formatDate(latestCampaign.startDate)} a ${formatDate(latestCampaign.endDate)}).` : ""}
        </div>
        <EmptyState text="As avaliacoes estao bloqueadas ate que exista uma campanha ativa." />
      </PageCard>
    );
  }

  return (
    <PageCard title="Alunos para Avaliacao" crumb="Nutricionista / Avaliacoes">
      <div className="alert success">
        Campanha ativa: <strong>{activeCampaign.name}</strong> | Periodo de {formatDate(activeCampaign.startDate)} ate {formatDate(activeCampaign.endDate)}.
      </div>
      {!studentsToEvaluate.length && (
        <div className="alert success">
          Todos os alunos vinculados ao seu atendimento ja foram avaliados nesta campanha.
        </div>
      )}
      <div className="students-filter-panel nutrition-filters">
        <div className="students-filter-grid">
          <SelectField
            label="Escola"
            name="nutrition-school-filter"
            options={[["", "Todas as escolas"], ...context.linkedSchools.map((school) => [school.id, school.name])]}
            value={filters.schoolId}
            onChange={(event) => setFilters((current) => ({ ...current, schoolId: event.target.value }))}
            compact
          />
          <SelectField
            label="Serie"
            name="nutrition-grade-filter"
            options={gradeOptions}
            value={filters.grade}
            onChange={(event) => setFilters((current) => ({ ...current, grade: event.target.value }))}
            compact
          />
          <SelectField
            label="Turno"
            name="nutrition-shift-filter"
            options={shiftOptions}
            value={filters.shift}
            onChange={(event) => setFilters((current) => ({ ...current, shift: event.target.value }))}
            compact
          />
          <SelectField
            label="Turma"
            name="nutrition-classroom-filter"
            options={classroomOptions}
            value={filters.classroom}
            onChange={(event) => setFilters((current) => ({ ...current, classroom: event.target.value }))}
            compact
          />
          <label className="field wide">
            <span>Buscar</span>
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Nome do aluno, responsavel, matricula ou escola"
            />
          </label>
        </div>
        <div className="students-filter-actions">
          <button className="btn outline muted-btn" type="button" onClick={() => setFilters({ schoolId: "", grade: "", shift: "", classroom: "", search: "" })}>Limpar</button>
        </div>
      </div>
      <DataBlock>
        <Table
          headers={["Nome", "Serie", "Turma", "Escola", "Nutricionista", "Acoes"]}
          rows={filteredStudents.map((student) => {
            const school = findById(data.schools, student.schoolId);
            return [
              student.name,
              student.grade || "-",
              student.classroom || "-",
              school?.name || "-",
              currentUser?.name || "-",
              <div className="actions">
                <button className="mini warn" type="button" onClick={() => go(`/avaliacoes/${student.id}`)}>Avaliar</button>
              </div>,
            ];
          })}
          empty={studentsToEvaluate.length ? "Nenhum aluno pendente foi encontrado para os filtros selecionados." : "Todos os alunos vinculados ja foram avaliados nesta campanha."}
        />
      </DataBlock>
    </PageCard>
  );
}

function NutritionEvaluationForm({ studentId, go }) {
  const { data, currentUser, saveRecord, activeCampaign, showToast } = useAppData();
  const context = useMemo(() => getNutritionistContext(data, currentUser), [data, currentUser]);
  const campaignEvaluations = useMemo(() => getEvaluationsForCampaign(context.myEvaluations, activeCampaign), [context.myEvaluations, activeCampaign]);
  const student = findById(context.linkedStudents, studentId);
  const school = student ? findById(data.schools, student.schoolId) : null;
  const currentUserRecord = findById(data.users, currentUser?.id);
  const existingEvaluation = campaignEvaluations.find((evaluation) => String(evaluation.studentId) === String(studentId));
  const [draft, setDraft] = useState(() => createEvaluationDraft(existingEvaluation, student, currentUser, context.nutritionistLink, school, currentUserRecord));

  useEffect(() => {
    setDraft(createEvaluationDraft(existingEvaluation, student, currentUser, context.nutritionistLink, school, currentUserRecord));
  }, [existingEvaluation, student, currentUser, context.nutritionistLink, school, currentUserRecord]);

  const evaluatedAt = draft.evaluatedAt || existingEvaluation?.evaluatedAt || new Date().toISOString();
  const anthropometryResult = useMemo(() => evaluateAnthropometricStatus({
    weight: draft.anthropometry?.weight,
    height: draft.anthropometry?.height,
    birthDate: student?.birthDate,
    evaluationDate: evaluatedAt,
    sex: student?.sex,
    schoolId: student?.schoolId,
    schoolName: school?.name,
    grade: student?.grade,
    classroom: student?.classroom,
  }), [draft.anthropometry?.height, draft.anthropometry?.weight, evaluatedAt, school?.name, student?.birthDate, student?.classroom, student?.grade, student?.schoolId, student?.sex]);

  const bmi = anthropometryResult.bmiDisplay || calculateBmi(draft.anthropometry?.weight, draft.anthropometry?.height);

  if (!student) {
    return <PageCard title="Avaliacao Nutricional" crumb="Nutricionista / Avaliacoes"><EmptyState text="Este aluno nao esta vinculado ao seu atendimento nutricional." /></PageCard>;
  }

  if (!activeCampaign) {
    return (
      <PageCard title="Avaliacao Nutricional" crumb="Nutricionista / Avaliacoes">
        <div className="alert error">
          Esta avaliacao esta bloqueada porque nao existe campanha ativa com data de inicio e fim vigente.
        </div>
        <div className="form-actions">
          <button className="btn outline muted-btn" type="button" onClick={() => go("/avaliacoes")}>Voltar</button>
        </div>
      </PageCard>
    );
  }

  const updateAnthropometry = (field, value) => {
    setDraft((current) => ({
      ...current,
      anthropometry: { ...current.anthropometry, [field]: value },
    }));
  };

  const updateSection = (section, field, value) => {
    setDraft((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: { ...current.sections[section], [field]: value },
      },
    }));
  };

  const toggleSection = (section) => {
    setDraft((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: { ...current.sections[section], enabled: !current.sections[section].enabled },
      },
    }));
  };

  const saveEvaluation = async () => {
    if (anthropometryResult.errors.length) {
      showToast(anthropometryResult.errors.join(" "), "error");
      return;
    }

    const nowIso = new Date().toISOString();
    const payload = {
      ...draft,
      status: "Finalizada",
      studentId: student.id,
      schoolId: student.schoolId,
      studentName: student.name,
      studentGrade: student.grade,
      studentClassroom: student.classroom,
      studentShift: student.shift,
      schoolName: school?.name || "",
      campaignId: activeCampaign.id,
      campaignName: activeCampaign.name,
      campaignStartDate: activeCampaign.startDate,
      campaignEndDate: activeCampaign.endDate,
      nutritionistUserId: currentUser.id,
      nutritionistId: context.nutritionistLink?.id || currentUser.id,
      nutritionistName: currentUser.name,
      crn: context.nutritionistLink?.crn || currentUserRecord?.crn || "",
      anthropometry: {
        ...draft.anthropometry,
        heightMeters: anthropometryResult.heightMeters ?? null,
        bmiValue: anthropometryResult.bmi ?? null,
        bmi,
      },
      birthDate: student.birthDate || "",
      sex: anthropometryResult.normalizedSex || student.sex || "",
      ageYears: anthropometryResult.age?.years ?? null,
      ageMonths: anthropometryResult.age?.totalMonths ?? null,
      ageLabel: anthropometryResult.age?.label || "",
      interpretationMethod: anthropometryResult.methodLabel || "",
      typeClassification: anthropometryResult.typeClassification || "",
      referenceAnthropometric: anthropometryResult.referenceLabel || "",
      zScore: anthropometryResult.zScore ?? null,
      percentile: anthropometryResult.percentile ?? null,
      nutritionalClassification: anthropometryResult.classificationLabel || "",
      nutritionalAlert: anthropometryResult.needsTechnicalReview,
      technicalObservation: anthropometryResult.technicalReviewMessage || "",
      technicalAlerts: anthropometryResult.alerts || [],
      resultDisclaimer: anthropometryResult.disclaimer,
      evaluatedAt: nowIso,
      updatedAt: nowIso,
    };

    const saved = await saveRecord("evaluations", payload, existingEvaluation?.id);
    if (saved) go("/avaliacoes");
  };

  return (
    <PageCard title="Avaliacao Nutricional do Aluno" crumb="Nutricionista / Avaliacoes">
      <div className="evaluation-actions">
        <button className="btn outline muted-btn" type="button" onClick={() => go("/avaliacoes")}>Sair do Atendimento</button>
        <button className="btn primary" type="button" onClick={saveEvaluation}><Save size={16} /> Salvar Avaliacao</button>
      </div>

      <div className="evaluation-grid">
        <section className="form-section">
          <h2>Dados do Aluno</h2>
          <div className="form-grid">
            <ReadOnlyField label="Nome" value={student.name} />
            <ReadOnlyField label="Sexo" value={anthropometryResult.normalizedSex || student.sex || "-"} />
            <ReadOnlyField label="Data de Nascimento" value={formatDate(student.birthDate) || "-"} />
            <ReadOnlyField label="Idade na Avaliacao" value={anthropometryResult.age?.label || "-"} />
            <ReadOnlyField label="Escola" value={school?.name || "-"} wide />
            <ReadOnlyField label="Serie / Turma" value={`${student.grade || "-"} - ${student.classroom || "-"}`} wide />
          </div>
        </section>

        <section className="form-section">
          <h2>Antropometria</h2>
          <div className="form-grid">
            <label className="field">
              <span>Peso (kg)</span>
              <input value={draft.anthropometry.weight} onChange={(event) => updateAnthropometry("weight", event.target.value)} placeholder="Ex: 32.5" />
            </label>
            <label className="field">
              <span>Altura (cm)</span>
              <input value={draft.anthropometry.height} onChange={(event) => updateAnthropometry("height", event.target.value)} placeholder="Ex: 128" />
            </label>
            <ReadOnlyField label="IMC (calculado)" value={bmi || "-"} />
            <ReadOnlyField label="Metodo" value={anthropometryResult.methodLabel || "-"} />
            <ReadOnlyField label="Classificacao" value={anthropometryResult.classificationLabel || "-"} />
            <ReadOnlyField label="Referencia" value={anthropometryResult.referenceLabel || "-"} />
            <label className="field">
              <span>Circunferencia Abdominal (cm)</span>
              <input value={draft.anthropometry.waist} onChange={(event) => updateAnthropometry("waist", event.target.value)} placeholder="Ex: 58" />
            </label>
            {!anthropometryResult.typeClassification || anthropometryResult.typeClassification === "ADULTO_IMC" ? null : (
              <>
                <ReadOnlyField label="Escore-z" value={anthropometryResult.zScoreDisplay || "-"} />
                <ReadOnlyField label="Percentil" value={anthropometryResult.percentileDisplay || "-"} />
              </>
            )}
          </div>
          {anthropometryResult.errors.length > 0 && (
            <div className="alert error">
              <strong>Validacao obrigatoria:</strong> {anthropometryResult.errors.join(" ")}
            </div>
          )}
          {anthropometryResult.alerts.length > 0 && (
            <div className="alert warn">
              <strong>Alerta tecnico:</strong> {anthropometryResult.alerts.join(" ")}
            </div>
          )}
          <div className="alert success">
            <strong>Aviso:</strong> {anthropometryResult.disclaimer}
          </div>
        </section>

        <NutritionSectionCard title="Habitos Alimentares" enabled={draft.sections.eatingHabits.enabled} onToggle={() => toggleSection("eatingHabits")}>
          <div className="section-checklist">
            <CheckItem label="Come muitas frituras" checked={draft.sections.eatingHabits.friedFoods} onChange={(checked) => updateSection("eatingHabits", "friedFoods", checked)} />
            <CheckItem label="Pula refeicoes" checked={draft.sections.eatingHabits.skipMeals} onChange={(checked) => updateSection("eatingHabits", "skipMeals", checked)} />
            <CheckItem label="Consome muitos doces" checked={draft.sections.eatingHabits.sweets} onChange={(checked) => updateSection("eatingHabits", "sweets", checked)} />
            <CheckItem label="Bebe pouca agua" checked={draft.sections.eatingHabits.lowWater} onChange={(checked) => updateSection("eatingHabits", "lowWater", checked)} />
            <CheckItem label="Consome frutas diariamente" checked={draft.sections.eatingHabits.dailyFruit} onChange={(checked) => updateSection("eatingHabits", "dailyFruit", checked)} />
          </div>
          <TextAreaField label="Observacoes" value={draft.sections.eatingHabits.notes} onChange={(value) => updateSection("eatingHabits", "notes", value)} />
        </NutritionSectionCard>

        <NutritionSectionCard title="Uso de Medicamentos" enabled={draft.sections.medications.enabled} onToggle={() => toggleSection("medications")}>
          <TextAreaField label="Medicamentos em uso" value={draft.sections.medications.items} onChange={(value) => updateSection("medications", "items", value)} placeholder="Ex: Ritalina, Vitamina D, Omega 3" />
          <TextAreaField label="Observacoes" value={draft.sections.medications.notes} onChange={(value) => updateSection("medications", "notes", value)} />
        </NutritionSectionCard>

        <NutritionSectionCard title="Alergias / Intolerancias" enabled={draft.sections.allergies.enabled} onToggle={() => toggleSection("allergies")}>
          <div className="section-checklist">
            <CheckItem label="Lactose" checked={draft.sections.allergies.lactose} onChange={(checked) => updateSection("allergies", "lactose", checked)} />
            <CheckItem label="Gluten" checked={draft.sections.allergies.gluten} onChange={(checked) => updateSection("allergies", "gluten", checked)} />
            <CheckItem label="Ovos" checked={draft.sections.allergies.eggs} onChange={(checked) => updateSection("allergies", "eggs", checked)} />
            <CheckItem label="Amendoim" checked={draft.sections.allergies.peanuts} onChange={(checked) => updateSection("allergies", "peanuts", checked)} />
            <CheckItem label="Corantes artificiais" checked={draft.sections.allergies.dyes} onChange={(checked) => updateSection("allergies", "dyes", checked)} />
          </div>
          <TextAreaField label="Observacoes" value={draft.sections.allergies.notes} onChange={(value) => updateSection("allergies", "notes", value)} />
        </NutritionSectionCard>

        <NutritionSectionCard title="Recordatorio Alimentar - Ultimas 24h" enabled={draft.sections.record24h.enabled} onToggle={() => toggleSection("record24h")}>
          <div className="evaluation-subgrid">
            <TextAreaField label="Cafe da Manha" value={draft.sections.record24h.breakfast} onChange={(value) => updateSection("record24h", "breakfast", value)} wide={false} />
            <TextAreaField label="Lanche da Manha" value={draft.sections.record24h.morningSnack} onChange={(value) => updateSection("record24h", "morningSnack", value)} wide={false} />
            <TextAreaField label="Almoco" value={draft.sections.record24h.lunch} onChange={(value) => updateSection("record24h", "lunch", value)} wide={false} />
            <TextAreaField label="Lanche da Tarde" value={draft.sections.record24h.afternoonSnack} onChange={(value) => updateSection("record24h", "afternoonSnack", value)} wide={false} />
            <TextAreaField label="Jantar" value={draft.sections.record24h.dinner} onChange={(value) => updateSection("record24h", "dinner", value)} wide={false} />
            <TextAreaField label="Ceia" value={draft.sections.record24h.supper} onChange={(value) => updateSection("record24h", "supper", value)} wide={false} />
          </div>
          <TextAreaField label="Bebidas" value={draft.sections.record24h.beverages} onChange={(value) => updateSection("record24h", "beverages", value)} />
        </NutritionSectionCard>

        <NutritionSectionCard title="Historico Familiar" enabled={draft.sections.familyHistory.enabled} onToggle={() => toggleSection("familyHistory")}>
          <TextAreaField label="Historico Familiar" value={draft.sections.familyHistory.notes} onChange={(value) => updateSection("familyHistory", "notes", value)} />
        </NutritionSectionCard>

        <NutritionSectionCard title="Sinais Clinicos Observados" enabled={draft.sections.clinicalSigns.enabled} onToggle={() => toggleSection("clinicalSigns")}>
          <TextAreaField label="Sinais Clinicos Observados" value={draft.sections.clinicalSigns.notes} onChange={(value) => updateSection("clinicalSigns", "notes", value)} />
        </NutritionSectionCard>

        <NutritionSectionCard title="Laudo / Diagnostico Nutricional" enabled={draft.sections.diagnosis.enabled} onToggle={() => toggleSection("diagnosis")}>
          <TextAreaField label="Laudo / Diagnostico Nutricional" value={draft.sections.diagnosis.notes} onChange={(value) => updateSection("diagnosis", "notes", value)} />
        </NutritionSectionCard>

        <NutritionSectionCard title="Plano Alimentar Interativo" enabled={draft.sections.mealPlan.enabled} onToggle={() => toggleSection("mealPlan")}>
          <label className="field">
            <span>Plano rapido</span>
            <select value={draft.sections.mealPlan.preset} onChange={(event) => updateSection("mealPlan", "preset", event.target.value)}>
              {["Plano Equilibrado", "Plano Hipocalorico", "Plano Proteico", "Plano Infantil", "Plano Personalizado"].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <TextAreaField label="Alimentos personalizados" value={draft.sections.mealPlan.customFoods} onChange={(value) => updateSection("mealPlan", "customFoods", value)} />
          <div className="evaluation-subgrid">
            <TextAreaField label="Cafe da Manha / Lanches" value={draft.sections.mealPlan.breakfast} onChange={(value) => updateSection("mealPlan", "breakfast", value)} wide={false} />
            <TextAreaField label="Lanches complementares" value={draft.sections.mealPlan.snacks} onChange={(value) => updateSection("mealPlan", "snacks", value)} wide={false} />
            <TextAreaField label="Almoco / Jantar" value={draft.sections.mealPlan.lunchDinner} onChange={(value) => updateSection("mealPlan", "lunchDinner", value)} wide={false} />
            <TextAreaField label="Bebidas / Ceia" value={draft.sections.mealPlan.beverages} onChange={(value) => updateSection("mealPlan", "beverages", value)} wide={false} />
          </div>
          <TextAreaField label="Plano semanal sugerido" value={draft.sections.mealPlan.weeklyPlan} onChange={(value) => updateSection("mealPlan", "weeklyPlan", value)} placeholder="Segunda: ...&#10;Terca: ...&#10;Quarta: ..." />
        </NutritionSectionCard>
      </div>
    </PageCard>
  );
}

function NutritionistReportsPage({ go }) {
  const { data, currentUser } = useAppData();
  const context = useMemo(() => getNutritionistContext(data, currentUser), [data, currentUser]);

  return (
    <PageCard title="Relatorio do Nutricionista" crumb="Nutricionista / Relatorio" className="report-page">
      <div className="alert success">Os relatorios abaixo exibem somente avaliacoes realizadas por voce e incluem a identificacao profissional com CRN no fechamento.</div>
      <DataBlock>
        <Table
          headers={["Aluno", "Escola", "Serie", "Data", "Status", "Acoes"]}
          rows={context.myEvaluations.map((evaluation) => [
            evaluation.studentName || findById(data.students, evaluation.studentId)?.name || "-",
            evaluation.schoolName || findById(data.schools, evaluation.schoolId)?.name || "-",
            evaluation.studentGrade || "-",
            formatDateTime(evaluation.evaluatedAt || evaluation.updatedAt || evaluation.createdAt),
            evaluation.status || "Finalizada",
            <div className="actions">
              <button className="mini info" type="button" onClick={() => go(`/relatorios/nutricionista/${evaluation.id}`)}>Ver Relatorio</button>
              <button className="mini secondary" type="button" onClick={() => go(`/avaliacoes/${evaluation.studentId}`)}>Editar</button>
            </div>,
          ])}
          empty="Nenhuma avaliacao sua foi registrada ainda."
        />
      </DataBlock>
      <ReportCompanyFooter />
    </PageCard>
  );
}

function NutritionistReportDetail({ evaluationId, go, scope = "nutritionist" }) {
  const { data, currentUser } = useAppData();
  const context = useMemo(() => getNutritionistContext(data, currentUser), [data, currentUser]);
  const evaluations = scope === "admin" ? (data.evaluations || []) : context.myEvaluations;
  const evaluation = evaluations.find((item) => String(item.id) === String(evaluationId));
  const student = evaluation ? findById(data.students, evaluation.studentId) : null;
  const school = evaluation ? findById(data.schools, evaluation.schoolId) : null;
  const campaign = evaluation ? findCampaignForEvaluation(data.campaigns, evaluation) : null;
  const anthropometryResult = useMemo(() => evaluateAnthropometricStatus({
    weight: evaluation?.anthropometry?.weight,
    height: evaluation?.anthropometry?.height,
    birthDate: evaluation?.birthDate || student?.birthDate,
    evaluationDate: evaluation?.evaluatedAt || evaluation?.updatedAt || evaluation?.createdAt,
    sex: evaluation?.sex || student?.sex,
    schoolId: evaluation?.schoolId,
    schoolName: evaluation?.schoolName || school?.name,
    grade: evaluation?.studentGrade || student?.grade,
    classroom: evaluation?.studentClassroom || student?.classroom,
  }), [evaluation, school?.name, student?.birthDate, student?.classroom, student?.grade, student?.sex]);
  const bmiSummary = useMemo(() => buildBmiSummary(anthropometryResult), [anthropometryResult]);
  const pageTitle = scope === "admin" ? "Relatorio Nutricional Individual" : "Relatorio do Nutricionista";
  const crumb = scope === "admin" ? "Admin / Relatorios" : "Nutricionista / Relatorio";
  const backRoute = scope === "admin" ? "/relatorios/individual" : "/avaliacoes";

  if (!evaluation) {
    return <PageCard title={pageTitle} crumb={crumb} className="report-page"><EmptyState text="Relatorio nao encontrado ou sem permissao de acesso." /></PageCard>;
  }

  const detailItems = [
    { label: "Sexo", value: anthropometryResult.normalizedSex || evaluation.sex || student?.sex, hideOnPrint: true },
    { label: "Nascimento", value: formatDate(student?.birthDate), hideOnPrint: true },
    { label: "Idade na avaliacao", value: anthropometryResult.age?.label || formatAge(student?.birthDate, evaluation.evaluatedAt || evaluation.updatedAt || evaluation.createdAt), hideOnPrint: true },
    { label: "Turno", value: student?.shift, hideOnPrint: true },
    { label: "Peso", value: hasContent(evaluation.anthropometry?.weight) ? `${evaluation.anthropometry.weight} kg` : "" },
    { label: "Altura", value: hasContent(evaluation.anthropometry?.height) ? `${evaluation.anthropometry.height} cm` : "" },
    { label: "IMC", value: anthropometryResult.bmiDisplay || evaluation.anthropometry?.bmi },
    { label: "Metodo", value: anthropometryResult.methodLabel, hideOnPrint: true },
    { label: "Classificacao", value: anthropometryResult.classificationLabel },
    { label: "Referencia", value: anthropometryResult.referenceLabel, hideOnPrint: true },
    { label: "Escore-z", value: anthropometryResult.zScoreDisplay, hideOnPrint: true },
    { label: "Percentil", value: anthropometryResult.percentileDisplay, hideOnPrint: true },
    { label: "Circ. Abdominal", value: hasContent(evaluation.anthropometry?.waist) ? `${evaluation.anthropometry.waist} cm` : "", hideOnPrint: true },
  ].filter((item) => hasContent(item.value));

  const eatingHabitsItems = buildEatingHabitsReport(evaluation.sections?.eatingHabits);
  const eatingHabitsNotes = evaluation.sections?.eatingHabits?.notes;
  const hasEatingHabits = eatingHabitsItems.length > 0 || hasContent(eatingHabitsNotes);

  const medicationItems = evaluation.sections?.medications?.items;
  const medicationNotes = evaluation.sections?.medications?.notes;
  const hasMedications = hasContent(medicationItems) || hasContent(medicationNotes);

  const allergyItems = buildAllergiesReport(evaluation.sections?.allergies);
  const allergyNotes = evaluation.sections?.allergies?.notes;
  const hasAllergies = allergyItems.length > 0 || hasContent(allergyNotes);

  const record24hItems = [
    { label: "Cafe da Manha", value: evaluation.sections?.record24h?.breakfast },
    { label: "Lanche da Manha", value: evaluation.sections?.record24h?.morningSnack },
    { label: "Almoco", value: evaluation.sections?.record24h?.lunch },
    { label: "Lanche da Tarde", value: evaluation.sections?.record24h?.afternoonSnack },
    { label: "Jantar", value: evaluation.sections?.record24h?.dinner },
    { label: "Ceia", value: evaluation.sections?.record24h?.supper },
    { label: "Bebidas", value: evaluation.sections?.record24h?.beverages, wide: true },
  ].filter((item) => hasContent(item.value));

  const mealPlanItems = [
    { label: "Plano Base", value: evaluation.sections?.mealPlan?.preset },
    { label: "Alimentos Personalizados", value: evaluation.sections?.mealPlan?.customFoods, wide: true },
    { label: "Cafe da Manha / Lanches", value: evaluation.sections?.mealPlan?.breakfast },
    { label: "Lanches complementares", value: evaluation.sections?.mealPlan?.snacks },
    { label: "Almoco / Jantar", value: evaluation.sections?.mealPlan?.lunchDinner },
    { label: "Bebidas / Ceia", value: evaluation.sections?.mealPlan?.beverages },
    { label: "Plano semanal sugerido", value: evaluation.sections?.mealPlan?.weeklyPlan, wide: true },
  ].filter((item) => hasContent(item.value));

  const campaignName = evaluation.campaignName || campaign?.name || "";
  const campaignStartDate = evaluation.campaignStartDate || campaign?.startDate || "";
  const campaignEndDate = evaluation.campaignEndDate || campaign?.endDate || "";
  const campaignPeriod = campaignStartDate && campaignEndDate ? `${formatDate(campaignStartDate)} ate ${formatDate(campaignEndDate)}` : "";

  return (
    <PageCard title="Relatorio da Avaliacao Nutricional" crumb={crumb} className="report-page">
      <div className="evaluation-actions">
        <button className="btn outline muted-btn" type="button" onClick={() => go(backRoute)}>Voltar</button>
        <button className="btn outline success-text" type="button" onClick={() => window.print()}>Imprimir</button>
      </div>
      <div className="report-sheet">
        <div className="report-header">
          <div className="report-header-title">
            <ReportHeaderLogo />
            <div>
              <h2>Avaliacao Nutricional do Aluno</h2>
              <p>{evaluation.studentName || student?.name}</p>
            </div>
          </div>
          <div className="report-meta">
            <span>Data da avaliacao: {formatDateTime(evaluation.evaluatedAt || evaluation.updatedAt || evaluation.createdAt)}</span>
            <span>Escola: {evaluation.schoolName || school?.name || "-"}</span>
            <span>Serie / Turma: {evaluation.studentGrade || student?.grade || "-"} - {student?.classroom || "-"}</span>
            {hasContent(campaignName) && <span>Campanha: {campaignName}</span>}
            {hasContent(campaignPeriod) && <span>Periodo da campanha: {campaignPeriod}</span>}
          </div>
        </div>

        {!!detailItems.length && (
          <div className="report-grid-detail">
            {detailItems.map((item) => <ReportInfo key={item.label} label={item.label} value={item.value} wide={item.wide} className={item.hideOnPrint ? "print-hidden" : ""} />)}
          </div>
        )}

        <PediatricGrowthCharts anthropometryResult={anthropometryResult} />

        {bmiSummary && (
          <section className="bmi-summary">
            <div className="bmi-summary-header">
              <div>
                <span className="bmi-eyebrow">Resultados do IMC</span>
                <h3>{bmiSummary.title}</h3>
                <p>{bmiSummary.subtitle}</p>
              </div>
              <div className="bmi-summary-badges">
                <div className={`bmi-badge tone-${bmiSummary.tone}`}>
                  <span>Classificacao</span>
                  <strong>{bmiSummary.label}</strong>
                </div>
                <div className="bmi-badge neutral">
                  <span>IMC</span>
                  <strong>{bmiSummary.valueLabel}</strong>
                </div>
              </div>
            </div>

            <div className="bmi-scale-block">
              <div className="bmi-scale">
                {bmiSummary.legend.map((item) => (
                  <span key={item.label} className={`bmi-scale-band ${item.tone}`} />
                ))}
                <span className="bmi-scale-marker" style={{ left: `${bmiSummary.markerPercent}%` }} />
              </div>
              <div className="bmi-scale-legend">
                {bmiSummary.legend.map((item) => (
                  <div key={item.label} className="bmi-legend-item">
                    <span className={`bmi-dot ${item.tone}`} />
                    <div>
                      <strong>{item.range}</strong>
                      <small>{item.label}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bmi-summary-copy">
              <div className="bmi-copy-card">
                <h4>O que isso significa para a familia?</h4>
                <p>{bmiSummary.description}</p>
              </div>
              <div className="bmi-copy-card">
                <h4>Orientacao inicial</h4>
                <p>{bmiSummary.guidance}</p>
              </div>
            </div>

            <div className={`bmi-alert tone-${bmiSummary.tone}`}>
              <strong>Importante:</strong> {bmiSummary.note}
            </div>
            {anthropometryResult.alerts.length > 0 && (
              <div className="bmi-report-alerts">
                <strong>Alertas tecnicos</strong>
                <ul className="report-list">
                  {anthropometryResult.alerts.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        <ReportSection title="Habitos Alimentares" enabled={evaluation.sections?.eatingHabits?.enabled && hasEatingHabits}>
          {!!eatingHabitsItems.length && (
            <ul className="report-list">
              {eatingHabitsItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {hasContent(eatingHabitsNotes) && <p>{eatingHabitsNotes}</p>}
        </ReportSection>

        <ReportSection title="Uso de Medicamentos" enabled={evaluation.sections?.medications?.enabled && hasMedications}>
          {hasContent(medicationItems) && <p>{medicationItems}</p>}
          {hasContent(medicationNotes) && <p>{medicationNotes}</p>}
        </ReportSection>

        <ReportSection title="Alergias / Intolerancias" enabled={evaluation.sections?.allergies?.enabled && hasAllergies}>
          {!!allergyItems.length && (
            <ul className="report-list">
              {allergyItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {hasContent(allergyNotes) && <p>{allergyNotes}</p>}
        </ReportSection>

        <ReportSection title="Recordatorio Alimentar - Ultimas 24h" enabled={evaluation.sections?.record24h?.enabled && record24hItems.length > 0}>
          <div className="report-grid-detail">
            {record24hItems.map((item) => <ReportInfo key={item.label} label={item.label} value={item.value} wide={item.wide} />)}
          </div>
        </ReportSection>

        <ReportSection title="Historico Familiar" enabled={evaluation.sections?.familyHistory?.enabled && hasContent(evaluation.sections?.familyHistory?.notes)}>
          <p>{evaluation.sections?.familyHistory?.notes}</p>
        </ReportSection>

        <ReportSection title="Sinais Clinicos Observados" enabled={evaluation.sections?.clinicalSigns?.enabled && hasContent(evaluation.sections?.clinicalSigns?.notes)}>
          <p>{evaluation.sections?.clinicalSigns?.notes}</p>
        </ReportSection>

        <ReportSection title="Laudo / Diagnostico Nutricional" enabled={evaluation.sections?.diagnosis?.enabled && hasContent(evaluation.sections?.diagnosis?.notes)}>
          <p>{evaluation.sections?.diagnosis?.notes}</p>
        </ReportSection>

        <ReportSection title="Plano Alimentar Interativo" enabled={evaluation.sections?.mealPlan?.enabled && mealPlanItems.length > 0}>
          <div className="report-grid-detail">
            {mealPlanItems.map((item) => <ReportInfo key={item.label} label={item.label} value={item.value} wide={item.wide} />)}
          </div>
        </ReportSection>

        <div className="report-signature">
          <strong>{evaluation.nutritionistName || currentUser.name}</strong>
          <span>CRN: {evaluation.crn || "Nao informado"}</span>
          <small>Assinatura do nutricionista responsavel pela avaliacao realizada</small>
        </div>
        <ReportCompanyFooter />
      </div>
    </PageCard>
  );
}

function AdminIndividualReportDetail({ evaluationId, go }) {
  return <NutritionistReportDetail evaluationId={evaluationId} go={go} scope="admin" />;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#53704d", boxWidth: 18, boxHeight: 18 } } },
  scales: {
    x: { ticks: { color: "#66805f", maxRotation: 45, minRotation: 45 }, grid: { color: "rgba(124, 152, 111, .14)" } },
    y: { ticks: { color: "#66805f" }, grid: { color: "rgba(124, 152, 111, .14)" } },
  },
};

function Stat({ icon: Icon, value, label, onClick, tone = "amber" }) {
  return (
    <button className={`stat tone-${tone}`} onClick={onClick}>
      <div>
        <em>Visao geral</em>
        <b>{value}</b>
        <span>{label}</span>
        <small>Acessar</small>
      </div>
      <Icon size={54} />
    </button>
  );
}

function ConnectedUsersMap({ users }) {
  const markers = useMemo(() => normalizeActiveUsersForMap(users), [users]);

  if (!markers.length) {
    return <EmptyState text="Nenhum usuario conectado com localizacao registrada no momento." />;
  }

  const center = markers.length === 1
    ? [markers[0].location.latitude, markers[0].location.longitude]
    : [
        markers.reduce((sum, item) => sum + item.location.latitude, 0) / markers.length,
        markers.reduce((sum, item) => sum + item.location.longitude, 0) / markers.length,
      ];

  return (
    <div className="connected-map-layout">
      <div className="map-shell">
        <MapContainer center={center} zoom={markers.length === 1 ? 12 : 5} scrollWheelZoom className="real-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((item) => (
            <CircleMarker
              key={item.user.id}
              center={[item.location.latitude, item.location.longitude]}
              radius={10}
              pathOptions={{ color: "#ee3153", fillColor: "#12a8bd", fillOpacity: 0.85, weight: 2 }}
            >
              <Popup>
                <strong>{item.user.name}</strong>
                <br />
                {item.user.profile || "Usuario"}
                <br />
                {item.user.login}
                <br />
                {formatDateTime(item.location.capturedAt)}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="connected-users-list">
        {markers.map((item) => (
          <div key={item.user.id} className="connected-user-card">
            <strong>{item.user.name}</strong>
            <span>{item.user.profile || "Usuario"}</span>
            <small>{item.user.login}</small>
            <small>{formatDateTime(item.location.capturedAt)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function Schools({ go }) {
  const { data, currentUser, deleteRecord } = useAppData();
  const context = useMemo(() => getNutritionistContext(data, currentUser), [data, currentUser]);
  const visibleSchools = currentUser?.profile === "Nutricionista" ? context.linkedSchools : data.schools;
  return (
    <PageCard title="Escolas" crumb={currentUser?.profile === "Nutricionista" ? "Nutricionista / Escolas" : "Escolas"}>
      {currentUser?.profile !== "Nutricionista" && (
        <Toolbar>
          <button className="btn success" onClick={() => go("/escolas/create")}><PlusCircle size={17} /> Nova Escola</button>
          <button className="btn success" type="button"><Upload size={17} /> Importar CSV</button>
          <button className="btn outline info" type="button"><Download size={17} /> Baixar Modelo CSV</button>
        </Toolbar>
      )}
      {currentUser?.profile === "Nutricionista" && <div className="alert success">A listagem abaixo mostra apenas as escolas vinculadas ao seu atendimento nutricional.</div>}
      <SearchBox placeholder="Buscar por nome, cidade, bairro ou rua" />
      <DataBlock>
        <Table
          headers={["ID", "Nome", "Estado", "Cidade", "Zona", "Acoes"]}
          rows={visibleSchools.map((school) => [
            school.schoolCode || "-",
            school.name,
            school.state,
            school.city,
            school.zone,
            currentUser?.profile === "Nutricionista"
              ? <Actions view={() => go(`/escolas/${school.id}`)} noView={false} />
              : <Actions view={() => go(`/escolas/${school.id}`)} edit={() => go(`/escolas/${school.id}/edit`)} remove={() => deleteRecord("schools", school.id)} />,
          ])}
          empty={currentUser?.profile === "Nutricionista" ? "Nenhuma escola vinculada ao seu usuario." : "Nenhuma escola cadastrada."}
        />
      </DataBlock>
    </PageCard>
  );
}

function SchoolForm({ id, go }) {
  const { data, saveRecord } = useAppData();
  const school = findById(data.schools, id);
  return (
    <RecordForm
      title={id ? "Editar Escola" : "Nova Escola"}
      crumb="Escolas"
      collection="schools"
      id={id}
      initial={school}
      go={go}
      back="/escolas"
      normalize={(values) => values}
      saveRecord={saveRecord}
    >
      <FormSection title="Informacoes da Escola">
        <Field name="name" label="Nome da Escola" wide required defaultValue={school?.name} />
        <SelectField name="zone" label="Zona" options={["", "Urbana", "Rural"]} defaultValue={school?.zone} />
        <Field name="cep" label="CEP" defaultValue={school?.cep} />
        <Field name="street" label="Rua" wide defaultValue={school?.street} />
        <Field name="number" label="Numero" defaultValue={school?.number} />
        <Field name="district" label="Bairro" defaultValue={school?.district} />
        <Field name="city" label="Cidade" defaultValue={school?.city} />
        <Field name="state" label="Estado" defaultValue={school?.state} />
      </FormSection>
    </RecordForm>
  );
}

function SchoolDetail({ id, go }) {
  const { data } = useAppData();
  const school = findById(data.schools, id);
  if (!school) return <PageCard title="Escola" crumb="Escolas / Detalhes"><EmptyState text="Escola nao encontrada." /></PageCard>;
  const studentCount = data.students.filter((student) => String(student.schoolId) === String(school.id)).length;
  return (
    <PageCard title={school.name} crumb="Escolas / Detalhes">
      <Toolbar><button className="btn warning" onClick={() => go(`/escolas/${school.id}/edit`)}><Edit size={17} /> Editar</button></Toolbar>
      <div className="detail-grid">
        <Info label="ID da Escola" value={school.schoolCode || "-"} />
        <Info label="Estado" value={school.state || "-"} />
        <Info label="Cidade" value={school.city || "-"} />
        <Info label="Zona" value={school.zone || "-"} />
        <Info label="Total de Alunos" value={studentCount} />
      </div>
    </PageCard>
  );
}

function Students({ go }) {
  const { data, deleteRecord, clearCollection, importRecords, showToast } = useAppData();
  const importInputRef = useRef(null);
  const [showClearWarning, setShowClearWarning] = useState(false);
  const schoolName = (id) => findById(data.schools, id)?.name || "";
  const csvColumnOrder = "nome, cpf, data_nascimento, sexo, telefone, email, responsavel, escola_id, matricula, tipo_ensino, serie, turma, turno";
  const [draftFilters, setDraftFilters] = useState({
    search: "",
    schoolId: "",
    grade: "",
    classroom: "",
    shift: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    schoolId: "",
    grade: "",
    classroom: "",
    shift: "",
  });

  const gradeFilterOptions = [["", "Todas as series"], ...uniqueValues(data.students.map((student) => student.grade)).map((value) => [value, value])];
  const classroomFilterOptions = [["", "Todas as turmas"], ...uniqueValues(data.students.map((student) => student.classroom)).map((value) => [value, value])];
  const shiftFilterOptions = [["", "Todos os turnos"], ...uniqueValues(data.students.map((student) => student.shift)).map((value) => [value, value])];

  const filteredStudents = useMemo(() => {
    const search = normalizeCsvKey(appliedFilters.search);
    return data.students.filter((student) => {
      const matchesSearch = !search || [
        student.name,
        student.responsible,
        student.registration,
        schoolName(student.schoolId),
      ].some((value) => normalizeCsvKey(value).includes(search));
      const matchesSchool = !appliedFilters.schoolId || String(student.schoolId) === String(appliedFilters.schoolId);
      const matchesGrade = !appliedFilters.grade || student.grade === appliedFilters.grade;
      const matchesClassroom = !appliedFilters.classroom || student.classroom === appliedFilters.classroom;
      const matchesShift = !appliedFilters.shift || student.shift === appliedFilters.shift;
      return matchesSearch && matchesSchool && matchesGrade && matchesClassroom && matchesShift;
    });
  }, [appliedFilters, data.schools, data.students]);

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { search: "", schoolId: "", grade: "", classroom: "", shift: "" };
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const openImportDialog = () => {
    if (!data.schools.length) {
      showToast("Cadastre pelo menos uma escola antes de importar alunos.", "error");
      return;
    }
    importInputRef.current?.click();
  };

  const downloadCsvTemplate = () => {
    const csvContent = buildStudentCsvTemplate(data.schools);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modelo-importacao-alunos.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event) => {
    const [file] = Array.from(event.target.files || []);
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        showToast("O arquivo CSV esta vazio ou sem linhas de dados.", "error");
        return;
      }

      const payloads = [];
      const errors = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        try {
          payloads.push(normalizeStudentCsvRow(row, data.schools));
        } catch (error) {
          errors.push(`Linha ${rowNumber}: ${error.message}`);
        }
      });

      if (errors.length) {
        showToast(errors.slice(0, 2).join(" | "), "error");
      }

      await importRecords("students", payloads);
    } catch {
      showToast("Nao foi possivel ler o arquivo CSV.", "error");
    }
  };

  const clearStudents = async () => {
    if (!data.students.length) {
      showToast("Nao ha alunos cadastrados para remover.", "error");
      return;
    }
    setShowClearWarning(true);
  };

  const confirmClearStudents = async () => {
    await clearCollection("students");
    setShowClearWarning(false);
  };

  return (
    <PageCard title="Alunos" crumb="Alunos">
      <Toolbar>
        <button className="btn success" onClick={() => go("/alunos/create")}><PlusCircle size={17} /> Novo Aluno</button>
        <button className="btn success" type="button" onClick={openImportDialog}><Upload size={17} /> Importar CSV</button>
        <button className="btn outline info" type="button" onClick={downloadCsvTemplate}><Download size={17} /> Baixar Modelo CSV</button>
        <button className="btn danger ghost" type="button" onClick={clearStudents}><Trash2 size={17} /> Limpar Dados</button>
      </Toolbar>
      {showClearWarning && (
        <div className="danger-box">
          <div>
            <strong>Atencao ao limpar dados</strong>
            <p>Esta acao apagará permanentemente todos os {data.students.length} aluno(s) cadastrados na base local.</p>
          </div>
          <div className="danger-box-actions">
            <button className="btn outline muted-btn" type="button" onClick={() => setShowClearWarning(false)}>Cancelar</button>
            <button className="btn danger" type="button" onClick={confirmClearStudents}><Trash2 size={17} /> Confirmar exclusao</button>
          </div>
        </div>
      )}
      <details className="csv-guide">
        <summary>Instrucoes Importantes do CSV <span>Clique para ver o formato obrigatorio</span></summary>
        <div className="csv-guide-body">
          <p>Antes de importar, confira o modelo do arquivo. Colunas fora do padrao causam erro.</p>
          <div className="csv-example">
            <strong>Ordem das colunas</strong>
            <code>{csvColumnOrder}</code>
          </div>
          <div className="csv-rules">
            <strong>Regras</strong>
            <ul>
              <li>Somente `nome`, `escola_id`, `tipo_ensino`, `serie` e `turno` sao obrigatorios.</li>
              <li>`cpf`, `data_nascimento`, `sexo`, `telefone`, `email`, `responsavel`, `matricula` e `turma` podem ficar em branco.</li>
              <li>O campo `escola_id` deve existir no cadastro de escolas.</li>
              <li>`tipo_ensino` e `serie` devem seguir a lista do sistema.</li>
              <li>`turno` deve ser `Manha`, `Tarde`, `Noite` ou `Integral`.</li>
              <li>Se informar `sexo`, use `Masculino`, `Feminino` ou `Outro`.</li>
            </ul>
          </div>
          <div className="csv-example">
            <strong>Exemplo</strong>
            <code>{buildStudentCsvExample(data.schools)}</code>
          </div>
        </div>
      </details>
      <input ref={importInputRef} type="file" accept=".csv,text/csv" hidden onChange={handleImportFile} />
      <div className="students-filter-panel">
        <div className="students-filter-grid">
          <label className="field wide">
            <span>Buscar</span>
            <input
              value={draftFilters.search}
              onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Buscar por nome, responsavel, matricula ou escola"
            />
          </label>
          <SelectField
            label="Escola"
            name="student-school-filter"
            options={[["", "Todas as escolas"], ...data.schools.map((school) => [school.id, school.name])]}
            value={draftFilters.schoolId}
            onChange={(event) => setDraftFilters((current) => ({ ...current, schoolId: event.target.value }))}
            compact
          />
          <SelectField
            label="Serie"
            name="student-grade-filter"
            options={gradeFilterOptions}
            value={draftFilters.grade}
            onChange={(event) => setDraftFilters((current) => ({ ...current, grade: event.target.value }))}
            compact
          />
          <SelectField
            label="Turma"
            name="student-classroom-filter"
            options={classroomFilterOptions}
            value={draftFilters.classroom}
            onChange={(event) => setDraftFilters((current) => ({ ...current, classroom: event.target.value }))}
            compact
          />
          <SelectField
            label="Turno"
            name="student-shift-filter"
            options={shiftFilterOptions}
            value={draftFilters.shift}
            onChange={(event) => setDraftFilters((current) => ({ ...current, shift: event.target.value }))}
            compact
          />
        </div>
        <div className="students-filter-actions">
          <button className="btn primary" type="button" onClick={applyFilters}><Search size={16} /> Buscar</button>
          <button className="btn outline muted-btn" type="button" onClick={clearFilters}>Limpar</button>
        </div>
      </div>
      <DataBlock>
        <Table
          headers={["Nome", "Responsavel", "Serie", "Turma", "Turno", "Matricula", "Escola", "Acoes"]}
          rows={filteredStudents.map((student) => [
            student.name,
            student.responsible,
            student.grade,
            student.classroom,
            student.shift,
            student.registration,
            schoolName(student.schoolId),
            <Actions noView edit={() => go(`/alunos/${student.id}/edit`)} remove={() => deleteRecord("students", student.id)} />,
          ])}
          empty="Nenhum aluno encontrado para os filtros selecionados."
        />
      </DataBlock>
    </PageCard>
  );
}

function StudentForm({ id, go }) {
  const { data, saveRecord } = useAppData();
  const student = findById(data.students, id);
  const [educationType, setEducationType] = useState(student?.educationType || "");
  const gradeOptions = [["", "Selecione"], ...(gradesByEducationType[educationType] || []).map((grade) => [grade, grade])];
  const defaultGrade = (gradesByEducationType[educationType] || []).includes(student?.grade) ? student.grade : "";
  return (
    <RecordForm title={id ? "Editar Aluno" : "Novo Aluno"} crumb="Alunos" collection="students" id={id} initial={student} go={go} back="/alunos" saveRecord={saveRecord}>
      <FormSection title="Dados Pessoais">
        <Field name="name" label="Nome Completo" wide required defaultValue={student?.name} />
        <Field name="cpf" label="CPF" defaultValue={student?.cpf} />
        <Field name="birthDate" label="Data de Nascimento" type="date" defaultValue={student?.birthDate} />
        <SelectField name="sex" label="Sexo" options={["", "Masculino", "Feminino", "Outro"]} defaultValue={student?.sex} />
        <Field name="phone" label="Telefone" defaultValue={student?.phone} />
        <Field name="email" label="E-mail" type="email" defaultValue={student?.email} />
        <Field name="responsible" label="Responsavel" defaultValue={student?.responsible} />
        <Field name="photo" label="Foto" type="file" />
      </FormSection>
      <FormSection title="Vinculo Escolar">
        <SelectField name="schoolId" label="Escola" options={[["", "Selecione"], ...data.schools.map((school) => [school.id, formatSchoolLabel(school)])]} wide required defaultValue={student?.schoolId} />
        <Field name="registration" label="Matricula" defaultValue={student?.registration} />
        <SelectField name="shift" label="Turno" options={["", "Manha", "Tarde", "Noite", "Integral"]} defaultValue={student?.shift} />
        <SelectField
          name="educationType"
          label="Tipo de Ensino"
          options={educationTypeOptions}
          defaultValue={student?.educationType}
          required
          onChange={(event) => setEducationType(event.target.value)}
        />
        <SelectField key={educationType || "empty-grade"} name="grade" label="Serie" options={gradeOptions} defaultValue={defaultGrade} required />
        <Field name="classroom" label="Turma" defaultValue={student?.classroom} />
      </FormSection>
    </RecordForm>
  );
}

function UsersPage({ go }) {
  const { data, currentUser, deleteRecord, resetUserPassword, showToast } = useAppData();
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const openResetPassword = (user) => {
    setResetTarget(user);
    setNewPassword("");
    setConfirmPassword("");
  };

  const closeResetPassword = () => {
    setResetTarget(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const submitResetPassword = async () => {
    if (!resetTarget) return;
    if (!newPassword.trim()) {
      showToast("Informe a nova senha do usuario.", "error");
      return;
    }
    if (newPassword.trim().length < 6) {
      showToast("A nova senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("A confirmacao da senha nao confere.", "error");
      return;
    }

    const updated = await resetUserPassword(resetTarget.id, newPassword.trim());
    if (updated) closeResetPassword();
  };

  return (
    <PageCard title="Gerenciar Usuarios" crumb="Usuarios">
      <Toolbar><button className="btn success" onClick={() => go("/usuarios/create")}><PlusCircle size={17} /> Novo Usuario</button></Toolbar>
      {currentUser?.profile === "Administrador" && resetTarget && (
        <div className="password-reset-box">
          <div className="password-reset-copy">
            <strong>Redefinir senha de {resetTarget.name}</strong>
            <p>Defina uma nova senha para este usuario. A senha anterior sera substituida imediatamente.</p>
          </div>
          <div className="password-reset-fields">
            <label className="field">
              <span>Nova Senha</span>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Digite a nova senha" />
            </label>
            <label className="field">
              <span>Confirmar Nova Senha</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repita a nova senha" />
            </label>
          </div>
          <div className="password-reset-actions">
            <button className="btn outline muted-btn" type="button" onClick={closeResetPassword}>Cancelar</button>
            <button className="btn primary" type="button" onClick={submitResetPassword}><Lock size={16} /> Salvar Nova Senha</button>
          </div>
        </div>
      )}
      <SearchBox placeholder="Buscar" />
      <DataBlock>
        <Table
          headers={["Nome", "Email", "CPF", "Telefone", "Perfil", "Acoes"]}
          rows={data.users.map((user) => [
            user.name,
            user.email,
            user.cpf || "-",
            user.phone || "-",
            user.profile,
            <Actions
              noView
              edit={() => go(`/usuarios/${user.id}/edit`)}
              remove={() => deleteRecord("users", user.id)}
              extra={currentUser?.profile === "Administrador" ? { label: "Resetar Senha", onClick: () => openResetPassword(user) } : null}
            />,
          ])}
          empty="Nenhum usuario cadastrado."
        />
      </DataBlock>
    </PageCard>
  );
}

function UserForm({ id, go }) {
  const { data, saveRecord } = useAppData();
  const user = findById(data.users, id);
  const [profile, setProfile] = useState(user?.profile || "");
  const [login, setLogin] = useState(user?.login || user?.email || "");
  const isEditing = !!id;
  return (
    <RecordForm
      title={id ? "Editar Usuario" : "Novo Usuario"}
      crumb="Usuarios"
      collection="users"
      id={id}
      initial={user}
      go={go}
      back="/usuarios"
      saveRecord={saveRecord}
      normalize={(values) => ({
        ...values,
        login: String(values.login || values.email || "").trim(),
      })}
    >
      <FormSection title="Informacoes do Usuario">
        <Field name="name" label="Nome" required defaultValue={user?.name} />
        <Field name="email" label="E-mail" type="email" required defaultValue={user?.email} />
        <label className="field">
          <span>Login</span>
          <input name="login" value={login} onChange={(event) => setLogin(event.target.value)} required placeholder="Usuario para acesso ao sistema" />
        </label>
        <Field name="cpf" label="CPF" defaultValue={user?.cpf} />
        {!isEditing && <Field name="password" label="Senha Inicial" type="password" required />}
        <Field name="phone" label="Telefone" defaultValue={user?.phone} />
        <SelectField
          name="profile"
          label="Perfil"
          options={["", "Administrador", "Nutricionista", "Monitor"]}
          required
          value={profile}
          onChange={(event) => setProfile(event.target.value)}
        />
        {profile === "Nutricionista" && <Field name="crn" label="CRN" defaultValue={user?.crn} required />}
        <Field name="photo" label="Foto do Usuario (opcional)" type="file" />
        {isEditing && <p className="muted wide">Para trocar a senha deste usuario, utilize a acao `Resetar Senha` na lista de usuarios.</p>}
      </FormSection>
    </RecordForm>
  );
}

function Years({ go }) {
  const { data, deleteRecord } = useAppData();
  return (
    <SimpleList
      title="Anos Letivos"
      crumb="Anos Letivos"
      action="Novo Ano Letivo"
      onAction={() => go("/anos/create")}
      headers={["Ano", "Ativo", "Acoes"]}
      rows={data.years.map((year) => [year.year, truthy(year.active) ? "Ativo" : "Inativo", <Actions noView edit={() => go(`/anos/${year.id}/edit`)} remove={() => deleteRecord("years", year.id)} />])}
      search="Buscar ano..."
      empty="Nenhum ano letivo cadastrado."
    />
  );
}

function YearForm({ id, go }) {
  const { data, saveRecord } = useAppData();
  const year = findById(data.years, id);
  return (
    <RecordForm title={id ? "Editar Ano Letivo" : "Novo Ano Letivo"} crumb="Anos Letivos" collection="years" id={id} initial={year} go={go} back="/anos" saveRecord={saveRecord} normalize={(values) => ({ ...values, active: values.active === "true" })}>
      <FormSection title="Informacoes do Ano Letivo">
        <Field name="year" label="Ano" required defaultValue={year?.year} />
        <SelectField name="active" label="Ativo" options={[["true", "Sim"], ["false", "Nao"]]} defaultValue={String(year?.active ?? true)} />
      </FormSection>
    </RecordForm>
  );
}

function Campaigns({ go }) {
  const { data, deleteRecord, saveRecord, showToast } = useAppData();
  const blockingCampaign = getBlockingCampaign(data.campaigns);
  const closeCampaign = async (campaign) => {
    if (!campaign || isCampaignClosed(campaign)) return;
    if (!window.confirm(`Encerrar a campanha "${campaign.name}" agora?`)) return;

    await saveRecord("campaigns", {
      ...campaign,
      status: "Fechada",
      updatedAt: new Date().toISOString(),
    }, campaign.id);
  };

  return (
    <PageCard title="Campanhas" crumb="Campanhas">
      <Toolbar>
        <button
          className="btn success"
          type="button"
          disabled={!!blockingCampaign}
          onClick={() => {
            if (blockingCampaign) {
              showToast(`A campanha "${blockingCampaign.name}" ainda nao foi finalizada.`, "error");
              return;
            }
            go("/campanhas/create");
          }}
        >
          <PlusCircle size={17} /> Nova Campanha
        </button>
      </Toolbar>
      {blockingCampaign && (
        <div className="alert error">
          A campanha <strong>{blockingCampaign.name}</strong> ainda nao foi finalizada. Uma nova campanha so pode ser criada apos o encerramento da atual.
        </div>
      )}
      <SearchBox placeholder="Buscar campanha..." />
      <DataBlock>
        <Table
          headers={["Nome", "Ano Letivo", "Inicio", "Fim", "Status", "Acoes"]}
          rows={data.campaigns.map((campaign) => [
            campaign.name,
            campaign.year,
            formatDate(campaign.startDate),
            formatDate(campaign.endDate),
            getCampaignStatusLabel(campaign),
            <Actions
              noView
              edit={() => go(`/campanhas/${campaign.id}/edit`)}
              remove={() => deleteRecord("campaigns", campaign.id)}
              extra={isCampaignClosed(campaign) ? null : { label: "Encerrar", onClick: () => closeCampaign(campaign) }}
            />,
          ])}
          empty="Nenhuma campanha cadastrada."
        />
      </DataBlock>
    </PageCard>
  );
}

function CampaignForm({ id, go }) {
  const { data, saveRecord } = useAppData();
  const campaign = findById(data.campaigns, id);
  const blockingCampaign = getBlockingCampaign(data.campaigns, { id });

  if (!id && blockingCampaign) {
    return (
      <PageCard title="Nova Campanha" crumb="Campanhas">
        <div className="alert error">
          A campanha <strong>{blockingCampaign.name}</strong> ainda nao foi finalizada. Finalize a campanha atual antes de cadastrar uma nova.
        </div>
        <div className="form-actions">
          <button className="btn outline muted-btn" type="button" onClick={() => go("/campanhas")}>Voltar para Campanhas</button>
          <button className="btn primary" type="button" onClick={() => go(`/campanhas/${blockingCampaign.id}/edit`)}>Editar Campanha Atual</button>
        </div>
      </PageCard>
    );
  }

  return (
    <RecordForm title={id ? "Editar Campanha" : "Nova Campanha"} crumb="Campanhas" collection="campaigns" id={id} initial={campaign} go={go} back="/campanhas" saveRecord={saveRecord}>
      <FormSection title="Informacoes da Campanha">
        <Field name="name" label="Nome" required defaultValue={campaign?.name} />
        <SelectField name="year" label="Ano Letivo" options={[["", "-- Selecione --"], ...data.years.map((year) => [year.year, year.year])]} defaultValue={campaign?.year} required />
        <Field name="startDate" label="Data Inicio" type="date" defaultValue={campaign?.startDate} required />
        <Field name="endDate" label="Data Fim" type="date" defaultValue={campaign?.endDate} required />
        <SelectField name="status" label="Status" options={["Pendente", "Aberta", "Fechada"]} defaultValue={campaign?.status || "Pendente"} />
      </FormSection>
    </RecordForm>
  );
}

function Nutritionists({ go }) {
  const { data, deleteRecord } = useAppData();
  return (
    <PageCard title="Vinculo" crumb="Vinculo">
      <Toolbar><button className="btn success" onClick={() => go("/nutricionistas/create")}><PlusCircle size={17} /> Novo Nutricionista</button></Toolbar>
      <div className="filters two"><SearchBox placeholder="Nome, CPF, CRN ou telefone" /><SelectField label="Escola" options={["Todas as escolas", ...data.schools.map((school) => formatSchoolLabel(school))]} compact /></div>
      <div className="nutri-grid">
        {data.nutritionists.length ? data.nutritionists.map((item) => (
          <NutriCard key={item.id} item={item} edit={() => go(`/nutricionistas/${item.id}/edit`)} remove={() => deleteRecord("nutritionists", item.id)} />
        )) : <EmptyState text="Nenhum nutricionista vinculado." />}
      </div>
    </PageCard>
  );
}

function NutritionistForm({ id, go }) {
  const { data, saveRecord } = useAppData();
  const item = findById(data.nutritionists, id);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState(() => item?.schoolIds || []);

  useEffect(() => {
    setSelectedSchoolIds(item?.schoolIds || []);
  }, [item?.id]);

  return (
    <RecordForm
      title={id ? "Editar Nutricionista" : "Novo Nutricionista"}
      crumb="Vinculo"
      collection="nutritionists"
      id={id}
      initial={item}
      go={go}
      back="/nutricionistas"
      saveRecord={saveRecord}
      normalize={(values) => ({
        ...values,
        name: findById(data.users, values.userId)?.name || values.name || "",
        schoolIds: Array.isArray(values.schoolIds) ? values.schoolIds : values.schoolIds ? [values.schoolIds] : [],
      })}
    >
      <FormSection title="Informacoes do Nutricionista">
        <SelectField name="userId" label="Usuario" options={[["", "Selecione..."], ...data.users.map((u) => [u.id, u.name])]} required defaultValue={item?.userId} />
        <Field name="phone" label="Telefone" defaultValue={item?.phone} />
        <Field name="crn" label="CRN" defaultValue={item?.crn} />
        <SchoolAssignmentsField
          label="Escolas"
          name="schoolIds"
          schools={data.schools}
          selectedSchoolIds={selectedSchoolIds}
          onChange={setSelectedSchoolIds}
        />
      </FormSection>
    </RecordForm>
  );
}

function Reports({ go }) {
  const cards = [
    ["Por Escolas (Estado, Cidade, Municipio)", Building2, "/relatorios/escolas"],
    ["Avaliacoes (Com filtros avancados)", ClipboardList, "/relatorios/avaliacoes"],
    ["Individual (Dados completos)", GraduationCap, "/relatorios/individual"],
    ["Campanha (Graficos e estatisticas)", FileBarChart, "/relatorios/campanha"],
  ];
  return (
    <PageCard title="Relatorios Nutricionais" crumb="Admin / Relatorios" icon={<BarChart3 className="title-icon" />}>
      <div className="report-grid">{cards.map(([label, Icon, path]) => <button key={path} className="report-card" onClick={() => go(path)}><Icon size={34} /><span>{label}</span></button>)}</div>
    </PageCard>
  );
}

function ReportSchools() {
  const { data } = useAppData();
  const [filters, setFilters] = useState({
    state: "",
    city: "",
    municipality: "",
    zone: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const resizeCharts = () => {
      window.requestAnimationFrame(() => {
        Object.values(ChartJS.instances || {}).forEach((chart) => chart?.resize?.());
      });
    };

    window.addEventListener("beforeprint", resizeCharts);
    window.addEventListener("afterprint", resizeCharts);
    return () => {
      window.removeEventListener("beforeprint", resizeCharts);
      window.removeEventListener("afterprint", resizeCharts);
    };
  }, []);

  const schoolReportRows = useMemo(() => {
    const grouped = new Map((data.schools || []).map((school) => [school.id, {
      schoolId: school.id,
      schoolName: school.name || "-",
      state: school.state || "",
      city: school.city || "",
      municipality: school.district || "",
      zone: school.zone || "",
      studentCount: 0,
      evaluatedStudentIds: new Set(),
      evaluationCount: 0,
      bmiValues: [],
      latestCampaign: "",
      latestEvaluationDate: "",
    }]));

    for (const student of data.students || []) {
      const current = grouped.get(student.schoolId);
      if (current) current.studentCount += 1;
    }

    for (const evaluation of data.evaluations || []) {
      const current = grouped.get(evaluation.schoolId);
      if (!current) continue;

      current.evaluationCount += 1;
      if (evaluation.studentId || evaluation.id) {
        current.evaluatedStudentIds.add(String(evaluation.studentId || evaluation.id));
      }

      const bmiValue = Number(String(evaluation?.anthropometry?.bmi || "").replace(",", "."));
      if (Number.isFinite(bmiValue) && bmiValue > 0) {
        current.bmiValues.push(bmiValue);
      }

      const latestDate = evaluation.evaluatedAt || evaluation.updatedAt || evaluation.createdAt || "";
      if (!current.latestEvaluationDate || new Date(latestDate) > new Date(current.latestEvaluationDate)) {
        current.latestEvaluationDate = latestDate;
        current.latestCampaign = evaluation.campaignName || current.latestCampaign || "-";
      }
    }

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        evaluatedStudentCount: item.evaluatedStudentIds.size,
        coverageRate: item.studentCount ? item.evaluatedStudentIds.size / item.studentCount : 0,
        averageBmi: item.bmiValues.length ? (item.bmiValues.reduce((sum, value) => sum + value, 0) / item.bmiValues.length) : null,
      }))
      .sort((left, right) => left.schoolName.localeCompare(right.schoolName, "pt-BR"));
  }, [data.evaluations, data.schools, data.students]);

  const availableStates = useMemo(() => uniqueValues(schoolReportRows.map((item) => item.state)), [schoolReportRows]);
  const stateFilteredRows = useMemo(() => (
    filters.state
      ? schoolReportRows.filter((item) => item.state === filters.state)
      : schoolReportRows
  ), [filters.state, schoolReportRows]);
  const availableCities = useMemo(() => uniqueValues(stateFilteredRows.map((item) => item.city)), [stateFilteredRows]);
  const cityFilteredRows = useMemo(() => (
    filters.city
      ? stateFilteredRows.filter((item) => item.city === filters.city)
      : stateFilteredRows
  ), [filters.city, stateFilteredRows]);
  const availableMunicipalities = useMemo(() => uniqueValues(cityFilteredRows.map((item) => item.municipality)), [cityFilteredRows]);
  const municipalityFilteredRows = useMemo(() => (
    filters.municipality
      ? cityFilteredRows.filter((item) => item.municipality === filters.municipality)
      : cityFilteredRows
  ), [cityFilteredRows, filters.municipality]);
  const availableZones = useMemo(() => uniqueValues(municipalityFilteredRows.map((item) => item.zone)), [municipalityFilteredRows]);

  const filteredRows = useMemo(() => municipalityFilteredRows.filter((item) => (
    !filters.zone || item.zone === filters.zone
  )), [filters.zone, municipalityFilteredRows]);

  const summary = useMemo(() => filteredRows.reduce((acc, item) => ({
    schools: acc.schools + 1,
    students: acc.students + item.studentCount,
    evaluatedStudents: acc.evaluatedStudents + item.evaluatedStudentCount,
    evaluations: acc.evaluations + item.evaluationCount,
  }), { schools: 0, students: 0, evaluatedStudents: 0, evaluations: 0 }), [filteredRows]);

  const coveragePercent = summary.students ? Math.round((summary.evaluatedStudents / summary.students) * 100) : 0;
  const pendingStudents = Math.max(summary.students - summary.evaluatedStudents, 0);
  const chartRows = useMemo(() => filteredRows.filter((item) => item.studentCount || item.evaluatedStudentCount || item.evaluationCount), [filteredRows]);
  const bmiChartRows = useMemo(() => filteredRows.filter((item) => Number.isFinite(item.averageBmi)), [filteredRows]);
  const maxStudentCount = useMemo(() => Math.max(1, ...chartRows.map((item) => item.studentCount), ...chartRows.map((item) => item.evaluatedStudentCount)), [chartRows]);
  const maxAverageBmi = useMemo(() => Math.max(1, ...bmiChartRows.map((item) => item.averageBmi || 0)), [bmiChartRows]);

  const coverageChartData = useMemo(() => ({
    labels: ["Avaliados", "Nao avaliados"],
    datasets: [{
      data: [summary.evaluatedStudents, pendingStudents],
      backgroundColor: ["#72b763", "#f1c86a"],
      borderColor: ["#4f9448", "#d9a93e"],
      borderWidth: 1,
    }],
  }), [pendingStudents, summary.evaluatedStudents]);

  const studentChartData = useMemo(() => ({
    labels: chartRows.map((item) => item.schoolName),
    datasets: [
      { label: "Alunos cadastrados", data: chartRows.map((item) => item.studentCount), backgroundColor: "#72b763", borderColor: "#4f9448", borderWidth: 1, borderRadius: 8 },
      { label: "Alunos avaliados", data: chartRows.map((item) => item.evaluatedStudentCount), backgroundColor: "#f0b95d", borderColor: "#d49335", borderWidth: 1, borderRadius: 8 },
    ],
  }), [chartRows]);

  const bmiChartData = useMemo(() => ({
    labels: bmiChartRows.map((item) => item.schoolName),
    datasets: [{ label: "IMC medio", data: bmiChartRows.map((item) => Number(item.averageBmi.toFixed(2))), backgroundColor: "#68a99d", borderColor: "#4c8f84", borderWidth: 1, borderRadius: 8 }],
  }), [bmiChartRows]);

  const coverageChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: "#476347", boxWidth: 12, boxHeight: 12 } },
      tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed} aluno(s)` } },
    },
  }), []);

  const schoolChartOptions = useMemo(() => ({
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: "#476347", boxWidth: 12, boxHeight: 12 } },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.parsed.x}` } },
    },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0, color: "#6f8268" }, grid: { color: "rgba(111,143,98,.12)" } },
      y: { ticks: { color: "#4d654b", font: { size: 11 } }, grid: { display: false } },
    },
  }), []);

  const bmiChartOptions = useMemo(() => ({
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `IMC medio: ${Number(context.parsed.x || 0).toFixed(2)}` } },
    },
    scales: {
      x: { beginAtZero: true, ticks: { color: "#6f8268" }, grid: { color: "rgba(111,143,98,.12)" } },
      y: { ticks: { color: "#4d654b", font: { size: 11 } }, grid: { display: false } },
    },
  }), []);

  const updateFilter = (field, value) => {
    setFilters((current) => {
      if (field === "state") return { state: value, city: "", municipality: "", zone: "" };
      if (field === "city") return { ...current, city: value, municipality: "", zone: "" };
      if (field === "municipality") return { ...current, municipality: value, zone: "" };
      return { ...current, [field]: value };
    });
  };

  const resetFilters = () => {
    setFilters({ state: "", city: "", municipality: "", zone: "" });
  };

  return (
    <PageCard title="Relatorio por Escola (IMC)" crumb="Relatorios" icon={<ClipboardList className="title-icon" />} className="report-page">
      <div className="report-filter">
        <SelectField label="Estado" value={filters.state} onChange={(event) => updateFilter("state", event.target.value)} options={[["", "Todos os estados"], ...availableStates.map((value) => [value, value])]} />
        <SelectField label="Cidade" value={filters.city} onChange={(event) => updateFilter("city", event.target.value)} options={[["", "Todas as cidades"], ...availableCities.map((value) => [value, value])]} />
        <SelectField label="Municipio" value={filters.municipality} onChange={(event) => updateFilter("municipality", event.target.value)} options={[["", "Todos os municipios"], ...availableMunicipalities.map((value) => [value, value])]} />
        <SelectField label="Zona" value={filters.zone} onChange={(event) => updateFilter("zone", event.target.value)} options={[["", "Todas as zonas"], ...availableZones.map((value) => [value, value])]} />
        <div className="button-row">
          <button className="btn outline danger-text" type="button" onClick={() => window.print()}>PDF</button>
          <button className="btn outline success-text" type="button" onClick={() => window.print()}>Imprimir</button>
          <button className="btn outline primary-text" type="button" onClick={resetFilters}>Limpar</button>
        </div>
      </div>

      <div className="school-report-summary">
        <div className="report-metric">
          <span>Escolas no filtro</span>
          <strong>{summary.schools}</strong>
        </div>
        <div className="report-metric">
          <span>Alunos cadastrados</span>
          <strong>{summary.students}</strong>
        </div>
        <div className="report-metric">
          <span>Alunos avaliados</span>
          <strong>{summary.evaluatedStudents}</strong>
        </div>
        <div className="report-metric">
          <span>Cobertura</span>
          <strong>{coveragePercent}%</strong>
        </div>
      </div>

      <div className="school-report-charts">
        <Panel title="Cobertura das Avaliacoes">
          {summary.students ? (
            <div className="chart-box school-report-chart pie-chart">
              <Pie data={coverageChartData} options={coverageChartOptions} />
            </div>
          ) : <EmptyState text="Nenhum aluno encontrado para os filtros selecionados." />}
        </Panel>
        <Panel title="Cadastrados x Avaliados por Escola">
          {chartRows.length ? <div className="chart-box school-report-chart"><Bar data={studentChartData} options={schoolChartOptions} /></div> : <EmptyState text="Nenhum aluno encontrado para os filtros selecionados." />}
        </Panel>
        <Panel title="IMC Medio por Escola">
          {bmiChartRows.length ? <div className="chart-box school-report-chart compact-chart"><Bar data={bmiChartData} options={bmiChartOptions} /></div> : <EmptyState text="Nenhum IMC encontrado para os filtros selecionados." />}
        </Panel>
      </div>

      <section className="school-report-print-charts">
        <div className="print-chart-card coverage-card">
          <h2>Cobertura das Avaliacoes</h2>
          <div className="print-coverage-layout">
            <div className="print-pie" style={{ "--coverage-deg": `${coveragePercent * 3.6}deg` }} aria-hidden="true" />
            <div className="print-chart-legend">
              <span><i className="legend-green" /> Avaliados: {summary.evaluatedStudents}</span>
              <span><i className="legend-yellow" /> Nao avaliados: {pendingStudents}</span>
              <strong>{coveragePercent}% de cobertura</strong>
            </div>
          </div>
        </div>

        <div className="print-chart-card">
          <h2>Cadastrados x Avaliados por Escola</h2>
          <div className="print-bar-list">
            {chartRows.map((item) => (
              <div className="print-bar-row" key={`students-${item.schoolId}`}>
                <span className="print-bar-label">{item.schoolName}</span>
                <div className="print-bar-stack">
                  <div className="print-track">
                    <div className="print-bar registered" style={{ width: `${Math.max((item.studentCount / maxStudentCount) * 100, item.studentCount ? 2 : 0)}%` }} />
                  </div>
                  <div className="print-track">
                    <div className="print-bar evaluated" style={{ width: `${Math.max((item.evaluatedStudentCount / maxStudentCount) * 100, item.evaluatedStudentCount ? 2 : 0)}%` }} />
                  </div>
                </div>
                <span className="print-bar-values">{item.studentCount} / {item.evaluatedStudentCount}</span>
              </div>
            ))}
          </div>
          <div className="print-chart-legend horizontal">
            <span><i className="legend-green" /> Cadastrados</span>
            <span><i className="legend-yellow" /> Avaliados</span>
          </div>
        </div>

        <div className="print-chart-card">
          <h2>IMC Medio por Escola</h2>
          <div className="print-bar-list">
            {bmiChartRows.map((item) => (
              <div className="print-bar-row" key={`bmi-${item.schoolId}`}>
                <span className="print-bar-label">{item.schoolName}</span>
                <div className="print-track">
                  <div className="print-bar bmi" style={{ width: `${Math.max(((item.averageBmi || 0) / maxAverageBmi) * 100, 2)}%` }} />
                </div>
                <span className="print-bar-values">{item.averageBmi.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {filteredRows.length ? (
        <>
          <section className="school-report-print-schools">
            <h2>Escolas</h2>
            <ul>
              {filteredRows.map((item) => <li key={item.schoolId}>{item.schoolName}</li>)}
            </ul>
          </section>
          <div className="school-report-table">
            <DataBlock>
              <Table
                headers={["Escola", "Cadastrados", "Avaliados", "Cobertura", "Avaliacoes", "IMC Medio", "Ultima Campanha", "Ultima Avaliacao"]}
                rows={filteredRows.map((item) => [
                  item.schoolName,
                  item.studentCount,
                  item.evaluatedStudentCount,
                  `${Math.round(item.coverageRate * 100)}%`,
                  item.evaluationCount,
                  Number.isFinite(item.averageBmi) ? item.averageBmi.toFixed(2) : "-",
                  item.latestCampaign || "-",
                  formatDateTime(item.latestEvaluationDate) || "-",
                ])}
                empty="Nenhuma escola encontrada para os filtros selecionados."
              />
            </DataBlock>
          </div>
        </>
      ) : (
        <div className="alert warning-light">Nenhuma escola encontrada para os filtros selecionados.</div>
      )}
      <ReportCompanyFooter />
    </PageCard>
  );
}

function ReportEvaluations() {
  return <ReportFrame title="Relatorio de Avaliacoes por Aluno" fields={["Tipo de Relatorio", "Escola", "Turma", "Serie", "Sexo", "IMC minimo", "IMC maximo", "Data Inicio", "Data Fim"]} actions={["Filtrar", "PDF", "CSV"]} empty="Nenhuma avaliacao encontrada com os criterios selecionados." />;
}

function ReportIndividual({ go }) {
  const { data } = useAppData();
  const [filters, setFilters] = useState({
    school: "",
    campaign: "",
    shift: "",
    grade: "",
    classroom: "",
    sex: "",
    student: "",
    startDate: "",
    endDate: "",
  });

  const evaluationRows = useMemo(() => (data.evaluations || []).map((evaluation) => {
    const student = findById(data.students, evaluation.studentId);
    const school = findById(data.schools, evaluation.schoolId);
    return {
      evaluation,
      student,
      school,
      schoolName: evaluation.schoolName || school?.name || "-",
      campaignName: evaluation.campaignName || findCampaignForEvaluation(data.campaigns, evaluation)?.name || "-",
      shift: evaluation.studentShift || student?.shift || "",
      grade: evaluation.studentGrade || student?.grade || "",
      classroom: evaluation.studentClassroom || student?.classroom || "",
      sex: evaluation.sex || student?.sex || "",
      studentName: evaluation.studentName || student?.name || "-",
      evaluatedAt: evaluation.evaluatedAt || evaluation.updatedAt || evaluation.createdAt || "",
    };
  }), [data.campaigns, data.evaluations, data.schools, data.students]);

  const schoolOptions = useMemo(() => [["", "Todas as escolas"], ...uniqueValues(evaluationRows.map((item) => item.schoolName)).map((value) => [value, value])], [evaluationRows]);
  const campaignOptions = useMemo(() => [["", "Todas as campanhas"], ...uniqueValues(evaluationRows.map((item) => item.campaignName)).map((value) => [value, value])], [evaluationRows]);
  const shiftOptions = useMemo(() => [["", "Todos os turnos"], ...uniqueValues(evaluationRows.map((item) => item.shift)).map((value) => [value, value])], [evaluationRows]);
  const gradeOptions = useMemo(() => [["", "Todas as series"], ...uniqueValues(evaluationRows.map((item) => item.grade)).map((value) => [value, value])], [evaluationRows]);
  const classroomOptions = useMemo(() => [["", "Todas as turmas"], ...uniqueValues(evaluationRows.map((item) => item.classroom)).map((value) => [value, value])], [evaluationRows]);
  const sexOptions = useMemo(() => [["", "Todos os sexos"], ...uniqueValues(evaluationRows.map((item) => item.sex)).map((value) => [value, value])], [evaluationRows]);
  const studentOptions = useMemo(() => [["", "Todos os alunos"], ...uniqueValues(evaluationRows.map((item) => item.studentName)).map((value) => [value, value])], [evaluationRows]);

  const filteredRows = useMemo(() => evaluationRows.filter((item) => {
    const evaluationDate = String(item.evaluatedAt || "").slice(0, 10);
    if (filters.school && item.schoolName !== filters.school) return false;
    if (filters.campaign && item.campaignName !== filters.campaign) return false;
    if (filters.shift && item.shift !== filters.shift) return false;
    if (filters.grade && item.grade !== filters.grade) return false;
    if (filters.classroom && item.classroom !== filters.classroom) return false;
    if (filters.sex && item.sex !== filters.sex) return false;
    if (filters.student && item.studentName !== filters.student) return false;
    if (filters.startDate && (!evaluationDate || evaluationDate < filters.startDate)) return false;
    if (filters.endDate && (!evaluationDate || evaluationDate > filters.endDate)) return false;
    return true;
  }), [evaluationRows, filters]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      school: "",
      campaign: "",
      shift: "",
      grade: "",
      classroom: "",
      sex: "",
      student: "",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <PageCard title="Relatorio Nutricional Individual" crumb="Admin / Relatorios" icon={<ClipboardList className="title-icon" />} className="report-page">
      <div className="report-filter">
        <SelectField label="Escola" value={filters.school} onChange={(event) => updateFilter("school", event.target.value)} options={schoolOptions} />
        <SelectField label="Campanha" value={filters.campaign} onChange={(event) => updateFilter("campaign", event.target.value)} options={campaignOptions} />
        <SelectField label="Turno" value={filters.shift} onChange={(event) => updateFilter("shift", event.target.value)} options={shiftOptions} />
        <SelectField label="Serie" value={filters.grade} onChange={(event) => updateFilter("grade", event.target.value)} options={gradeOptions} />
        <SelectField label="Turma" value={filters.classroom} onChange={(event) => updateFilter("classroom", event.target.value)} options={classroomOptions} />
        <SelectField label="Sexo" value={filters.sex} onChange={(event) => updateFilter("sex", event.target.value)} options={sexOptions} />
        <label className="field">
          <span>Data Inicio</span>
          <input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
        </label>
        <label className="field">
          <span>Data Fim</span>
          <input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
        </label>
        <SelectField label="Aluno" value={filters.student} onChange={(event) => updateFilter("student", event.target.value)} options={studentOptions} />
        <div className="button-row">
          <button className="btn outline primary-text" type="button" onClick={clearFilters}>Limpar</button>
          <button className="btn outline success-text" type="button" onClick={() => window.print()}>Imprimir</button>
        </div>
      </div>
      <DataBlock>
        <Table
          headers={["Aluno", "Escola", "Campanha", "Serie", "Turno", "Data", "Acoes"]}
          rows={filteredRows.map((item) => [
            item.studentName,
            item.schoolName,
            item.campaignName,
            item.grade || "-",
            item.shift || "-",
            formatDateTime(item.evaluatedAt),
            <div className="actions">
              <button className="mini info" type="button" onClick={() => go(`/relatorios/individual/${item.evaluation.id}`)}>Ver Relatorio</button>
            </div>,
          ])}
          empty="Nenhuma avaliacao encontrada com os criterios selecionados."
        />
      </DataBlock>
      <ReportCompanyFooter />
    </PageCard>
  );
}

function ReportCampaign() {
  return <ReportFrame title="Resumo de Campanha Nutricional" fields={["Estado", "Cidade", "Zona", "Escola", "Campanha", "Data Inicio", "Data Fim"]} actions={["Filtrar", "Limpar", "Gerar PDF"]} empty="Nenhuma avaliacao encontrada para gerar o resumo." />;
}

function ReportFrame({ title, fields, actions, empty }) {
  const { data } = useAppData();
  return (
    <PageCard title={title} crumb="Relatorios" icon={<ClipboardList className="title-icon" />} className="report-page">
      <div className="report-filter">
        {fields.map((field) => field.includes("Data") ? <Field key={field} label={field} type="date" /> : <SelectField key={field} label={field} options={optionFor(field, data)} />)}
        <div className="button-row">{actions.map((label, index) => <button key={label} className={`btn ${index === 0 ? "outline primary-text" : label.includes("PDF") ? "outline danger-text" : "outline success-text"}`}>{label === "Filtrar" && <Search size={16} />}{label}</button>)}</div>
      </div>
      <div className="alert warning-light">{empty}</div>
      <ReportCompanyFooter />
    </PageCard>
  );
}

function SettingsPage() {
  const { data, saveSettings } = useAppData();
  const settings = data.settings;
  const submit = async (event) => {
    event.preventDefault();
    await saveSettings(await readSettingsForm(event.currentTarget, settings));
  };
  return (
    <PageCard title="Preferencias da Plataforma" crumb="Configuracoes">
      <form onSubmit={submit}>
        <FormSection title="Identidade e Branding">
          <Field name="systemName" label="Nome do Sistema" defaultValue={settings.systemName} />
          <Field name="logo" label="Logo do Sistema" type="file" />
          <Field name="favicon" label="Favicon" type="file" />
          <Field name="loginBackground" label="Imagem de Fundo do Login" type="file" />
          <Field name="backgroundBlur" label="Blur do Fundo (px)" type="range" defaultValue={settings.backgroundBlur || 7} />
          <Field name="backgroundBrightness" label="Brilho do Fundo" type="range" defaultValue={settings.backgroundBrightness || 30} />
        </FormSection>
        <FormSection title="Informacoes da Organizacao">
          <Field name="companyName" label="Nome da Empresa" defaultValue={settings.companyName} />
          <Field name="tradeName" label="Nome Fantasia" defaultValue={settings.tradeName} />
          <Field name="document" label="CNPJ/CPF" defaultValue={settings.document} />
          <Field name="email" label="E-mail" type="email" defaultValue={settings.email} />
          <Field name="phone" label="Telefone/WhatsApp" defaultValue={settings.phone} />
          <Field name="address" label="Endereco" wide defaultValue={settings.address} />
          <Field name="site" label="Site Oficial" defaultValue={settings.site} />
        </FormSection>
        <FormSection title="Experiencia da Plataforma">
          <SelectField name="language" label="Idioma Padrao" options={["pt-BR", "en-US"]} defaultValue={settings.language} />
          <SelectField name="timezone" label="Fuso Horario" options={["America/Sao_Paulo", "America/Manaus", "America/Cuiaba", "UTC"]} defaultValue={settings.timezone} />
          <SelectField name="maintenanceMode" label="Modo de Manutencao" options={[["false", "Desativado"], ["true", "Ativado"]]} defaultValue={String(settings.maintenanceMode)} />
          <ColorChoices defaultValue={settings.sidebarColor} />
        </FormSection>
        <FormSection title="Integracoes">
          <Field name="smtpHost" label="SMTP Host" defaultValue={settings.smtpHost} />
          <Field name="smtpPort" label="SMTP Port" defaultValue={settings.smtpPort} />
          <Field name="smtpUser" label="SMTP User" defaultValue={settings.smtpUser} />
          <Field name="smtpPassword" label="SMTP Password" type="password" defaultValue={settings.smtpPassword} />
          <Field name="googleMapsApi" label="API Google Maps" defaultValue={settings.googleMapsApi} />
          <Field name="aiApi" label="API IA" defaultValue={settings.aiApi} />
        </FormSection>
        <FormSection title="Mensagem de Boas-vindas">
          <SelectField name="bannerActive" label="Banner Ativo" options={[["false", "Nao"], ["true", "Sim"]]} defaultValue={String(settings.bannerActive || false)} />
          <EditorMock defaultValue={settings.bannerHtml} />
        </FormSection>
        <button className="btn primary save-wide" type="submit"><Save size={17} /> Salvar Preferencias</button>
      </form>
    </PageCard>
  );
}

function Profile() {
  const { currentUser } = useAppData();
  return (
    <PageCard title="Meu Perfil" crumb="Profile">
      <FormSection title="Informacoes do Usuario">
        <Field label="Foto do perfil" type="file" />
        <Field label="Nome" defaultValue={currentUser?.name} />
        <Field label="Login" defaultValue={currentUser?.login} />
      </FormSection>
      <FormSection title="Alterar Senha">
        <p className="muted wide">Garanta que sua conta esteja protegida utilizando uma senha longa, segura e dificil de adivinhar.</p>
        <Field label="Senha Atual" type="password" />
        <Field label="Nova Senha" type="password" />
        <Field label="Confirmar Nova Senha" type="password" />
      </FormSection>
      <button className="floating-save" type="button"><Save size={17} /> Salvar</button>
    </PageCard>
  );
}

function ReadOnlyField({ label, value, wide }) {
  return <div className={`field readonly-field ${wide ? "wide" : ""}`}><span>{label}</span><div className="readonly-value">{value || "-"}</div></div>;
}

function TextAreaField({ label, value, onChange, placeholder = "", wide = true }) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} />
    </label>
  );
}

function NutritionSectionCard({ title, enabled, onToggle, children }) {
  return (
    <section className={`form-section nutrition-section ${enabled ? "enabled" : "disabled"}`}>
      <div className="section-head">
        <h2>{title}</h2>
        <button className={`toggle-btn ${enabled ? "active" : ""}`} type="button" onClick={onToggle}>{enabled ? "Ativo" : "Inativo"}</button>
      </div>
      {enabled ? <div className="form-grid nutrition-section-body">{children}</div> : <div className="section-disabled-copy">Sessao opcional desativada para esta avaliacao.</div>}
    </section>
  );
}

function CheckItem({ label, checked, onChange }) {
  return (
    <label className="check-card">
      <input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ReportSection({ title, enabled, children }) {
  if (!enabled) return null;
  return (
    <section className="report-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ReportInfo({ label, value, wide, className = "" }) {
  if (!hasContent(value)) return null;
  return (
    <div className={`report-info ${wide ? "wide" : ""} ${className}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReportHeaderLogo() {
  const { data } = useAppData();
  const logo = data.settings?.logo;
  if (!logo) return null;
  return <img className="report-header-logo" src={logo} alt="Logo do sistema" />;
}

function ReportCompanyFooter() {
  const { data } = useAppData();
  const settings = data.settings || {};
  const companyName = hasContent(settings.companyName) ? settings.companyName : "";
  const items = [
    ["CNPJ/CPF", settings.document],
    ["Telefone/WhatsApp", settings.phone],
    ["E-mail", settings.email],
    ["Endereco", settings.address],
  ].filter(([, value]) => hasContent(value));

  if (!companyName && !items.length) return null;

  return (
    <div className="report-company-footer" aria-label="Informacoes da empresa">
      {companyName && <strong>{companyName}</strong>}
      {!!items.length && (
        <div>
          {items.map(([label, value]) => <span key={label}>{label}: {value}</span>)}
        </div>
      )}
    </div>
  );
}

function RecordForm({ title, crumb, collection, id, children, go, back, saveRecord, normalize = (values) => values }) {
  const submit = async (event) => {
    event.preventDefault();
    const values = normalize(readForm(event.currentTarget));
    const saved = await saveRecord(collection, values, id);
    if (saved) go(back);
  };
  return (
    <PageCard title={title} crumb={crumb}>
      <form onSubmit={submit}>
        {children}
        <div className="form-actions">
          <button className="btn outline muted-btn" type="button" onClick={() => go(back)}>Cancelar</button>
          <button className="btn primary" type="submit"><Save size={17} /> Salvar</button>
        </div>
      </form>
    </PageCard>
  );
}

function SimpleList({ title, crumb, action, onAction, headers, rows, search, empty }) {
  return (
    <PageCard title={title} crumb={crumb}>
      <Toolbar><button className="btn success" onClick={onAction}><PlusCircle size={17} /> {action}</button></Toolbar>
      <SearchBox placeholder={search} />
      <DataBlock><Table headers={headers} rows={rows} empty={empty} /></DataBlock>
    </PageCard>
  );
}

function Toolbar({ children }) {
  return <div className="toolbar">{children}</div>;
}

function SearchBox({ placeholder }) {
  return <div className="searchbox"><input placeholder={placeholder} /><button className="btn primary" type="button"><Search size={16} /> Buscar</button><button className="btn outline muted-btn" type="button">Limpar</button></div>;
}

function DataBlock({ children }) {
  return <div className="data-block">{children}</div>;
}

function Panel({ title, children }) {
  return <section className="panel"><h2>{title}</h2><div className="panel-body">{children}</div></section>;
}

function PediatricGrowthCharts({ anthropometryResult }) {
  const chartModel = useMemo(() => buildBmiGrowthChartModel(anthropometryResult), [anthropometryResult]);
  const isPrintMode = typeof window !== "undefined" && window.matchMedia && window.matchMedia("print").matches;

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: false },
    animation: false,
    layout: { padding: isPrintMode ? { top: 4, right: 8, bottom: 2, left: 4 } : { top: 4, right: 8, bottom: 0, left: 4 } },
    plugins: {
      legend: {
        position: "bottom",
        align: "start",
        labels: {
          boxWidth: isPrintMode ? 10 : 12,
          boxHeight: 3,
          usePointStyle: false,
          color: "#476347",
          padding: isPrintMode ? 8 : 10,
          font: { size: isPrintMode ? 9 : 10 },
          filter(item) {
            return item.text !== "Avaliacao atual";
          },
        },
      },
      tooltip: {
        callbacks: {
          label(context) {
            const xValue = Number(context.parsed.x || 0).toFixed(2);
            const yValue = Number(context.parsed.y || 0).toFixed(2);
            return `${context.dataset.label}: ${yValue} IMC aos ${xValue} anos`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "Idade (anos)", color: "#476347", font: { size: isPrintMode ? 9 : 12 } },
        ticks: { color: "#6f8268", maxTicksLimit: isPrintMode ? 6 : 8, font: { size: isPrintMode ? 9 : 11 } },
        grid: { color: "rgba(111,143,98,.08)" },
      },
      y: {
        title: { display: true, text: "IMC", color: "#476347", font: { size: isPrintMode ? 9 : 12 } },
        ticks: { color: "#6f8268", maxTicksLimit: isPrintMode ? 6 : 7, font: { size: isPrintMode ? 9 : 11 } },
        grid: { color: "rgba(111,143,98,.08)" },
      },
    },
  }), [isPrintMode]);

  if (!anthropometryResult) return null;

  if (anthropometryResult.typeClassification === "ADULTO_IMC") {
    return (
      <section className="growth-chart-section">
        <div className="growth-chart-header">
          <div>
            <span className="bmi-eyebrow">Curvas de Crescimento</span>
            <h3>Grafico de percentil e escore-z nao se aplica ao IMC adulto</h3>
            <p>No adulto, o relatorio utiliza a classificacao fixa de IMC e nao a curva de IMC por idade e sexo.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!chartModel) return null;

  return (
    <section className="growth-chart-section">
      <div className="growth-chart-header">
        <div>
          <span className="bmi-eyebrow">Curvas de Crescimento</span>
          <h3>{chartModel.title}</h3>
          <p>{chartModel.subtitle}</p>
        </div>
        <div className="growth-chart-summary">
          <span><strong>IMC:</strong> {anthropometryResult.bmiDisplay}</span>
          <span><strong>Percentil:</strong> {anthropometryResult.percentileDisplay || "-"}</span>
          <span><strong>Escore-z:</strong> {anthropometryResult.zScoreDisplay || "-"}</span>
        </div>
      </div>

      <div className="growth-chart-grid">
        <div className="growth-chart-card">
          <div className="growth-chart-card-head">
            <h4>Grafico Percentil</h4>
            <small>Curvas OMS/SBP em percentis para IMC por idade</small>
          </div>
          <div className="growth-chart-point-note">Ponto azul: avaliacao atual do aluno.</div>
          <div className="growth-chart-canvas">
            <Line data={{ datasets: chartModel.percentileChart.datasets }} options={chartOptions} />
          </div>
        </div>

        <div className="growth-chart-card">
          <div className="growth-chart-card-head">
            <h4>Grafico Escore-Z</h4>
            <small>Curvas OMS/SBP em escore-z para IMC por idade</small>
          </div>
          <div className="growth-chart-point-note">Ponto azul: avaliacao atual do aluno.</div>
          <div className="growth-chart-canvas">
            <Line data={{ datasets: chartModel.zScoreChart.datasets }} options={chartOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Table({ headers, rows, empty = "Nenhum registro encontrado." }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : (
            <tr><td colSpan={headers.length}><EmptyState text={empty} compact /></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text, compact = false }) {
  return <div className={`empty-box ${compact ? "compact-empty" : ""}`}>{text}</div>;
}

function Actions({ view, edit, remove, noView, extra }) {
  const extraLabel = typeof extra === "string" ? extra : extra?.label;
  const extraAction = typeof extra === "object" ? extra?.onClick : undefined;
  return (
    <div className="actions">
      {!noView && view && <button className="mini info" type="button" onClick={view}><Eye size={14} /> Ver</button>}
      {edit && <button className="mini warn" type="button" onClick={edit}><Edit size={14} /> Editar</button>}
      {remove && <button className="mini danger" type="button" onClick={remove}><Trash2 size={14} /> Excluir</button>}
      {extraLabel && <button className="mini secondary" type="button" onClick={extraAction}>{extraLabel}</button>}
    </div>
  );
}

function FormSection({ title, children }) {
  return <section className="form-section"><h2>{title}</h2><div className="form-grid">{children}</div></section>;
}

function Field({ label, name, type = "text", wide, defaultValue = "", required }) {
  return <label className={`field ${wide ? "wide" : ""}`}><span>{label}</span><input name={name} type={type} defaultValue={defaultValue || ""} required={required} /></label>;
}

function SelectField({ label, name, options, wide, compact, defaultValue = "", required, onChange, value, disabled }) {
  return (
    <label className={`field ${wide ? "wide" : ""} ${compact ? "compact" : ""}`}>
      <span>{label}</span>
      <select name={name} defaultValue={value === undefined ? defaultValue || "" : undefined} value={value} required={required} onChange={onChange} disabled={disabled}>
        {options.map((option) => {
          const value = Array.isArray(option) ? option[0] : option;
          const text = Array.isArray(option) ? option[1] : option;
          return <option key={`${name || label}-${value}`} value={value}>{text || "Selecione"}</option>;
        })}
      </select>
    </label>
  );
}

function MultiSelect({ label, name, options, wide, defaultValue = [] }) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <select name={name} multiple size="8" defaultValue={defaultValue}>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
  );
}

function SchoolAssignmentsField({ label, name, schools, selectedSchoolIds, onChange }) {
  const [pendingSchoolId, setPendingSchoolId] = useState("");
  const selectedSchools = selectedSchoolIds.map((schoolId) => findById(schools, schoolId)).filter(Boolean);
  const availableSchools = schools.filter((school) => !selectedSchoolIds.includes(school.id));

  const addSchool = () => {
    if (!pendingSchoolId) return;
    if (selectedSchoolIds.includes(pendingSchoolId)) {
      setPendingSchoolId("");
      return;
    }
    onChange([...selectedSchoolIds, pendingSchoolId]);
    setPendingSchoolId("");
  };

  const removeSchool = (schoolId) => {
    const school = findById(schools, schoolId);
    const confirmed = window.confirm(`Desvincular a escola "${formatSchoolLabel(school) || "Selecionada"}" deste nutricionista?`);
    if (!confirmed) return;
    onChange(selectedSchoolIds.filter((currentId) => String(currentId) !== String(schoolId)));
  };

  return (
    <div className="field wide">
      <span>{label}</span>
      <div className="school-assignments">
        <div className="school-assignment-add">
          <select value={pendingSchoolId} onChange={(event) => setPendingSchoolId(event.target.value)} disabled={!availableSchools.length}>
            <option value="">{availableSchools.length ? "Selecione uma escola para vincular" : "Todas as escolas ja estao vinculadas"}</option>
            {availableSchools.map((school) => <option key={school.id} value={school.id}>{formatSchoolLabel(school)}</option>)}
          </select>
          <button className="btn primary" type="button" onClick={addSchool} disabled={!pendingSchoolId}>
            <PlusCircle size={17} /> Vincular
          </button>
        </div>

        <div className="school-assignment-list">
          {selectedSchools.length ? selectedSchools.map((school) => (
            <div key={school.id} className="school-assignment-chip">
              <div>
                <strong>{formatSchoolLabel(school)}</strong>
                <small>Escola vinculada ao nutricionista</small>
              </div>
              <button className="mini danger" type="button" onClick={() => removeSchool(school.id)}>
                <Trash2 size={14} /> Desvincular
              </button>
              <input type="hidden" name={name} value={school.id} />
            </div>
          )) : <div className="school-assignment-empty">Nenhuma escola vinculada. Adicione uma escola para criar o vinculo.</div>}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return <div className="info-tile"><span>{label}</span><b>{value || "-"}</b></div>;
}

function NutriCard({ item, edit, remove }) {
  return (
    <article className="nutri-card">
      <h2>{item.name || "Nutricionista"}</h2>
      <p>{item.crn || "CRN nao informado"}</p>
      <p>{item.phone || "Telefone nao informado"}</p>
      <span>{(item.schoolIds || []).length} escolas vinculadas</span>
      <div className="actions card-actions">
        <button className="mini warn" type="button" onClick={edit}><Edit size={14} /> Editar</button>
        <button className="mini danger" type="button" onClick={remove}><Trash2 size={14} /> Excluir</button>
      </div>
    </article>
  );
}

function ColorChoices({ defaultValue }) {
  const colors = [["Amarelo queimado", "#5b3508"], ["Petroleo escuro", "#12363d"], ["Roxo escuro", "#2d163e"], ["Verde grafite", "#1c3b2c"], ["Bronze escuro", "#4a341d"], ["Vermelho escuro", "#4a1116"]];
  return <div className="colors wide">{colors.map(([name, color]) => <label key={name}><input name="sidebarColor" value={name} type="radio" defaultChecked={(defaultValue || "Amarelo queimado") === name} /><span style={{ background: color }} />{name}</label>)}</div>;
}

function EditorMock({ defaultValue }) {
  const tools = [Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Table2, LinkIcon, ImageIcon, Globe2];
  return <div className="editor wide"><div>{tools.map((Icon, index) => <button key={index} title="Editor" type="button"><Icon size={15} /></button>)}</div><textarea name="bannerHtml" defaultValue={defaultValue || "<p>Bem-vindo ao NUTRATIVA.</p>"} /></div>;
}

function CookieBar({ consentState, onAccept, onRejectOptional }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <aside className="cookie">
      <b>Cookies no sistema</b>
      <p>Usamos cookies essenciais para login e seguranca. Para liberar o acesso, precisamos da sua autorizacao para coletar a localizacao real deste login.</p>
      {showDetails && (
        <div className="cookie-details">
          <p>A localizacao e coletada somente no momento do login para registrar a origem do acesso. Sem essa coleta, o sistema nao libera a autenticacao.</p>
          <p>Se voce recusar apenas os cookies opcionais, o login continua bloqueado ate clicar em <b>Aceitar</b> e permitir a geolocalizacao do navegador.</p>
          {consentState.locationAccepted && consentState.location && (
            <small>
              Localizacao validada: latitude {consentState.location.latitude.toFixed(5)}, longitude {consentState.location.longitude.toFixed(5)}.
            </small>
          )}
        </div>
      )}
      <button className="btn info" type="button" onClick={() => setShowDetails((value) => !value)}>
        {showDetails ? "Ocultar detalhes" : "Saiba mais"}
      </button>
      <button className="btn outline" type="button" onClick={onRejectOptional}>Recusar opcionais</button>
      <button className="btn success" type="button" onClick={onAccept}>
        {consentState.locationAccepted ? "Atualizar localizacao" : "Aceitar"}
      </button>
    </aside>
  );
}

function buildStudentCsvTemplate(schools) {
  const header = "nome;cpf;data_nascimento;sexo;telefone;email;responsavel;escola_id;matricula;tipo_ensino;serie;turma;turno";
  const example = buildStudentCsvExample(schools, ";");
  return `${header}\n${example}`;
}

function buildStudentCsvExample(schools, delimiter = ", ") {
  const schoolId = schools[0]?.schoolCode || "INSIRA_O_ID_DA_ESCOLA";
  const values = [
    "Joao Silva",
    "12345678900",
    "2014-03-12",
    "Masculino",
    "(81)99999-9999",
    "joao@email.com",
    "Maria Silva",
    schoolId,
    "MAT-2026-001",
    "Ensino Fundamental I",
    "1o Ano",
    "A",
    "Manha",
  ];

  return values.join(delimiter);
}

function parseCsv(text) {
  const sanitized = String(text || "").replace(/^\uFEFF/, "").trim();
  if (!sanitized) return [];
  const lines = sanitized.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] || "";
      return acc;
    }, {});
  });
}

function detectCsvDelimiter(headerLine) {
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function splitCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === "\"") {
      if (insideQuotes && nextChar === "\"") {
        current += "\"";
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeCsvKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCsvValue(row, aliases) {
  const normalizedAliases = aliases.map(normalizeCsvKey);
  for (const [key, value] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeCsvKey(key))) {
      return String(value || "").trim();
    }
  }
  return "";
}

function normalizeStudentCsvRow(row, schools) {
  const name = getCsvValue(row, studentCsvAliases.name);
  if (!name) throw new Error("o campo nome e obrigatorio");

  const schoolText = getCsvValue(row, studentCsvAliases.school);
  const schoolIdText = getCsvValue(row, studentCsvAliases.schoolId);
  const schoolId = resolveSchoolId({ schoolIdText, schoolText }, schools);
  if (!schoolId) throw new Error("a escola e obrigatoria e precisa existir no cadastro");

  const educationTypeRaw = getCsvValue(row, studentCsvAliases.educationType);
  const educationType = canonicalEducationType(educationTypeRaw);
  if (!educationType) throw new Error("tipo de ensino invalido ou nao informado");

  const gradeRaw = getCsvValue(row, studentCsvAliases.grade);
  const grade = canonicalGrade(educationType, gradeRaw);
  if (!grade) throw new Error("serie invalida ou nao informada para o tipo de ensino");

  const shift = canonicalShift(getCsvValue(row, studentCsvAliases.shift));
  if (!shift) throw new Error("turno invalido ou nao informado");

  return {
    name,
    cpf: getCsvValue(row, studentCsvAliases.cpf),
    birthDate: normalizeDateValue(getCsvValue(row, studentCsvAliases.birthDate)),
    sex: canonicalSex(getCsvValue(row, studentCsvAliases.sex)),
    phone: getCsvValue(row, studentCsvAliases.phone),
    email: getCsvValue(row, studentCsvAliases.email),
    responsible: getCsvValue(row, studentCsvAliases.responsible),
    schoolId,
    registration: getCsvValue(row, studentCsvAliases.registration),
    shift,
    educationType,
    grade,
    classroom: getCsvValue(row, studentCsvAliases.classroom),
  };
}

function resolveSchoolId({ schoolIdText, schoolText }, schools) {
  if (schoolIdText) {
    const byId = schools.find((school) => String(school.schoolCode) === schoolIdText || String(school.id) === schoolIdText);
    if (byId) return byId.id;
  }

  if (schoolText) {
    const normalizedSchool = normalizeCsvKey(schoolText);
    const byName = schools.find((school) => normalizeCsvKey(school.name) === normalizedSchool);
    if (byName) return byName.id;
  }

  return "";
}

function canonicalEducationType(value) {
  const normalized = normalizeCsvKey(value);
  if (!normalized) return "";
  if (["educacao infantil", "infantil"].includes(normalized)) return "Educacao Infantil";
  if (["ensino fundamental i", "fundamental i", "fundamental 1"].includes(normalized)) return "Ensino Fundamental I";
  if (["ensino fundamental ii", "fundamental ii", "fundamental 2"].includes(normalized)) return "Ensino Fundamental II";
  if (["ensino medio", "medio"].includes(normalized)) return "Ensino Medio";
  if (normalized === "eja") return "EJA";
  return "";
}

function canonicalGrade(educationType, value) {
  const options = gradesByEducationType[educationType] || [];
  const normalized = normalizeGradeKey(value);

  return options.find((option) => normalizeGradeKey(option) === normalized) || "";
}

function normalizeGradeKey(value) {
  return normalizeCsvKey(value)
    .replace(/^(\d+)\s+ano$/, "$1o ano")
    .replace(/^nivel\s+(\d+)$/, "nivel $1")
    .replace(/^modulo\s+([ivxlcdm]+)$/i, (_match, roman) => `modulo ${roman.toUpperCase()}`.toLowerCase());
}

function canonicalShift(value) {
  const normalized = normalizeCsvKey(value);
  if (["manha", "manhã"].includes(normalized)) return "Manha";
  if (["tarde"].includes(normalized)) return "Tarde";
  if (["noite"].includes(normalized)) return "Noite";
  if (["integral"].includes(normalized)) return "Integral";
  return "";
}

function canonicalSex(value) {
  const normalized = normalizeCsvKey(value);
  if (["masculino", "m"].includes(normalized)) return "Masculino";
  if (["feminino", "f"].includes(normalized)) return "Feminino";
  if (["outro", "outros"].includes(normalized)) return "Outro";
  return "";
}

function normalizeDateValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return text;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function readForm(form) {
  const values = {};
  const formData = new FormData(form);
  for (const [key, value] of formData.entries()) {
    if (!key) continue;
    if (value instanceof File) continue;
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      values[key] = Array.isArray(values[key]) ? [...values[key], value] : [values[key], value];
    } else {
      values[key] = value;
    }
  }
  return values;
}

async function readSettingsForm(form, currentSettings = {}) {
  const values = readForm(form);
  const formData = new FormData(form);
  const imageFields = ["logo", "favicon", "loginBackground"];

  for (const field of imageFields) {
    const file = formData.get(field);
    if (!(file instanceof File) || !file.size) continue;
    if (!String(file.type || "").startsWith("image/")) continue;
    values[field] = await fileToDataUrl(file);
  }

  for (const field of imageFields) {
    if (!Object.prototype.hasOwnProperty.call(values, field) && currentSettings[field]) {
      values[field] = currentSettings[field];
    }
  }

  return values;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function findById(rows, id) {
  return rows.find((row) => String(row.id) === String(id));
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

function normalizeActiveUsersForMap(users) {
  return users
    .filter((item) => Number.isFinite(Number(item?.location?.latitude)) && Number.isFinite(Number(item?.location?.longitude)))
    .map((item) => ({
      ...item,
      location: {
        ...item.location,
        latitude: Number(item.location.latitude),
        longitude: Number(item.location.longitude),
      },
    }));
}

function formatSchoolLabel(school) {
  if (!school) return "";
  return school.schoolCode ? `${school.schoolCode} - ${school.name}` : school.name;
}

function truthy(value) {
  return value === true || value === "true" || value === "Sim" || value === "Ativo";
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}/${year}` : value;
}

function parseAppDate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfCurrentDay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isCampaignClosed(campaign, today = startOfCurrentDay()) {
  if (!campaign) return true;
  const status = normalizeCsvKey(campaign.status);
  if (status === "fechada" || status === "finalizada") return true;
  const endDate = parseAppDate(campaign.endDate);
  return !!(endDate && endDate < today);
}

function getCampaignLifecycleStatus(campaign, today = startOfCurrentDay()) {
  if (!campaign) return "Invalida";
  const startDate = parseAppDate(campaign.startDate);
  const endDate = parseAppDate(campaign.endDate);
  if (!startDate || !endDate) return "Invalida";
  if (isCampaignClosed(campaign, today)) return "Finalizada";
  if (startDate > today) return "Pendente";
  if (startDate <= today && endDate >= today) return "Ativa";
  return "Pendente";
}

function getCampaignStatusLabel(campaign) {
  const lifecycle = getCampaignLifecycleStatus(campaign);
  if (lifecycle === "Ativa") return "Ativa";
  if (lifecycle === "Pendente") return "Pendente";
  if (lifecycle === "Finalizada") return "Finalizada";
  return campaign?.status || "Invalida";
}

function getActiveCampaign(campaigns = [], today = startOfCurrentDay()) {
  return campaigns.find((campaign) => getCampaignLifecycleStatus(campaign, today) === "Ativa") || null;
}

function getBlockingCampaign(campaigns = [], nextCampaign) {
  return campaigns.find((campaign) => {
    if (nextCampaign?.id && String(campaign.id) === String(nextCampaign.id)) return false;
    return !isCampaignClosed(campaign);
  }) || null;
}

function getLatestCampaign(campaigns = []) {
  return [...campaigns]
    .sort((left, right) => (parseAppDate(right.endDate)?.getTime() || 0) - (parseAppDate(left.endDate)?.getTime() || 0))[0] || null;
}

function findCampaignForEvaluation(campaigns = [], evaluation) {
  if (!evaluation) return null;

  const byId = evaluation.campaignId ? findById(campaigns, evaluation.campaignId) : null;
  if (byId) return byId;

  const byName = campaigns.find((campaign) => String(campaign.name || "").trim() === String(evaluation.campaignName || "").trim()) || null;
  if (byName) return byName;

  const evaluatedAt = evaluation.evaluatedAt || evaluation.updatedAt || evaluation.createdAt || "";
  const evaluationDate = evaluatedAt ? new Date(evaluatedAt) : null;
  if (evaluationDate && !Number.isNaN(evaluationDate.getTime())) {
    const matchedByPeriod = campaigns.find((campaign) => {
      const startDate = parseAppDate(campaign.startDate);
      const endDate = parseAppDate(campaign.endDate);
      if (!startDate || !endDate) return false;
      const compareDate = new Date(evaluationDate);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate >= startDate && compareDate <= endDate;
    }) || null;

    if (matchedByPeriod) return matchedByPeriod;
  }

  return campaigns.length === 1 ? campaigns[0] : null;
}

function isEvaluationInCampaign(evaluation, campaign) {
  if (!evaluation || !campaign) return false;
  if (evaluation.campaignId && String(evaluation.campaignId) === String(campaign.id)) return true;
  if (evaluation.campaignName && String(evaluation.campaignName).trim() === String(campaign.name || "").trim()) return true;

  const campaignStartDate = parseAppDate(campaign.startDate);
  const campaignEndDate = parseAppDate(campaign.endDate);
  const evaluatedAt = evaluation.evaluatedAt || evaluation.updatedAt || evaluation.createdAt || "";
  const evaluationDate = evaluatedAt ? new Date(evaluatedAt) : null;

  if (!campaignStartDate || !campaignEndDate || !evaluationDate || Number.isNaN(evaluationDate.getTime())) return false;
  evaluationDate.setHours(0, 0, 0, 0);
  return evaluationDate >= campaignStartDate && evaluationDate <= campaignEndDate;
}

function getEvaluationsForCampaign(evaluations = [], campaign) {
  if (!campaign) return [];
  return evaluations.filter((evaluation) => isEvaluationInCampaign(evaluation, campaign));
}

function indexEvaluationsByStudent(evaluations = []) {
  return Object.fromEntries(evaluations.map((evaluation) => [evaluation.studentId, evaluation]));
}

function validateCampaignRecord(payload) {
  const name = String(payload?.name || "").trim();
  const startDate = parseAppDate(payload?.startDate);
  const endDate = parseAppDate(payload?.endDate);
  if (!name) return "Informe o nome da campanha.";
  if (!startDate) return "Informe a data de inicio da campanha.";
  if (!endDate) return "Informe a data de fim da campanha.";
  if (endDate < startDate) return "A data de fim da campanha nao pode ser anterior a data de inicio.";
  return "";
}

function formatNewsDate(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatHeaderDate(value) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(value);
  } catch {
    return "";
  }
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMonthYear(value) {
  if (!value) return "Sem data";
  try {
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatAge(value, referenceDate) {
  return calculateAgeOnDate(value, referenceDate)?.label || "-";
}

function hasContent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  const normalized = String(value).trim();
  if (!normalized) return false;
  return !["-", "Nao informado.", "Nao informado", "Sem observacoes adicionais.", "Nenhum medicamento informado."].includes(normalized);
}

function cloneEvaluationSections(source = evaluationSectionDefaults) {
  return JSON.parse(JSON.stringify(source));
}

function mergeEvaluationSections(source = {}) {
  const defaults = cloneEvaluationSections(evaluationSectionDefaults);
  return Object.fromEntries(Object.keys(defaults).map((sectionKey) => ([
    sectionKey,
    { ...defaults[sectionKey], ...(source?.[sectionKey] || {}) },
  ])));
}

function getNutritionistContext(data, currentUser) {
  const nutritionistLink = (data.nutritionists || []).find((item) => String(item.userId) === String(currentUser?.id)) || null;
  const linkedSchoolIds = nutritionistLink?.schoolIds || [];
  const linkedSchools = (data.schools || []).filter((school) => linkedSchoolIds.includes(school.id));
  const linkedStudents = (data.students || []).filter((student) => linkedSchoolIds.includes(student.schoolId));
  const myEvaluations = (data.evaluations || []).filter((evaluation) => String(evaluation.nutritionistUserId) === String(currentUser?.id));
  const evaluationByStudentId = Object.fromEntries(myEvaluations.map((evaluation) => [evaluation.studentId, evaluation]));

  return {
    nutritionistLink,
    linkedSchoolIds,
    linkedSchools,
    linkedStudents,
    myEvaluations,
    evaluationByStudentId,
  };
}

function createEvaluationDraft(existingEvaluation, student, currentUser, nutritionistLink, school, userRecord) {
  const sections = mergeEvaluationSections(existingEvaluation?.sections);
  return {
    id: existingEvaluation?.id,
    studentId: student?.id || "",
    studentName: existingEvaluation?.studentName || student?.name || "",
    schoolId: existingEvaluation?.schoolId || student?.schoolId || "",
    schoolName: existingEvaluation?.schoolName || school?.name || "",
    nutritionistUserId: existingEvaluation?.nutritionistUserId || currentUser?.id || "",
    nutritionistId: existingEvaluation?.nutritionistId || nutritionistLink?.id || "",
    nutritionistName: existingEvaluation?.nutritionistName || currentUser?.name || "",
    crn: existingEvaluation?.crn || nutritionistLink?.crn || userRecord?.crn || "",
    status: existingEvaluation?.status || "Finalizada",
    anthropometry: {
      weight: existingEvaluation?.anthropometry?.weight || "",
      height: existingEvaluation?.anthropometry?.height || "",
      waist: existingEvaluation?.anthropometry?.waist || "",
      bmi: existingEvaluation?.anthropometry?.bmi || "",
    },
    sections,
    createdAt: existingEvaluation?.createdAt || new Date().toISOString(),
    updatedAt: existingEvaluation?.updatedAt || new Date().toISOString(),
    evaluatedAt: existingEvaluation?.evaluatedAt || "",
  };
}

function getMenuForUser(currentUser) {
  if (currentUser?.profile === "Nutricionista") return nutritionistMenu;
  return adminMenu;
}

function buildEatingHabitsReport(section = {}) {
  const items = [];
  if (section.friedFoods) items.push("Come muitas frituras");
  if (section.skipMeals) items.push("Pula refeicoes");
  if (section.sweets) items.push("Consome muitos doces");
  if (section.lowWater) items.push("Bebe pouca agua");
  if (section.dailyFruit) items.push("Consome frutas diariamente");
  return items;
}

function buildAllergiesReport(section = {}) {
  const items = [];
  if (section.lactose) items.push("Lactose");
  if (section.gluten) items.push("Gluten");
  if (section.eggs) items.push("Ovos");
  if (section.peanuts) items.push("Amendoim");
  if (section.dyes) items.push("Corantes artificiais");
  return items;
}

function optionFor(field, data) {
  if (field === "Escola") return ["Todas as escolas", ...data.schools.map((school) => school.name)];
  if (field === "Sexo") return ["Todos", "Masculino", "Feminino"];
  if (field === "Zona") return ["Todas as zonas", ...uniqueValues((data.schools || []).map((school) => school.zone))];
  if (field === "Campanha") return ["Todas as campanhas", ...data.campaigns.map((campaign) => campaign.name)];
  if (field === "Tipo de Relatorio") return ["Simples", "Analitico"];
  if (field === "Turno") return ["Todos os turnos", "Manha", "Tarde", "Noite", "Integral"];
  if (field === "Estado") return ["Todos os estados", ...uniqueValues((data.schools || []).map((school) => school.state))];
  if (field === "Cidade") return ["Todas as cidades", ...uniqueValues((data.schools || []).map((school) => school.city))];
  if (field === "Municipio") return ["Todos os municipios", ...uniqueValues((data.schools || []).map((school) => school.district))];
  return [`Todas as opcoes de ${field}`];
}

function resolveRouteLabel(route) {
  if (route.startsWith("/escolas")) return "Gestao de Escolas";
  if (route.startsWith("/avaliacoes")) return "Avaliacoes Nutricionais";
  if (route.startsWith("/alunos")) return "Gestao de Alunos";
  if (route.startsWith("/usuarios")) return "Gestao de Usuarios";
  if (route.startsWith("/anos")) return "Anos Letivos";
  if (route.startsWith("/campanhas")) return "Campanhas";
  if (route.startsWith("/nutricionistas")) return "Vinculos e Equipe";
  if (route.startsWith("/relatorios/nutricionista")) return "Avaliacoes Nutricionais";
  if (route.startsWith("/relatorios/individual")) return "Relatorio Nutricional Individual";
  if (route.startsWith("/relatorios")) return "Central de Relatorios";
  if (route.startsWith("/configuracoes")) return "Configuracoes";
  if (route.startsWith("/profile")) return "Meu Perfil";
  return "Central de Operacoes";
}

createRoot(document.getElementById("root")).render(<App />);

