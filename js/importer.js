/* =====================================================================
   Importação da planilha "Jhow Cashback.xlsx" — roda 100% no navegador.
   Aba Cash: 2 linhas por cliente (linha 1 = dados e valores, linha 2 =
   datas das compras e profissão completa). Comentários da coluna R têm o
   histórico de resgates no formato "01- 04/06/24- 34,00".
   ===================================================================== */
(function () {
  const JR = window.JR, U = JR.u;
  const SHEETJS = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

  function loadLib() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((res, rej) => {
      const sc = document.createElement("script");
      sc.src = SHEETJS;
      sc.onload = () => res(window.XLSX);
      sc.onerror = () => rej(new Error("Não consegui carregar o leitor de planilhas. Verifique a internet e tente de novo."));
      document.head.appendChild(sc);
    });
  }

  const serialToISO = (n) => { if (typeof n !== "number" || n < 20000 || n > 80000) return null; const d = new Date(Math.round((n - 25569) * 86400000)); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0"); };
  const isNum = (v) => typeof v === "number" && isFinite(v);
  const str = (v) => (v == null ? "" : String(v)).trim();
  // lê a aba sempre a partir de A1 (a aba Camp, por exemplo, começa na coluna B)
  const rowsOf = (ws) => { const XL = window.XLSX; const ref = ws["!ref"]; if (!ref) return []; const e = XL.utils.decode_range(ref).e; return XL.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true, range: { s: { r: 0, c: 0 }, e } }); };
  // datas fora do período do programa (erro de digitação) são descartadas
  const okDate = (iso) => !!iso && iso >= "2023-01-01" && iso <= U.today();

  const AREA_MAP = [
    [/^educa|^profe|^pedag/, "Educação"], [/^empreend|^autonom/, "Empreendedor(a)"], [/^belez|^manicur|^cabel|^esteti/, "Beleza"], [/^direit|^advog/, "Direito"],
    [/^enferm|^saud|^biomed|^veterin|^fisiot|^odonto|^nutri|^medic|^farm|^cuidad|^massot/, "Saúde"], [/^atend|^serv pub|^public/, "Serviço público"],
    [/^comerc|^vend/, "Comércio & vendas"], [/^prest/, "Outro"], [/^admin|^rec hum|^rh/, "Administração"], [/^opera/, "Operação"], [/^engen|^arquit/, "Engenharia"],
    [/^gastr|^cozin|^confeit/, "Gastronomia"], [/^motor|^logist/, "Logística & transporte"], [/^tecnol|^ti$|^program|^desenv/, "Tecnologia"], [/^finan|^contab/, "Contabilidade & finanças"],
    [/^psico/, "Psicologia"], [/^segur/, "Segurança"], [/^tecnic/, "Técnico(a)"], [/^digit/, "Digital"], [/^gest/, "Gestão"], [/^music/, "Música"], [/^industr/, "Indústria"],
    [/^comunic|^jornal|^publi/, "Comunicação"], [/^art|^acump|^ioga|^yoga/, "Arte & bem-estar"], [/^estud/, "Estudante"], [/^outr/, "Outro"],
  ];
  const areaOf = (abbr) => { const n = U.norm(abbr); if (!n) return ""; for (const [re, a] of AREA_MAP) if (re.test(n)) return a; return U.titleCase(abbr); };

  function cellComment(ws, r, c) { const cell = ws[window.XLSX.utils.encode_cell({ r, c })]; if (!cell || !cell.c) return ""; return cell.c.map((x) => x.t || "").join("\n").trim(); }

  function parseRedeemLog(text) {
    const out = [];
    const re = /(\d{1,3})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*-\s*([\d.]*\d,\d{1,2}|\d+)/g;
    let m;
    while ((m = re.exec(text))) {
      let y = +m[4]; if (y < 100) y += 2000;
      const iso = y + "-" + String(+m[3]).padStart(2, "0") + "-" + String(+m[2]).padStart(2, "0");
      const ok = +m[3] >= 1 && +m[3] <= 12 && +m[2] >= 1 && +m[2] <= 31 && okDate(iso);
      out.push({ date: ok ? iso : null, value: U.parseMoney(m[5]) });
    }
    return out;
  }

  function parseCash(ws, rate) {
    const XL = window.XLSX;
    const rows = rowsOf(ws);
    const customers = [], visits = [];
    const warn = [];
    let badDates = 0;
    let i = 1;
    while (i < rows.length) {
      const a = rows[i] || [];
      const name = str(a[4]);
      if (!name || isNum(a[4]) || /^prof/i.test(str(a[0]))) { i++; continue; }
      const b = rows[i + 1] || [];
      const rowIdx = i; // índice 0-based da linha principal
      const id = "x" + rowIdx.toString(36);
      // telefone: G = DDD + "9" (ex. 319), H = 9496-7099
      const g = str(a[6]).replace(/\D/g, ""), h = U.digits(a[7]);
      let phone = "";
      if (h) { const ddd = g.length >= 2 ? g.slice(0, 2) : ""; const nine = g.length === 3 && g[2] === "9" && h.length === 8 ? "9" : ""; phone = ddd + nine + h; }
      const d = +a[0], m = +a[1], y = +a[2];
      const birth = d >= 1 && d <= 31 && m >= 1 && m <= 12 ? { d, m, y: y > 1900 && y < 2030 ? y : null } : null;
      const notes = [str(a[8]), cellComment(ws, rowIdx, 8), cellComment(ws, rowIdx, 4), cellComment(ws, rowIdx + 1, 5)].filter(Boolean);
      const c = { id, name: U.titleCase(name), gender: /^f/i.test(str(a[5])) ? "f" : /^m/i.test(str(a[5])) ? "m" : "", birth, phone, profession: str(b[8]) || str(a[9]), area: areaOf(a[9] || b[8]), notes: [...new Set(notes)].join("\n"), createdAt: null, legacy: null };

      // compras: L..P (11..15) com data na linha de baixo; Q (16) = subtotal consolidado
      const myVisits = [];
      let slotBuys = 0, lastDate = null;
      for (let col = 11; col <= 16; col++) {
        const val = a[col];
        if (!isNum(val) || val <= 0) continue;
        let date = serialToISO(b[col]);
        if (date && !okDate(date)) { badDates++; date = null; }
        if (!date) date = lastDate || [11, 12, 13, 14, 15, 16].map((k) => serialToISO(b[k])).filter(okDate).sort()[0] || null;
        if (!date) { badDates++; date = "2023-10-08"; }
        myVisits.push({ id: id + "c" + col, cid: id, date, ts: col, amount: U.r2(val), redeem: 0, earn: U.r2(val * rate / 100), note: col === 16 ? "Subtotal consolidado da planilha" : "" });
        if (col < 16) slotBuys++;
        if (!lastDate || date > lastDate) lastDate = date;
      }
      const K = isNum(a[10]) ? a[10] : 0;
      const hasQ = isNum(a[16]) && a[16] > 0;
      let extra = Math.max(0, K - slotBuys - (hasQ ? 1 : 0));
      // o subtotal consolidado (Q) representa várias compras antigas: carrega a contagem nele
      const qv = myVisits.find((v) => v.ts === 16);
      if (qv && extra) { qv.count = 1 + extra; extra = 0; }

      // resgates: R = quantidade, S = total resgatado, T = consumo nas visitas de resgate
      const R = isNum(a[17]) ? a[17] : 0, S = isNum(a[18]) ? a[18] : 0, T = isNum(a[19]) ? a[19] : 0;
      if (S > 0) {
        const log = parseRedeemLog(cellComment(ws, rowIdx, 17));
        const logSum = U.sum(log, (x) => x.value);
        const fallback = lastDate || "2023-10-08";
        // consumo das visitas de resgate (T) é rateado pelo valor resgatado, como na planilha (X = T + U)
        const share = (val) => U.r2(S > 0 ? (T * val) / S : 0);
        if (log.length && logSum <= S + 0.5) {
          log.forEach((x, k) => myVisits.push({ id: id + "r" + k, cid: id, date: x.date || fallback, ts: 100 + k, amount: share(x.value), redeem: U.r2(x.value), earn: 0, note: "Resgate (planilha)" }));
          if (S - logSum > 0.5) myVisits.push({ id: id + "ra", cid: id, date: fallback, ts: 199, amount: share(S - logSum), redeem: U.r2(S - logSum), earn: 0, note: "Ajuste de resgates (planilha)" });
          extra += Math.max(0, R - log.length - (S - logSum > 0.5 ? 1 : 0));
        } else {
          const when = (log.length && log[log.length - 1].date) || fallback;
          myVisits.push({ id: id + "ra", cid: id, date: when, ts: 199, amount: U.r2(T), redeem: U.r2(S), earn: 0, count: Math.max(1, R), note: "Resgates acumulados (planilha)" });
        }
      } else if (R > 0) extra += R;
      if (extra) c.legacy = { extraVisits: extra };
      c.createdAt = myVisits.reduce((mn, v) => (!mn || v.date < mn ? v.date : mn), null) || U.today();
      customers.push(c); visits.push(...myVisits);
      i += 2;
    }
    if (badDates) warn.push(badDates + " datas inválidas ou no futuro foram trocadas pela data mais próxima do mesmo cliente");
    return { customers, visits, warn };
  }

  function parseBooks(ws) {
    const rows = rowsOf(ws);
    const books = []; let pending = [];
    const flush = (sec) => { pending.forEach((p) => { p.section = sec; books.push(p); }); pending = []; };
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const title = str(r[2]), author = str(r[3]);
      if (!title && author) { const sec = author.length === 1 ? "Literatura" : author.toUpperCase() === "ILUSTRADOS" ? "Infantil · Ilustrados" : author.toUpperCase() === "GIBIS" ? "Infantil · Gibis" : author; flush(sec); continue; }
      if (!title || title.toUpperCase() === "INFANTIL") continue;
      const holder = str(r[7]);
      const taken = serialToISO(r[8]);
      const b = { id: "b" + (books.length + pending.length + 1), code: 0, title, author, section: "", reads: isNum(r[4]) ? r[4] : 0, loan: null, history: [] };
      if (holder && taken) b.loan = { cid: null, name: U.titleCase(holder.replace(/\s*\d{1,2}\/\d{1,2}\s*$/, "").replace(/\d+/g, "")), date: taken, days: JR.settings().loanDays };
      pending.push(b);
    }
    flush("Novas chegadas");
    books.forEach((b, k) => { b.code = k + 1; b.id = "b" + (k + 1); });
    return books;
  }

  function parseCamp(ws) {
    const rows = rowsOf(ws);
    const social = [], ideas = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const iso = serialToISO(r[1]);
      const n = (v) => (isNum(v) ? v : null);
      if (iso) social.push({ ym: iso.slice(0, 7), g: n(r[2]), gNew: n(r[3]), c1: n(r[4]), c1New: n(r[5]), c2: n(r[7]), ig: n(r[11]), igNew: n(r[12]), igViews: n(r[13]), igInt: n(r[14]), igC: n(r[15]) });
      if (str(r[18])) ideas.push({ id: "i" + i, text: str(r[18]).charAt(0).toUpperCase() + str(r[18]).slice(1), col: "ideia", date: U.today() });
    }
    return { social, ideas };
  }

  /* retorna um resumo + o novo estado (sem aplicar) */
  JR.importXlsx = async function (file) {
    const XL = await loadLib();
    const buf = await file.arrayBuffer();
    const wb = XL.read(buf, { type: "array", cellDates: false, cellComments: true });
    const sheet = (name) => wb.Sheets[wb.SheetNames.find((n) => U.norm(n) === U.norm(name))];
    const cash = sheet("Cash");
    if (!cash) throw new Error('Não encontrei a aba "Cash" nesse arquivo. É a planilha Jhow Cashback?');
    const st = JR.emptyState();
    st.settings = JSON.parse(JSON.stringify(JR.settings()));
    const rate = st.settings.cashbackPct || 8;
    const c = parseCash(cash, rate);
    st.customers = c.customers; st.visits = c.visits;
    const lv = sheet("Livro"); if (lv) st.books = parseBooks(lv);
    const cp = sheet("Camp"); if (cp) { const x = parseCamp(cp); st.social = x.social; st.ideas = x.ideas; }
    st.monthly = JSON.parse(JSON.stringify(JR.state.demo ? {} : JR.state.monthly || {}));
    // vincula leitores da biblioteca a clientes com o mesmo nome
    const byName = new Map(st.customers.map((x) => [U.norm(x.name), x.id]));
    st.books.forEach((b) => { if (b.loan && b.loan.name) { const id = byName.get(U.norm(b.loan.name)); if (id) b.loan.cid = id; } });
    const summary = {
      customers: st.customers.length,
      visits: st.visits.filter((v) => !v.redeem).length,
      redeems: st.visits.filter((v) => v.redeem > 0).length,
      spend: U.sum(st.visits, (v) => v.amount),
      balance: U.sum(st.visits, (v) => (v.earn || 0) - (v.redeem || 0)),
      books: st.books.length,
      loans: st.books.filter((b) => b.loan).length,
      social: st.social.length,
      ideas: st.ideas.length,
      warn: c.warn.slice(0, 5),
    };
    return { state: st, summary };
  };
})();
