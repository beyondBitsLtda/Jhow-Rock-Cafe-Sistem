/* =====================================================================
   Jhow Rock Café — núcleo: utilitários, persistência e regras de negócio
   Regras herdadas da planilha "Jhow Cashback":
   - cashback = consumo ÷ 12,5 (8%) − resgatado
   - visita com resgate não gera cashback (padrão; configurável)
   - visitas totais = compras + visitas de resgate
   - consumo total = compras + contas das visitas de resgate
   ===================================================================== */
(function () {
  const JR = (window.JR = window.JR || {});

  /* ---------------------------------------------------------- utilitários */
  const pad = (n) => String(n).padStart(2, "0");
  const U = (JR.u = {
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    esc: (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    iso: (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()),
    today: () => U.iso(new Date()),
    toDate: (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d || 1); },
    addDays: (iso, n) => { const d = U.toDate(iso); d.setDate(d.getDate() + n); return U.iso(d); },
    addMonths: (ym, n) => { const [y, m] = ym.split("-").map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + "-" + pad(d.getMonth() + 1); },
    days: (a, b) => Math.round((U.toDate(b) - U.toDate(a)) / 86400000),
    ym: (iso) => iso.slice(0, 7),
    r2: (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100,
    money: (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    moneyShort: (n) => { n = Number(n) || 0; if (Math.abs(n) >= 1e6) return "R$ " + (n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mi"; if (Math.abs(n) >= 1e4) return "R$ " + (n / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil"; return U.money(n); },
    moneyAxis: (n) => { n = Number(n) || 0; return Math.abs(n) >= 1000 ? "R$ " + (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : "R$ " + Math.round(n); },
    num: (n, d = 0) => (Number(n) || 0).toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d }),
    pct: (n, d = 1) => (isFinite(n) ? (n * 100).toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d }) + "%" : "—"),
    parseMoney: (s) => { if (typeof s === "number") return s; s = String(s || "").replace(/[^\d,.-]/g, ""); if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = parseFloat(s); return isFinite(n) ? n : 0; },
    date: (iso) => { if (!iso) return "—"; const [y, m, d] = iso.split("-"); return d + "/" + m + "/" + y.slice(2); },
    dateLong: (iso) => U.toDate(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }),
    MONTHS: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    MONTHS_L: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
    ymLabel: (ym, long) => { const [y, m] = ym.split("-").map(Number); return (long ? U.MONTHS_L : U.MONTHS)[m - 1] + "/" + String(y).slice(2); },
    norm: (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(),
    digits: (s) => String(s || "").replace(/\D/g, ""),
    titleCase: (s) => {
      const low = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "em", "na", "no", "para", "com", "por", "um", "uma", "as", "os"]);
      return String(s || "").trim().replace(/\s+/g, " ").toLowerCase().split(" ")
        .map((w, i) => (i > 0 && low.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
    },
    firstName: (s) => U.titleCase(String(s || "").split(" ")[0]),
    initials: (s) => { const p = String(s || "?").trim().split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/i.test(w)); return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); },
    phoneFmt: (d) => { d = U.digits(d); if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`; if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return d || "—"; },
    wa: (phone, text) => { const d = U.digits(phone); return "https://wa.me/" + (d.length <= 11 ? "55" + d : d) + (text ? "?text=" + encodeURIComponent(text) : ""); },
    fill: (tpl, data) => String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => (data[k] != null ? data[k] : "")),
    age: (b, ref) => { if (!b || !b.y) return null; const t = ref ? U.toDate(ref) : new Date(); let a = t.getFullYear() - b.y; if (t.getMonth() + 1 < b.m || (t.getMonth() + 1 === b.m && t.getDate() < b.d)) a--; return a >= 0 && a < 120 ? a : null; },
    debounce: (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
    sum: (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0),
  });

  /* ---------------------------------------------------------- ícones (traço 24px) */
  const P = {
    coffee: '<path d="M4 9h13v4.5A5.5 5.5 0 0 1 11.5 19h-2A5.5 5.5 0 0 1 4 13.5z"/><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H16.5M8.5 2.5c-.9 1 .9 2 0 3.5M12.5 2.5c-.9 1 .9 2 0 3.5M3 22h15"/>',
    stage: '<path d="M4 20h16M6 20V9l6-5 6 5v11"/><circle cx="12" cy="13" r="3"/><path d="M12 10v.01"/>',
    amp: '<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="14" r="3.2"/><circle cx="16.5" cy="9" r=".8"/><circle cx="16.5" cy="13" r=".8"/><path d="M3 8.5h18"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 0 0 4v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1a2 2 0 0 1 0-4 2 2 0 0 1 0-4V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" transform="translate(0 -1)"/><path d="M15 6v12" stroke-dasharray="2 2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.6 3.3-5.5 6.5-5.5s5.8 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.5 3.5 5.2"/>',
    heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/><path d="M12.8 9.5l-2 3h2.6l-1.8 3"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    mega: '<path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M17 8.5a4.5 4.5 0 0 1 0 7M7 15l1.5 5"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 21H20M8 7h8"/>',
    knob: '<circle cx="12" cy="12" r="7"/><path d="M12 12l3.5-3.5"/><path d="M12 2v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 6.3l1.4-1.4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    wa: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9.2 8.6c.2-.4.6-.4.8 0l.6 1.4c.1.3 0 .5-.2.7l-.4.4c.6 1.2 1.6 2.2 2.8 2.8l.4-.4c.2-.2.4-.3.7-.2l1.4.6c.4.2.4.6 0 .8-.6.5-1.4.8-2.2.5-2.1-.8-3.7-2.4-4.5-4.5-.3-.8 0-1.6.6-2.1z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-5-3.5-5-1.5S10 8 12 8zM12 8c1.5-3 5-3.5 5-1.5S14 8 12 8z"/>',
    bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-1.9-.4-2.5-1.2M12 6.5V8M12 16v1.5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    guitar: '<path d="M19.5 4.5l-6.8 6.8"/><path d="M18 3l3 3-1.5 1.5-3-3z"/><path d="M11.2 12.8a3.2 3.2 0 0 0-4.5-.2c-.7.7-.6 1.5-1.4 2.2-.9.8-2.3.6-2.3 2.2 0 2.2 2.8 4.5 5 4.5 1.6 0 1.5-1.4 2.3-2.3.7-.8 1.5-.7 2.2-1.4a3.2 3.2 0 0 0-.2-4.5z"/><circle cx="8.5" cy="16" r="1"/>',
    skull: '<path d="M12 3C7.6 3 4.5 6 4.5 10c0 2.3 1 3.9 2.5 5v3h10v-3c1.5-1.1 2.5-2.7 2.5-5C19.5 6 16.4 3 12 3z"/><circle cx="9.2" cy="10.5" r="1.6"/><circle cx="14.8" cy="10.5" r="1.6"/><path d="M10 18v3M14 18v3M12 13.5l-.8 1.5h1.6z"/>',
  };
  JR.icon = (name, cls) => `<svg class="${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
  JR.PICK = "M50 4C79 4 96 15 96 35 96 61 67 91 50 96 33 91 4 61 4 35 4 15 21 4 50 4Z";
  JR.pick = (name, cls) => `<svg class="pick ${cls || ""}" viewBox="0 0 100 100" aria-hidden="true"><path d="${JR.PICK}"/><text x="50" y="56" text-anchor="middle">${U.esc(U.initials(name))}</text></svg>`;
  /* estrela-bússola do selo Jhow (16 pontas) */
  JR.compass = (cls) => {
    const pts = (n, r1, r2, rot) => { const a = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const t = (Math.PI / n) * i + rot; a.push((100 + r * Math.sin(t)).toFixed(1) + "," + (100 - r * Math.cos(t)).toFixed(1)); } return a.join(" "); };
    return `<svg class="${cls || ""}" viewBox="0 0 200 200" aria-hidden="true"><polygon points="${pts(8, 98, 30, Math.PI / 8)}" fill="none" stroke="#eae5df" stroke-width="1.5"/><polygon points="${pts(8, 98, 30, 0)}" fill="#eae5df"/><circle cx="100" cy="100" r="34" fill="#0b0a0a" stroke="#eae5df" stroke-width="2"/><circle cx="100" cy="100" r="26" fill="none" stroke="#eae5df" stroke-width="1" stroke-dasharray="3 3"/></svg>`;
  };

  /* ---------------------------------------------------------- persistência */
  const DB_NAME = "jhow-rock-cafe", STORE = "kv", KEY = "state";
  let idb = null;
  function openDB() {
    return new Promise((res) => {
      // se o navegador travar o banco (aba duplicada, modo privado), segue com localStorage
      const t = setTimeout(() => res(null), 2500);
      const done = (v) => { clearTimeout(t); res(v); };
      try {
        const rq = indexedDB.open(DB_NAME, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
        rq.onsuccess = () => done(rq.result);
        rq.onerror = () => done(null);
        rq.onblocked = () => done(null);
      } catch (e) { done(null); }
    });
  }
  async function readState() {
    idb = await openDB();
    if (idb) {
      try {
        const v = await new Promise((res, rej) => { const tx = idb.transaction(STORE, "readonly"); const rq = tx.objectStore(STORE).get(KEY); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
        if (v) return v;
      } catch (e) { /* segue para o fallback */ }
    }
    try { const s = localStorage.getItem(DB_NAME); if (s) return JSON.parse(s); } catch (e) { /* sem storage */ }
    return null;
  }
  JR.storageOk = true;
  async function writeState() {
    const snapshot = JR.state;
    if (idb) {
      try {
        await new Promise((res, rej) => { const tx = idb.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(snapshot, KEY); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
        JR.storageOk = true; return;
      } catch (e) { /* tenta localStorage */ }
    }
    try { localStorage.setItem(DB_NAME, JSON.stringify(snapshot)); JR.storageOk = true; } catch (e) { JR.storageOk = false; }
  }
  JR.save = U.debounce(writeState, 250);
  JR.saveNow = writeState;

  /* ---------------------------------------------------------- estado */
  JR.AREAS = ["Administração", "Arte & bem-estar", "Beleza", "Comércio & vendas", "Comunicação", "Contabilidade & finanças", "Digital", "Direito", "Educação", "Empreendedor(a)", "Engenharia", "Estudante", "Gastronomia", "Gestão", "Indústria", "Logística & transporte", "Música", "Operação", "Psicologia", "Saúde", "Segurança", "Serviço público", "Tecnologia", "Técnico(a)", "Outro"];

  JR.defaultSettings = () => ({
    cashbackPct: 8,
    redeemEarns: "none", // none = visita com resgate não gera cashback (regra da planilha) | net = gera sobre o valor pago
    minRedeem: 0,
    status: { ativo: 90, morno: 180, afastado: 270 },
    loanDays: 30,
    competitors: ["Slow", "Granul"],
    owner: "Jhow",
    tpl: {
      venda: "Fala, {nome}! Valeu pela visita no Jhow Rock Café 🤘 Você ganhou {ganho} de cashback e seu saldo agora é {saldo}. Volta logo!",
      niver: "Feliz aniversário, {nome}! 🎸 A galera do Jhow Rock Café preparou um presente pra você no mês do seu niver. Passa aqui pra comemorar com a gente — e você ainda tem {saldo} de cashback.",
      bis: "E aí, {nome}! O palco do Jhow Rock Café sente sua falta 🤘 Você tem {saldo} de cashback esperando. Que tal um bis essa semana?",
      saldo: "Oi, {nome}! Lembrete do Jhow Rock Café: você tem {saldo} de cashback pra usar na próxima visita ☕🎸",
      lenda: "{nome}, você é lenda no Jhow Rock Café! Obrigado por fazer parte da banda 🤘",
    },
  });

  JR.emptyState = () => ({
    v: 1,
    demo: false,
    createdAt: U.today(),
    settings: JR.defaultSettings(),
    customers: [],
    visits: [],
    monthly: {},
    social: [],
    ideas: [],
    books: [],
    contacts: [],
  });

  JR.load = async function () {
    let s = await readState();
    if (!s || !s.customers) { s = JR.seedDemo(); JR.state = s; await writeState(); }
    JR.state = s;
    // garante campos novos em estados antigos
    const d = JR.defaultSettings();
    s.settings = Object.assign(d, s.settings || {});
    s.settings.tpl = Object.assign(JR.defaultSettings().tpl, s.settings.tpl || {});
    s.settings.status = Object.assign(JR.defaultSettings().status, s.settings.status || {});
    ["monthly"].forEach((k) => (s[k] = s[k] || {}));
    ["social", "ideas", "books", "contacts", "visits", "customers"].forEach((k) => (s[k] = s[k] || []));
    JR.reindex();
  };

  JR.replaceState = async function (s) { JR.state = s; JR.reindex(); await writeState(); };

  /* ---------------------------------------------------------- índices e métricas por cliente */
  JR.reindex = function () {
    const s = JR.state;
    JR.byId = new Map(s.customers.map((c) => [c.id, c]));
    JR.vByC = new Map();
    s.visits.sort((a, b) => (a.date === b.date ? (a.ts || 0) - (b.ts || 0) : a.date < b.date ? -1 : 1));
    for (const v of s.visits) { let a = JR.vByC.get(v.cid); if (!a) JR.vByC.set(v.cid, (a = [])); a.push(v); }
    JR.stats = new Map();
    for (const c of s.customers) JR.stats.set(c.id, JR.calc(c));
  };
  JR.touch = function (cid) { const c = JR.byId.get(cid); if (c) JR.stats.set(cid, JR.calc(c)); };

  JR.calc = function (c, refDate) {
    const vs = JR.vByC.get(c.id) || [];
    const today = refDate || U.today();
    let buys = 0, redeemVisits = 0, spendBuy = 0, spendRedeem = 0, earned = 0, redeemed = 0, first = null, last = null, lastRedeem = null;
    for (const v of vs) {
      if (refDate && v.date > refDate) continue;
      const n = v.count || 1; // lançamentos consolidados da planilha valem por várias visitas
      if (v.redeem > 0) { redeemVisits += n; spendRedeem += v.amount; redeemed += v.redeem; lastRedeem = v.date; } else { buys += n; spendBuy += v.amount; }
      earned += v.earn || 0;
      if (!first || v.date < first) first = v.date;
      if (!last || v.date > last) last = v.date;
    }
    const extra = (c.legacy && c.legacy.extraVisits) || 0;
    const visits = buys + redeemVisits + extra;
    const spend = spendBuy + spendRedeem;
    const since = last ? U.days(last, today) : null;
    const st = JR.settings();
    let status = "novo";
    if (since == null) status = "novo";
    else if (since <= st.status.ativo) status = "ativo";
    else if (since <= st.status.morno) status = "morno";
    else if (since <= st.status.afastado) status = "afastado";
    else status = "sumido";
    return {
      visits, buys: buys + extra, redeemVisits, spend: U.r2(spend), spendBuy: U.r2(spendBuy), earned: U.r2(earned), redeemed: U.r2(redeemed),
      balance: U.r2(earned - redeemed), first: first || c.createdAt, last, since, status, tier: JR.tier(visits),
      ticket: visits ? spend / Math.max(1, buys + redeemVisits) : 0, lastRedeem,
    };
  };
  JR.settings = () => (JR.state && JR.state.settings) || JR.defaultSettings();
  JR.tier = (n) => (n >= 6 ? "lenda" : n >= 4 ? "fa" : n >= 2 ? "groupie" : "estreante");
  JR.TIERS = { estreante: { label: "Estreante", hint: "1 visita", next: 2 }, groupie: { label: "Groupie", hint: "2–3 visitas", next: 4 }, fa: { label: "Fã", hint: "4–5 visitas", next: 6 }, lenda: { label: "Lenda", hint: "6+ visitas", next: null } };
  JR.STATUS = {
    ativo: { label: "Ativo", cls: "ok", hint: "No palco — veio nos últimos {d} dias" },
    morno: { label: "Morno", cls: "warn", hint: "No camarim — sem vir há mais de {d} dias" },
    afastado: { label: "Afastado", cls: "bad", hint: "Na estrada — sem vir há mais de {d} dias" },
    sumido: { label: "Sumido", cls: "off", hint: "Saiu da turnê — sem vir há mais de {d} dias" },
    novo: { label: "Sem visita", cls: "line", hint: "Cadastrado, ainda sem compra" },
  };
  JR.statusPill = (st) => { const s = JR.STATUS[st] || JR.STATUS.novo; const set = JR.settings().status; const d = st === "ativo" ? set.ativo : st === "morno" ? set.ativo : st === "afastado" ? set.morno : set.afastado; return `<span class="pill ${s.cls}" data-tip="${U.esc(U.fill(s.hint.replace("{d}", d), {}))}">${s.label}</span>`; };
  JR.tierBadge = (t) => `<span class="tier ${t}" data-tip="${JR.TIERS[t].hint}">${t === "lenda" ? JR.icon("star") : ""}${JR.TIERS[t].label}</span>`;

  /* ---------------------------------------------------------- operações: clientes */
  JR.addCustomer = function (data) {
    const c = Object.assign({ id: U.uid(), name: "", phone: "", gender: "", birth: null, profession: "", area: "", notes: "", createdAt: U.today(), legacy: null }, data);
    c.name = U.titleCase(c.name);
    c.phone = U.digits(c.phone);
    JR.state.customers.push(c);
    JR.byId.set(c.id, c);
    JR.stats.set(c.id, JR.calc(c));
    JR.save();
    return c;
  };
  JR.updateCustomer = function (id, patch) {
    const c = JR.byId.get(id); if (!c) return;
    Object.assign(c, patch);
    if (patch.name != null) c.name = U.titleCase(c.name);
    if (patch.phone != null) c.phone = U.digits(c.phone);
    JR.touch(id); JR.save();
    return c;
  };
  JR.deleteCustomer = function (id) {
    const s = JR.state;
    s.customers = s.customers.filter((c) => c.id !== id);
    s.visits = s.visits.filter((v) => v.cid !== id);
    s.contacts = s.contacts.filter((x) => x.cid !== id);
    s.books.forEach((b) => { if (b.loan && b.loan.cid === id) { b.loan.cid = null; } });
    JR.reindex(); JR.save();
  };
  JR.findDupPhone = (phone, exceptId) => { const d = U.digits(phone); if (d.length < 8) return null; return JR.state.customers.find((c) => c.id !== exceptId && c.phone && c.phone.slice(-8) === d.slice(-8)) || null; };

  /* ---------------------------------------------------------- operações: vendas e resgates */
  JR.preview = function (cid, amount, redeem) {
    const st = JR.settings();
    const s = JR.stats.get(cid) || { balance: 0 };
    amount = U.r2(amount || 0); redeem = U.r2(redeem || 0);
    const base = redeem > 0 ? (st.redeemEarns === "net" ? amount - redeem : 0) : amount;
    const earn = U.r2(Math.max(0, base) * st.cashbackPct / 100);
    const errors = [];
    if (!(amount > 0)) errors.push("Informe o valor da conta.");
    if (redeem > 0) {
      if (redeem > s.balance + 0.001) errors.push("O resgate passa do saldo disponível (" + U.money(s.balance) + ").");
      if (redeem > amount + 0.001) errors.push("O resgate não pode ser maior que a conta.");
      if (st.minRedeem > 0 && redeem < st.minRedeem) errors.push("Resgate mínimo é " + U.money(st.minRedeem) + ".");
    }
    return { amount, redeem, earn, pay: U.r2(amount - redeem), newBalance: U.r2(s.balance - redeem + earn), errors };
  };
  JR.registerVisit = function ({ cid, amount, redeem, date, note }) {
    const p = JR.preview(cid, amount, redeem);
    if (p.errors.length) throw new Error(p.errors[0]);
    const v = { id: U.uid(), cid, date: date || U.today(), ts: Date.now(), amount: p.amount, redeem: p.redeem, earn: p.earn, note: note || "" };
    JR.state.visits.push(v);
    let a = JR.vByC.get(cid); if (!a) JR.vByC.set(cid, (a = [])); a.push(v); a.sort((x, y) => (x.date === y.date ? (x.ts || 0) - (y.ts || 0) : x.date < y.date ? -1 : 1));
    JR.touch(cid); JR.save();
    return v;
  };
  JR.deleteVisit = function (id) {
    const s = JR.state; const v = s.visits.find((x) => x.id === id); if (!v) return null;
    s.visits = s.visits.filter((x) => x.id !== id);
    const a = JR.vByC.get(v.cid); if (a) JR.vByC.set(v.cid, a.filter((x) => x.id !== id));
    JR.touch(v.cid); JR.save();
    return v;
  };
  JR.restoreVisit = function (v) { JR.state.visits.push(v); const a = JR.vByC.get(v.cid) || []; a.push(v); a.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : (x.ts || 0) - (y.ts || 0))); JR.vByC.set(v.cid, a); JR.touch(v.cid); JR.save(); };

  /* ---------------------------------------------------------- contatos (CRM) */
  JR.logContact = (cid, kind) => { JR.state.contacts.push({ id: U.uid(), cid, kind, date: U.today() }); JR.save(); };
  JR.lastContact = (cid, kind) => { let r = null; for (const x of JR.state.contacts) if (x.cid === cid && (!kind || x.kind === kind) && (!r || x.date > r.date)) r = x; return r; };
  JR.msg = (kind, c, extra) => { const s = JR.stats.get(c.id) || {}; return U.fill(JR.settings().tpl[kind], Object.assign({ nome: U.firstName(c.name), saldo: U.money(s.balance || 0), idade: U.age(c.birth) || "" }, extra || {})); };

  /* ---------------------------------------------------------- aniversários */
  JR.birthdays = function (range) {
    const t = new Date(); const out = [];
    const todayISO = U.today();
    for (const c of JR.state.customers) {
      if (!c.birth || !c.birth.d || !c.birth.m) continue;
      let next = new Date(t.getFullYear(), c.birth.m - 1, c.birth.d);
      if (U.iso(next) < todayISO) next = new Date(t.getFullYear() + 1, c.birth.m - 1, c.birth.d);
      const inDays = U.days(todayISO, U.iso(next));
      let ok = false;
      if (range === "hoje") ok = inDays === 0;
      else if (range === "semana") ok = inDays <= 6;
      else if (range === "mes") ok = c.birth.m === t.getMonth() + 1;
      if (ok) out.push({ c, inDays, day: c.birth.d, turning: c.birth.y ? next.getFullYear() - c.birth.y : null });
    }
    return out.sort((a, b) => (range === "mes" ? a.day - b.day : a.inDays - b.inDays));
  };

  /* ---------------------------------------------------------- biblioteca */
  JR.bookStatus = (b) => { if (!b.loan) return "livre"; const due = U.addDays(b.loan.date, b.loan.days || JR.settings().loanDays); return U.today() > due ? "atrasado" : "emprestado"; };
  JR.lendBook = (id, loan) => { const b = JR.state.books.find((x) => x.id === id); if (!b) return; b.loan = Object.assign({ date: U.today(), days: JR.settings().loanDays }, loan); JR.save(); };
  JR.returnBook = (id) => { const b = JR.state.books.find((x) => x.id === id); if (!b || !b.loan) return; b.history = b.history || []; b.history.push(Object.assign({}, b.loan, { back: U.today() })); b.reads = (b.reads || 0) + 1; b.loan = null; JR.save(); return b; };
  JR.loanName = (loan) => { if (!loan) return ""; const c = loan.cid && JR.byId.get(loan.cid); return c ? c.name : loan.name || "—"; };

  /* ---------------------------------------------------------- métricas de período (aba Mkt) */
  JR.periodMetrics = function (from, to) {
    const s = JR.state;
    const vs = s.visits.filter((v) => v.date >= from && v.date <= to);
    const leads = s.customers.filter((c) => { const st = JR.stats.get(c.id); const f = c.createdAt || (st && st.first); return f >= from && f <= to; });
    const buyers = new Set(vs.map((v) => v.cid));
    const valor = U.sum(vs, (v) => v.amount);
    const nVisits = U.sum(vs, (v) => v.count || 1);
    const red = vs.filter((v) => v.redeem > 0);
    const freq = { "1x": 0, "2x": 0, "3x": 0, "4–5x": 0, "6x+": 0 };
    for (const cid of buyers) { const n = (JR.stats.get(cid) || {}).visits || 0; if (n <= 1) freq["1x"]++; else if (n === 2) freq["2x"]++; else if (n === 3) freq["3x"]++; else if (n <= 5) freq["4–5x"]++; else freq["6x+"]++; }
    const ages = { "até 17": 0, "18–24": 0, "25–34": 0, "35–44": 0, "45–54": 0, "55+": 0, "s/ info": 0 };
    const gender = { f: 0, m: 0, o: 0 };
    for (const c of leads) {
      const a = U.age(c.birth, to);
      if (a == null) ages["s/ info"]++; else if (a <= 17) ages["até 17"]++; else if (a <= 24) ages["18–24"]++; else if (a <= 34) ages["25–34"]++; else if (a <= 44) ages["35–44"]++; else if (a <= 54) ages["45–54"]++; else ages["55+"]++;
      gender[c.gender === "f" ? "f" : c.gender === "m" ? "m" : "o"]++;
    }
    const months = []; let m = U.ym(from); while (m <= U.ym(to)) { months.push(m); m = U.addMonths(m, 1); }
    const manual = months.reduce((acc, k) => { const x = s.monthly[k] || {}; acc.faturamento += +x.faturamento || 0; acc.mktExt += +x.mktExt || 0; acc.alimInt += +x.alimInt || 0; acc.has = acc.has || !!(x.faturamento); return acc; }, { faturamento: 0, mktExt: 0, alimInt: 0, has: false });
    return {
      leads: leads.length, visits: nVisits, buyers: buyers.size, valor: U.r2(valor), ticket: nVisits ? valor / nVisits : 0,
      earned: U.r2(U.sum(vs, (v) => v.earn || 0)), redeems: red.length, redeemed: U.r2(U.sum(red, (v) => v.redeem)),
      freq, ages, gender, manual, months,
      returning: [...buyers].filter((cid) => (JR.stats.get(cid) || {}).visits > 1).length,
    };
  };
  JR.monthSeries = function (n, endYm) {
    const end = endYm || U.ym(U.today());
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push({ ym: U.addMonths(end, -i), leads: 0, valor: 0, visits: 0, redeemed: 0, earned: 0, redeems: 0 });
    const idx = new Map(out.map((o, i) => [o.ym, i]));
    for (const v of JR.state.visits) { const i = idx.get(v.date.slice(0, 7)); if (i == null) continue; const o = out[i]; o.valor += v.amount; o.visits += v.count || 1; o.earned += v.earn || 0; if (v.redeem > 0) { o.redeems++; o.redeemed += v.redeem; } }
    for (const c of JR.state.customers) { const i = idx.get((c.createdAt || "").slice(0, 7)); if (i != null) out[i].leads++; }
    return out;
  };
  JR.baseSnapshot = function () {
    const status = { ativo: 0, morno: 0, afastado: 0, sumido: 0, novo: 0 };
    const tiers = { estreante: 0, groupie: 0, fa: 0, lenda: 0 };
    let balance = 0, withBal = 0;
    const areas = {};
    for (const c of JR.state.customers) {
      const s = JR.stats.get(c.id); status[s.status]++; if (s.visits) tiers[s.tier]++;
      if (s.balance > 0) { balance += s.balance; withBal++; }
      const a = c.area || "Não informado"; areas[a] = (areas[a] || 0) + 1;
    }
    return { status, tiers, balance: U.r2(balance), withBal, areas, total: JR.state.customers.length };
  };
})();
