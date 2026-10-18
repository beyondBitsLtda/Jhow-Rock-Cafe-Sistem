/* =====================================================================
   Telas de gestão: Fã-clube (CRM), Números (Mkt), Campanhas (Camp),
   Biblioteca (Livro), Ajustes
   ===================================================================== */
(function () {
  const JR = window.JR, U = JR.u, I = JR.icon;

  /* ================================================================ FÃ-CLUBE */
  const fz = { tab: "niver", niver: "semana", bis: "todos" };
  JR.views.fas = {
    title: "Fã-clube", sub: "relacionamento e WhatsApp",
    render(el, params) {
      if (params && params[0]) fz.tab = params[0];
      const TABS = [["niver", "Aniversariantes", "gift"], ["bis", "Pedindo bis", "undo"], ["saldo", "Saldo parado", "bolt"], ["lendas", "Lendas da casa", "star"]];
      const recent = (cid, kind) => { const x = JR.lastContact(cid, kind); return x && U.days(x.date, U.today()) <= 30 ? x : null; };
      let rows = [], intro = "", kind = fz.tab, sub = "";
      if (fz.tab === "niver") {
        sub = `<div class="seg">${[["hoje", "Hoje"], ["semana", "7 dias"], ["mes", "Mês inteiro"]].map(([k, l]) => `<button class="${fz.niver === k ? "on" : ""}" data-niver="${k}">${l}</button>`).join("")}</div>`;
        rows = JR.birthdays(fz.niver).map((b) => ({ c: b.c, ctx: `${String(b.day).padStart(2, "0")}/${String(b.c.birth.m).padStart(2, "0")}${b.turning ? " · faz " + b.turning + " anos" : ""}${b.inDays === 0 ? ' · <span class="pill bad">Hoje!</span>' : ""}` }));
        intro = "Mande parabéns e lembre do voucher do mês do aniversário. Quem já recebeu nos últimos 30 dias aparece marcado.";
      } else if (fz.tab === "bis") {
        sub = `<div class="seg">${[["todos", "Todos"], ["morno", "Mornos"], ["afastado", "Afastados"], ["sumido", "Sumidos"]].map(([k, l]) => `<button class="${fz.bis === k ? "on" : ""}" data-bis="${k}">${l}</button>`).join("")}</div>`;
        rows = JR.state.customers.map((c) => [c, JR.stats.get(c.id)]).filter(([, s]) => ["morno", "afastado", "sumido"].includes(s.status) && (fz.bis === "todos" || s.status === fz.bis) && s.balance >= 1).sort((a, b) => b[1].balance - a[1].balance).map(([c, s]) => ({ c, ctx: `${JR.statusPill(s.status)} sem vir há ${s.since} dias` }));
        intro = "Clientes esfriando que ainda têm cashback. O saldo é a melhor desculpa para chamar de volta.";
      } else if (fz.tab === "saldo") {
        rows = JR.state.customers.map((c) => [c, JR.stats.get(c.id)]).filter(([, s]) => s.status === "ativo" && s.balance >= 15).sort((a, b) => b[1].balance - a[1].balance).map(([c, s]) => ({ c, ctx: `${s.lastRedeem ? "último resgate " + U.date(s.lastRedeem) : "nunca resgatou"}` }));
        intro = "Clientes ativos com R$ 15 ou mais acumulados. Lembrar do saldo traz a pessoa de volta mais rápido.";
      } else {
        rows = JR.state.customers.map((c) => [c, JR.stats.get(c.id)]).filter(([, s]) => s.tier === "lenda").sort((a, b) => b[1].spend - a[1].spend).slice(0, 40).map(([c, s], i) => ({ c, ctx: `#${i + 1} · ${U.money(s.spend)} em ${s.visits} visitas` }));
        intro = "Os 40 maiores fãs por consumo. Bons candidatos para divulgar a marca, testar novidades e o grupo de WhatsApp.";
      }
      const tplKey = { niver: "niver", bis: "bis", saldo: "saldo", lendas: "lenda" }[kind];
      const nHoje = JR.birthdays("hoje").length;
      const nBis = JR.state.customers.filter((c) => { const s = JR.stats.get(c.id); return ["morno", "afastado", "sumido"].includes(s.status) && s.balance >= 1; }).length;
      el.innerHTML = `
        ${JR.art.banner({ photo: "vinil.jpg", kicker: "Relacionamento", title: "Fã-clube", text: "Quem faz aniversário, quem está sumindo e quem merece um bis. Mensagem pronta no WhatsApp.", pos: "center 60%",
          aside: `<div class="bstat"><b>${nHoje}</b><span>niver hoje</span></div><div class="bstat"><b>${U.num(nBis)}</b><span>pedindo bis</span></div>` })}
        <div class="chips">${TABS.map(([k, l, ic]) => `<button class="chip ${fz.tab === k ? "on" : ""}" data-tab="${k}">${l}</button>`).join("")}</div>
        <div class="panel">
          <div class="panel-h"><h2>${TABS.find((t) => t[0] === fz.tab)[1]} <span class="tag">${rows.length}</span></h2>${sub}<div class="right">${rows.length ? `<button class="btn sm" data-act="copyall">${I("copy")}Copiar telefones</button>` : ""}</div></div>
          <p class="muted small" style="margin-bottom:10px">${intro}</p>
          <details class="note" style="margin-bottom:12px"><summary style="cursor:pointer"><b>Mensagem usada</b> (edite em Ajustes)</summary><p class="mt">${U.esc(JR.settings().tpl[tplKey])}</p></details>
          ${rows.length ? `<div class="list">${rows.slice(0, 150).map((r) => { const s = JR.stats.get(r.c.id); const rc = recent(r.c.id, tplKey); return `<div class="li"><div style="cursor:pointer" data-act="open" data-id="${r.c.id}">${JR.pick(r.c.name, JR.STATUS[s.status].cls)}</div><div class="main-t" style="cursor:pointer" data-act="open" data-id="${r.c.id}"><div class="name">${U.esc(r.c.name)}</div><div class="meta">${r.ctx}${rc ? `<span class="pill line">${I("check")} enviado ${U.date(rc.date)}</span>` : ""}</div></div><div class="val num">${U.money(s.balance)}<small>saldo</small></div>${r.c.phone ? `<a class="btn wa sm" href="${U.wa(r.c.phone, JR.msg(tplKey, r.c))}" target="_blank" rel="noopener" data-act="wa" data-id="${r.c.id}">${I("wa")}<span>Enviar</span></a>` : `<span class="dim xs">sem telefone</span>`}</div>`; }).join("")}</div>${rows.length > 150 ? `<p class="dim xs mt">Mostrando 150 de ${rows.length}.</p>` : ""}`
            : JR.art.empty("vinyl", "Silêncio no palco", "Ninguém nessa lista agora.")}
        </div>`;
      el.onclick = (e) => {
        const t = e.target.closest("[data-tab]"); if (t) { fz.tab = t.dataset.tab; JR.setRoute("fas/" + fz.tab); JR.refresh(); return; }
        const n = e.target.closest("[data-niver]"); if (n) { fz.niver = n.dataset.niver; JR.refresh(); return; }
        const b = e.target.closest("[data-bis]"); if (b) { fz.bis = b.dataset.bis; JR.refresh(); return; }
        const a = e.target.closest("[data-act]"); if (!a) return;
        if (a.dataset.act === "open") JR.openCustomer(a.dataset.id);
        if (a.dataset.act === "wa") { JR.logContact(a.dataset.id, tplKey); setTimeout(() => JR.refresh(true), 400); }
        if (a.dataset.act === "copyall") JR.copy(rows.filter((r) => r.c.phone).map((r) => U.phoneFmt(r.c.phone)).join("\n"));
      };
    },
  };

  /* ================================================================ NÚMEROS (aba Mkt) */
  const nm = { mode: "mes", ref: U.ym(U.today()) };
  const periodOf = () => {
    const [y, m] = nm.ref.split("-").map(Number);
    const endOf = (ym) => { const [yy, mm] = ym.split("-").map(Number); return U.iso(new Date(yy, mm, 0)); };
    if (nm.mode === "mes") return { from: nm.ref + "-01", to: endOf(nm.ref), label: U.MONTHS_L[m - 1] + " de " + y };
    if (nm.mode === "tri") { const q = Math.floor((m - 1) / 3); const s = y + "-" + String(q * 3 + 1).padStart(2, "0"); return { from: s + "-01", to: endOf(U.addMonths(s, 2)), label: q + 1 + "º trimestre de " + y }; }
    if (nm.mode === "ano") return { from: y + "-01-01", to: y + "-12-31", label: String(y) };
    const first = JR.state.visits.length ? JR.state.visits[0].date : U.today();
    return { from: first, to: U.today(), label: "Desde " + U.date(first) };
  };
  JR.views.numeros = {
    title: "Números", sub: "indicadores do programa",
    render(el) {
      const p = periodOf();
      const to = p.to > U.today() ? U.today() : p.to;
      const m = JR.periodMetrics(p.from, to);
      const snap = JR.baseSnapshot();
      const endYm = nm.mode === "tudo" ? U.ym(U.today()) : U.ym(to);
      const series = JR.monthSeries(12, endYm);
      const man = nm.mode === "mes" ? JR.state.monthly[nm.ref] || {} : null;
      const fat = m.manual.faturamento;
      const custo = m.redeemed + m.manual.mktExt + m.manual.alimInt;
      const ages = Object.entries(m.ages).filter(([k]) => k !== "s/ info").map(([label, value]) => ({ label, value }));
      const areas = Object.entries(snap.areas).filter(([k]) => k !== "Não informado").sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
      const g = m.gender;

      // tabela mensal no espírito da aba Mkt: meses + subtotais por trimestre
      const tblMonths = JR.monthSeries(12, U.ym(U.today()));
      const fmtRow = (label, o, cls) => { const f = o.fat || 0; const vf = o.valorF != null ? o.valorF : o.valor; return `<tr class="${cls || ""}"><td>${label}</td><td>${U.num(o.leads)}</td><td>${U.num(o.visits)}</td><td>${U.money(o.valor)}</td><td>${o.visits ? U.money(o.valor / o.visits) : "—"}</td><td>${U.money(o.earned)}</td><td>${U.num(o.redeems)}</td><td>${U.money(o.redeemed)}</td><td>${f ? U.money(f) : "—"}</td><td>${f ? U.pct(vf / f) : "—"}</td></tr>`; };
      let rowsH = "", acc = null, tot = { leads: 0, visits: 0, valor: 0, earned: 0, redeems: 0, redeemed: 0, fat: 0, valorF: 0 };
      tblMonths.forEach((o, i) => {
        o.fat = +(JR.state.monthly[o.ym] || {}).faturamento || 0; o.valorF = o.fat ? o.valor : 0; // % só onde há faturamento lançado
        rowsH += fmtRow(U.ymLabel(o.ym), o);
        const mm = +o.ym.slice(5); const q = Math.floor((mm - 1) / 3) + 1;
        acc = acc || { leads: 0, visits: 0, valor: 0, earned: 0, redeems: 0, redeemed: 0, fat: 0, valorF: 0 };
        Object.keys(acc).forEach((k) => { acc[k] += o[k] || 0; tot[k] += o[k] || 0; });
        if (mm % 3 === 0 || i === tblMonths.length - 1) { rowsH += fmtRow(q + "ºT" + o.ym.slice(2, 4), acc, "sum"); acc = null; }
      });
      rowsH += fmtRow("12 meses", tot, "total");

      el.innerHTML = `
        ${JR.art.banner({ photo: "amp-knobs.jpg", kicker: "Mesa de som", title: "Números", text: "O que a planilha Mkt fazia à mão, agora no automático: leads, ticket, frequência e recência.", pos: "center 30%",
          aside: `<div class="bstat"><b>${U.moneyShort(m.valor)}</b><span>${U.esc(p.label)}</span></div><div class="bstat"><b>${U.num(m.leads)}</b><span>novos fãs</span></div>` })}
        <div class="row" style="justify-content:space-between;gap:12px">
          <div class="seg">${[["mes", "Mês"], ["tri", "Trimestre"], ["ano", "Ano"], ["tudo", "Tudo"]].map(([k, l]) => `<button class="${nm.mode === k ? "on" : ""}" data-mode="${k}">${l}</button>`).join("")}</div>
          <div class="row">${nm.mode !== "tudo" ? `<button class="icon-btn" data-nav="-1" aria-label="Período anterior">${I("back")}</button>` : ""}<h2 style="font-size:1.3rem;min-width:180px;text-align:center">${p.label}</h2>${nm.mode !== "tudo" ? `<button class="icon-btn" data-nav="1" aria-label="Próximo período" ${U.ym(p.to) >= U.ym(U.today()) ? "disabled" : ""}>${I("arrow")}</button>` : ""}</div>
        </div>
        <section class="grid g-4">
          <div class="tile hot"><div class="k">Novos cadastros</div><div class="v">${U.num(m.leads)}</div><div class="d">leads do período</div></div>
          <div class="tile"><div class="k">Consumo de clientes</div><div class="v">${U.moneyShort(m.valor)}</div><div class="d">${U.num(m.visits)} visitas de ${U.num(m.buyers)} clientes</div></div>
          <div class="tile"><div class="k">Ticket médio</div><div class="v">${U.money(m.ticket)}</div><div class="d">${U.pct(m.buyers ? m.returning / m.buyers : NaN, 0)} dos clientes do período já voltaram</div></div>
          <div class="tile"><div class="k">Cashback</div><div class="v">${U.money(m.earned)}</div><div class="d">gerado · ${U.num(m.redeems)} resgates somando ${U.money(m.redeemed)}</div></div>
        </section>

        <section class="grid g-main">
          <div class="panel">
            <div class="panel-h"><h2>Novos cadastros por mês</h2><span class="hint">12 meses até ${U.ymLabel(endYm)}</span></div>
            ${JR.vbars(series.map((s) => ({ label: U.ymLabel(s.ym), value: s.leads, tipLabel: U.ymLabel(s.ym, true) })), { fmt: (v) => U.num(v) })}
          </div>
          <div class="panel">
            <div class="panel-h"><h2>Faturamento da loja</h2><span class="hint">${nm.mode === "mes" ? "lançado à mão" : "soma dos meses"}</span></div>
            ${nm.mode === "mes" ? `<form id="man" class="stack" style="gap:10px">
              <div class="field"><label for="m-fat">Faturamento total do mês</label><input id="m-fat" class="input" inputmode="decimal" placeholder="0,00" value="${man.faturamento ? U.num(man.faturamento, 2) : ""}"></div>
              <div class="form-grid"><div class="field"><label for="m-mkt">Vouchers de niver</label><input id="m-mkt" class="input" inputmode="decimal" placeholder="0,00" value="${man.mktExt ? U.num(man.mktExt, 2) : ""}"><span class="help">marketing externo</span></div>
              <div class="field"><label for="m-alim">Alimentação interna</label><input id="m-alim" class="input" inputmode="decimal" placeholder="0,00" value="${man.alimInt ? U.num(man.alimInt, 2) : ""}"></div></div>
              <button class="btn red" type="submit">${I("check")}Salvar números do mês</button></form>` : `<div class="kv" style="grid-template-columns:1fr"><div><div class="k">Faturamento</div><div class="v">${fat ? U.money(fat) : "—"}</div></div><div><div class="k">Vouchers + alimentação interna</div><div class="v">${U.money(m.manual.mktExt + m.manual.alimInt)}</div></div></div>`}
            <hr class="divider" style="margin:14px 0">
            <div class="grid g-2" style="gap:10px">
              <div><div class="eyebrow">Vendas via cadastro</div><div style="font-family:var(--f-head);font-weight:800;font-size:1.6rem">${fat ? U.pct(m.valor / fat) : "—"}</div><div class="dim xs">consumo de clientes ÷ faturamento</div></div>
              <div><div class="eyebrow">Custo do programa</div><div style="font-family:var(--f-head);font-weight:800;font-size:1.6rem">${fat ? U.pct(custo / fat) : "—"}</div><div class="dim xs">resgates + vouchers + alim. ÷ faturamento</div></div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-h"><h2>Consumo de clientes por mês</h2><span class="hint">soma das contas lançadas no caixa</span></div>
          ${JR.vbars(series.map((s) => ({ label: U.ymLabel(s.ym), value: U.r2(s.valor), tipLabel: U.ymLabel(s.ym, true), tipExtra: U.num(s.visits) + " visitas" })), { fmt: (v, short) => (short ? U.moneyAxis(v) : U.money(v)), height: 200 })}
        </section>

        <section class="grid g-2">
          <div class="panel">
            <div class="panel-h"><h2>Frequência</h2><span class="hint">clientes que vieram no período, por total de visitas</span></div>
            ${JR.hbars(Object.entries(m.freq).map(([label, value]) => ({ label, value })), { total: m.buyers, red: (r) => r.label === "6x+" })}
          </div>
          <div class="panel">
            <div class="panel-h"><h2>Recência da base</h2><span class="hint">hoje · ${U.num(snap.total)} clientes</span></div>
            ${JR.stackbar([{ label: "Ativos", value: snap.status.ativo, color: "var(--ok)" }, { label: "Mornos", value: snap.status.morno, color: "var(--warn)" }, { label: "Afastados", value: snap.status.afastado, color: "var(--bad)" }, { label: "Sumidos", value: snap.status.sumido, color: "var(--off)" }])}
            <p class="dim xs mt">Ativo: até ${JR.settings().status.ativo} dias da última visita · Morno: até ${JR.settings().status.morno} · Afastado: até ${JR.settings().status.afastado} · Sumido: mais que isso.</p>
          </div>
        </section>

        <section class="grid g-3">
          <div class="panel">
            <div class="panel-h"><h2>Sexo</h2><span class="hint">novos do período</span></div>
            ${JR.stackbar([{ label: "Feminino", value: g.f, color: "var(--red)" }, { label: "Masculino", value: g.m, color: "var(--blue)" }, { label: "Não informado", value: g.o, color: "var(--off)" }])}
          </div>
          <div class="panel">
            <div class="panel-h"><h2>Faixa etária</h2><span class="hint">novos do período</span></div>
            ${JR.hbars(ages, { total: m.leads })}
          </div>
          <div class="panel">
            <div class="panel-h"><h2>Profissões</h2><span class="hint">top 10 da base</span></div>
            ${JR.hbars(areas, { total: snap.total })}
          </div>
        </section>

        <section class="panel">
          <div class="panel-h"><h2>Planilha do programa</h2><span class="hint">últimos 12 meses com subtotal por trimestre, como na aba Mkt</span></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mês</th><th>Leads</th><th>Visitas</th><th>Consumo</th><th>Ticket</th><th>Cashback</th><th>Resgates</th><th>R$ resgatado</th><th>Faturamento</th><th>% cadastro</th></tr></thead><tbody>${rowsH}</tbody></table></div>
        </section>`;

      el.onclick = (e) => {
        const md = e.target.closest("[data-mode]"); if (md) { nm.mode = md.dataset.mode; JR.refresh(); return; }
        const nv = e.target.closest("[data-nav]"); if (nv && !nv.disabled) { const step = nm.mode === "mes" ? 1 : nm.mode === "tri" ? 3 : 12; nm.ref = U.addMonths(nm.ref, step * +nv.dataset.nav); if (nm.ref > U.ym(U.today())) nm.ref = U.ym(U.today()); JR.refresh(); }
      };
      const form = el.querySelector("#man");
      if (form) form.onsubmit = (e) => {
        e.preventDefault();
        JR.state.monthly[nm.ref] = { faturamento: U.parseMoney(el.querySelector("#m-fat").value), mktExt: U.parseMoney(el.querySelector("#m-mkt").value), alimInt: U.parseMoney(el.querySelector("#m-alim").value) };
        JR.save(); JR.toast("Números de " + U.ymLabel(nm.ref, true) + " salvos."); JR.refresh(true);
      };
    },
  };

  /* ================================================================ CAMPANHAS (aba Camp) */
  const COLS = [["ideia", "Ideias"], ["ensaio", "Ensaiando"], ["palco", "No palco"]];
  JR.views.campanhas = {
    title: "Campanhas", sub: "redes, concorrência e ideias",
    render(el) {
      const st = JR.state; const comp = JR.settings().competitors;
      const soc = st.social.slice().sort((a, b) => a.ym.localeCompare(b.ym));
      const last = soc[soc.length - 1] || {};
      const lastWith = (k) => { for (let i = soc.length - 1; i >= 0; i--) if (soc[i][k] != null) return soc[i]; return null; };
      const gL = lastWith("g"), c1L = lastWith("c1"), c2L = lastWith("c2"), igL = lastWith("ig"), igCL = lastWith("igC");
      const n = (v) => (v == null ? "—" : U.num(v));
      const diff = (a, b) => (a == null || b == null ? "" : a - b >= 0 ? `<span style="color:var(--fg)">▲ ${U.num(a - b)} à frente</span>` : `<span class="muted">▼ faltam ${U.num(b - a)}</span>`);
      el.innerHTML = `
        ${JR.art.banner({ photo: "guitarra-v.jpg", kicker: "Divulgação", title: "Campanhas", text: "Google, Instagram e concorrência mês a mês, e as ideias da banda saindo do papel para o palco.", pos: "center 30%" })}
        <section class="grid g-4">
          <div class="tile hot"><div class="k">${I("star")}Avaliações Google</div><div class="v">${n(gL && gL.g)}</div><div class="d">${gL && gL.gNew != null ? "+" + U.num(gL.gNew) + " no mês · " : ""}${U.esc(comp[0])}: ${diff(gL && gL.g, c1L && c1L.c1)}</div></div>
          <div class="tile"><div class="k">vs ${U.esc(comp[1])}</div><div class="v">${n(c2L && c2L.c2)}</div><div class="d">${diff(gL && gL.g, c2L && c2L.c2) || "sem dado do concorrente"}</div></div>
          <div class="tile"><div class="k">${I("users")}Seguidores Instagram</div><div class="v">${n(igL && igL.ig)}</div><div class="d">${igL && igL.igNew != null ? "+" + U.num(igL.igNew) + " no mês · " : ""}concorrente: ${diff(igL && igL.ig, igCL && igCL.igC)}</div></div>
          <div class="tile"><div class="k">Engajamento Instagram</div><div class="v">${lastWith("igInt") ? U.pct(lastWith("igInt").igInt / lastWith("igInt").igViews, 2) : "—"}</div><div class="d">interações ÷ visualizações (${lastWith("igInt") ? U.ymLabel(lastWith("igInt").ym) : "—"})</div></div>
        </section>
        <section class="grid g-2">
          <div class="panel"><div class="panel-h"><h2>Avaliações no Google</h2><span class="hint">total acumulado do Jhow</span></div>${JR.vbars(soc.filter((s) => s.g != null).map((s) => ({ label: U.ymLabel(s.ym), value: s.g, tipExtra: U.esc(comp[0]) + ": " + n(s.c1) })), { height: 160 })}</div>
          <div class="panel"><div class="panel-h"><h2>Seguidores no Instagram</h2><span class="hint">total do Jhow</span></div>${JR.vbars(soc.filter((s) => s.ig != null).map((s) => ({ label: U.ymLabel(s.ym), value: s.ig, tipExtra: "concorrente: " + n(s.igC) })), { height: 160 })}</div>
        </section>
        <section class="panel">
          <div class="panel-h"><h2>Acompanhamento mensal</h2><div class="right"><button class="btn red sm" data-act="add">${I("plus")}Lançar mês</button></div></div>
          ${soc.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mês</th><th>Google</th><th>Novas</th><th>${U.esc(comp[0])}</th><th>Novas</th><th>${U.esc(comp[1])}</th><th>Instagram</th><th>Novos</th><th>Visualiz.</th><th>Interações</th><th>Concorr. IG</th><th></th></tr></thead><tbody>
            ${soc.slice().reverse().map((s) => `<tr><td>${U.ymLabel(s.ym, true)}</td><td>${n(s.g)}</td><td>${n(s.gNew)}</td><td>${n(s.c1)}</td><td>${n(s.c1New)}</td><td>${n(s.c2)}</td><td>${n(s.ig)}</td><td>${n(s.igNew)}</td><td>${n(s.igViews)}</td><td>${n(s.igInt)}</td><td>${n(s.igC)}</td><td><button class="icon-btn" data-edit="${s.ym}" aria-label="Editar">${I("edit")}</button></td></tr>`).join("")}
          </tbody></table></div>` : JR.art.empty("amp", "Sem números ainda", "Lance o primeiro mês de redes sociais.")}
        </section>
        <section class="panel">
          <div class="panel-h"><h2>Banco de ideias</h2><span class="hint">da ideia ao palco</span></div>
          <form id="idea-f" class="row" style="margin-bottom:12px"><input id="idea-t" class="input" style="flex:1 1 240px" placeholder="Nova ideia de campanha ou ação"><button class="btn red" type="submit">${I("plus")}Adicionar</button></form>
          <div class="board">${COLS.map(([k, l], ci) => { const items = st.ideas.filter((x) => x.col === k); return `<div class="col"><h4>${l}<span>${items.length}</span></h4>${items.map((x) => `<div class="card-i"><p>${U.esc(x.text)}</p><div class="row">${ci > 0 ? `<button class="icon-btn" data-mv="${x.id}" data-to="${COLS[ci - 1][0]}" aria-label="Voltar etapa">${I("back")}</button>` : ""}${ci < 2 ? `<button class="icon-btn" data-mv="${x.id}" data-to="${COLS[ci + 1][0]}" aria-label="Avançar etapa">${I("arrow")}</button>` : ""}<button class="icon-btn danger" data-rm="${x.id}" aria-label="Remover">${I("trash")}</button></div></div>`).join("") || `<p class="dim xs" style="padding:6px">Vazio</p>`}</div>`; }).join("")}</div>
        </section>`;
      el.querySelector("#idea-f").onsubmit = (e) => { e.preventDefault(); const t = el.querySelector("#idea-t").value.trim(); if (!t) return; st.ideas.unshift({ id: U.uid(), text: t, col: "ideia", date: U.today() }); JR.save(); JR.refresh(true); };
      el.onclick = (e) => {
        const mv = e.target.closest("[data-mv]"); if (mv) { const x = st.ideas.find((i) => i.id === mv.dataset.mv); x.col = mv.dataset.to; JR.save(); JR.refresh(true); return; }
        const rm = e.target.closest("[data-rm]"); if (rm) { const i = st.ideas.findIndex((x) => x.id === rm.dataset.rm); const [x] = st.ideas.splice(i, 1); JR.save(); JR.refresh(true); JR.toast("Ideia removida.", { undo: () => { st.ideas.splice(i, 0, x); JR.save(); JR.refresh(true); } }); return; }
        const ed = e.target.closest("[data-edit]"); if (ed) return socialForm(ed.dataset.edit);
        const a = e.target.closest("[data-act=add]"); if (a) socialForm(null);
      };
    },
  };
  function socialForm(ym) {
    const comp = JR.settings().competitors;
    const cur = (ym && JR.state.social.find((s) => s.ym === ym)) || { ym: U.ym(U.today()) };
    const F = [["g", "Avaliações Google (total)"], ["gNew", "Novas avaliações no mês"], ["c1", comp[0] + " — avaliações (total)"], ["c1New", comp[0] + " — novas no mês"], ["c2", comp[1] + " — avaliações (total)"], ["ig", "Seguidores Instagram"], ["igNew", "Novos seguidores"], ["igViews", "Visualizações"], ["igInt", "Interações"], ["igC", "Concorrente — seguidores IG"]];
    const d = JR.drawer({
      title: ym ? "Editar mês" : "Lançar mês",
      body: `<div class="form-grid"><div class="field full"><label for="s-ym">Mês</label><input id="s-ym" type="month" class="input" value="${cur.ym}"></div>${F.map(([k, l]) => `<div class="field"><label for="s-${k}">${U.esc(l)}</label><input id="s-${k}" class="input" inputmode="numeric" value="${cur[k] != null ? cur[k] : ""}"></div>`).join("")}</div>`,
      foot: `${ym ? `<button class="btn danger" data-del>${I("trash")}Excluir</button>` : ""}<button class="btn red" data-ok>${I("check")}Salvar</button>`,
    });
    d.el.querySelector("[data-ok]").onclick = () => {
      const nym = d.el.querySelector("#s-ym").value; if (!nym) return JR.toast("Escolha o mês.", { err: true });
      const rec = { ym: nym }; F.forEach(([k]) => { const v = d.el.querySelector("#s-" + k).value.trim(); rec[k] = v === "" ? null : U.parseMoney(v); });
      JR.state.social = JR.state.social.filter((s) => s.ym !== nym && s.ym !== ym); JR.state.social.push(rec); JR.save(); d.close(); JR.refresh(true); JR.toast("Mês salvo.");
    };
    const del = d.el.querySelector("[data-del]"); if (del) del.onclick = () => { JR.state.social = JR.state.social.filter((s) => s.ym !== ym); JR.save(); d.close(); JR.refresh(true); };
  }

  /* ================================================================ BIBLIOTECA (aba Livro) */
  const bk = { q: "", sec: "", st: "todos", limit: 80 };
  JR.views.biblioteca = {
    title: "Biblioteca", sub: "clube do livro",
    render(el) {
      const books = JR.state.books;
      const secs = [...new Set(books.map((b) => b.section))];
      const counts = { todos: books.length, livre: 0, emprestado: 0, atrasado: 0 };
      books.forEach((b) => counts[JR.bookStatus(b)]++);
      const top = books.slice().sort((a, b) => (b.reads || 0) - (a.reads || 0)).slice(0, 8).filter((b) => b.reads > 0);
      el.innerHTML = `
        ${JR.art.banner({ photo: "violao.jpg", kicker: "Clube do livro", title: "Biblioteca", text: "Pegue um livro, tome um café e devolva quando terminar. Cada leitura conta.", pos: "center 45%" })}
        <section class="grid g-4">
          <div class="tile"><div class="k">${I("book")}Acervo</div><div class="v">${U.num(books.length)}</div><div class="d">${secs.length} seções</div></div>
          <div class="tile"><div class="k">Emprestados</div><div class="v">${U.num(counts.emprestado + counts.atrasado)}</div><div class="d">${U.num(counts.livre)} disponíveis na estante</div></div>
          <div class="tile ${counts.atrasado ? "hot" : ""}"><div class="k">${I("clock")}Atrasados</div><div class="v">${U.num(counts.atrasado)}</div><div class="d">prazo de ${JR.settings().loanDays} dias</div></div>
          <div class="tile"><div class="k">Leituras</div><div class="v">${U.num(U.sum(books, (b) => b.reads || 0))}</div><div class="d">empréstimos devolvidos</div></div>
        </section>
        <section class="grid g-main">
          <div class="stack">
            <div class="row" style="gap:10px">
              <div class="search" style="flex:1 1 240px">${I("search")}<input id="bk-q" class="input" placeholder="Título, autor ou leitor" value="${U.esc(bk.q)}"></div>
              <select id="bk-sec" class="input" style="width:auto" aria-label="Seção"><option value="">Todas as seções</option>${secs.map((s) => `<option ${bk.sec === s ? "selected" : ""}>${U.esc(s)}</option>`).join("")}</select>
              <button class="btn red" data-act="add">${I("plus")}Livro</button>
            </div>
            <div class="chips">${[["todos", "Todos"], ["livre", "Na estante"], ["emprestado", "Emprestados"], ["atrasado", "Atrasados"]].map(([k, l]) => `<button class="chip ${bk.st === k ? "on" : ""}" data-st="${k}">${l} <span class="n">${U.num(k === "emprestado" ? counts.emprestado : counts[k])}</span></button>`).join("")}</div>
            <div class="panel" style="padding:8px 12px"><div id="bk-list" class="list"></div></div>
          </div>
          <div class="panel"><div class="panel-h"><h2>Mais lidos</h2></div>${top.length ? JR.hbars(top.map((b) => ({ label: U.titleCase(b.title), value: b.reads })), { fmt: (v) => U.num(v) + "×" }) : `<div class="empty">Sem leituras registradas.</div>`}</div>
        </section>`;
      const draw = () => {
        const q = U.norm(bk.q);
        let rows = books.filter((b) => (!bk.sec || b.section === bk.sec) && (bk.st === "todos" || JR.bookStatus(b) === bk.st));
        if (q) rows = rows.filter((b) => U.norm(b.title + " " + b.author + " " + JR.loanName(b.loan)).includes(q));
        rows.sort((a, b) => { const o = { atrasado: 0, emprestado: 1, livre: 2 }; return bk.st === "todos" && !q ? a.code - b.code : o[JR.bookStatus(a)] - o[JR.bookStatus(b)] || a.code - b.code; });
        el.querySelector("#bk-list").innerHTML = rows.length ? rows.slice(0, bk.limit).map((b) => {
          const s = JR.bookStatus(b);
          return `<div class="li"><span class="dim num" style="width:38px;font-family:var(--f-head);font-weight:700">#${b.code}</span><div class="main-t"><div class="name">${U.esc(U.titleCase(b.title))}</div><div class="meta"><span>${U.esc(U.titleCase(b.author) || "—")}</span><span>${U.esc(b.section)}</span>${b.reads ? `<span>${b.reads}× lido</span>` : ""}${b.loan ? `<span>com <b style="color:var(--fg)">${U.esc(JR.loanName(b.loan))}</b> desde ${U.date(b.loan.date)}</span>` : ""}</div></div>
            ${s === "livre" ? `<button class="btn sm" data-lend="${b.id}">Emprestar</button>` : `<span class="pill ${s === "atrasado" ? "bad" : "line"}">${s === "atrasado" ? "Atrasado" : "Emprestado"}</span><button class="btn sm red" data-ret="${b.id}">Devolver</button>`}</div>`;
        }).join("") + (rows.length > bk.limit ? `<div style="padding:12px;text-align:center"><button class="btn" data-more>Mostrar mais (${rows.length - bk.limit})</button></div>` : "") : JR.art.empty("vinyl", "Nada na estante", "Nenhum livro com esse filtro.");
      };
      draw();
      el.querySelector("#bk-q").oninput = U.debounce((e) => { bk.q = e.target.value; bk.limit = 80; draw(); }, 120);
      el.querySelector("#bk-sec").onchange = (e) => { bk.sec = e.target.value; draw(); };
      el.onclick = (e) => {
        const s = e.target.closest("[data-st]"); if (s) { bk.st = s.dataset.st; JR.refresh(true); return; }
        if (e.target.closest("[data-more]")) { bk.limit += 150; draw(); return; }
        const l = e.target.closest("[data-lend]"); if (l) return lendForm(l.dataset.lend);
        const r = e.target.closest("[data-ret]"); if (r) { const b = JR.returnBook(r.dataset.ret); JR.toast(`“${U.esc(U.titleCase(b.title))}” voltou pra estante.`); JR.refresh(true); return; }
        if (e.target.closest("[data-act=add]")) bookForm();
      };
    },
  };
  function lendForm(id) {
    const b = JR.state.books.find((x) => x.id === id);
    let picked = null;
    const d = JR.drawer({
      title: "Emprestar livro",
      body: `<div class="note"><b>${U.esc(U.titleCase(b.title))}</b><br>${U.esc(U.titleCase(b.author))} · #${b.code}</div>
        <div class="field"><label for="ln-q">Para quem?</label><div class="search">${I("search")}<input id="ln-q" class="input" placeholder="Buscar cliente pelo nome ou telefone" autofocus autocomplete="off"></div><span class="help">Se a pessoa não tem cadastro, digite o nome e use “Emprestar sem cadastro”.</span></div>
        <div id="ln-res"></div>
        <div class="form-grid"><div class="field"><label for="ln-date">Data</label><input id="ln-date" type="date" class="input" value="${U.today()}"></div><div class="field"><label for="ln-days">Prazo (dias)</label><input id="ln-days" class="input" inputmode="numeric" value="${JR.settings().loanDays}"></div></div>`,
      foot: `<button class="btn" data-free>Emprestar sem cadastro</button><button class="btn red" data-ok disabled>${I("check")}Emprestar</button>`,
    });
    const q = d.el.querySelector("#ln-q"), res = d.el.querySelector("#ln-res"), ok = d.el.querySelector("[data-ok]");
    const draw = () => {
      if (picked) { res.innerHTML = `<div class="who-card">${JR.pick(picked.name)}<div class="main-t"><div class="nm" style="font-size:1.1rem">${U.esc(picked.name)}</div></div><button class="icon-btn" data-un aria-label="Trocar">${I("x")}</button></div>`; ok.disabled = false; return; }
      ok.disabled = true;
      const r = JR.search(q.value, 6);
      res.innerHTML = r.length ? `<div class="list">${r.map((c) => JR.custRow(c, { act: "lpick" })).join("")}</div>` : "";
    };
    q.oninput = draw;
    res.onclick = (e) => { const a = e.target.closest("[data-act=lpick]"); if (a) { picked = JR.byId.get(a.dataset.id); draw(); } if (e.target.closest("[data-un]")) { picked = null; draw(); } };
    const go = (loan) => { JR.lendBook(id, Object.assign(loan, { date: d.el.querySelector("#ln-date").value || U.today(), days: parseInt(d.el.querySelector("#ln-days").value, 10) || JR.settings().loanDays })); d.close(); JR.refresh(true); JR.toast("Livro emprestado."); };
    ok.onclick = () => picked && go({ cid: picked.id });
    d.el.querySelector("[data-free]").onclick = () => { const n = q.value.trim(); if (n.length < 2) { JR.toast("Digite o nome de quem está levando.", { err: true }); q.focus(); return; } go({ cid: null, name: U.titleCase(n) }); };
  }
  function bookForm() {
    const secs = [...new Set(JR.state.books.map((b) => b.section))];
    const d = JR.drawer({
      title: "Novo livro no acervo",
      body: `<div class="form-grid"><div class="field full"><label for="bf-t">Título *</label><input id="bf-t" class="input" autofocus></div><div class="field full"><label for="bf-a">Autor(a)</label><input id="bf-a" class="input"></div><div class="field full"><label for="bf-s">Seção</label><input id="bf-s" class="input" list="bf-sl" value="Novas chegadas"><datalist id="bf-sl">${secs.map((s) => `<option value="${U.esc(s)}">`).join("")}</datalist></div></div>`,
      foot: `<button class="btn red" data-ok>${I("check")}Adicionar</button>`,
    });
    d.el.querySelector("[data-ok]").onclick = () => {
      const t = d.el.querySelector("#bf-t").value.trim(); if (!t) return JR.toast("Informe o título.", { err: true });
      const code = Math.max(0, ...JR.state.books.map((b) => b.code)) + 1;
      JR.state.books.push({ id: "b" + U.uid(), code, title: t.toLowerCase(), author: d.el.querySelector("#bf-a").value.trim().toLowerCase(), section: d.el.querySelector("#bf-s").value.trim() || "Novas chegadas", reads: 0, loan: null, history: [] });
      JR.save(); d.close(); JR.refresh(true); JR.toast("Livro #" + code + " adicionado.");
    };
  }

  /* ================================================================ AJUSTES */
  JR.views.ajustes = {
    title: "Ajustes", sub: "regras, mensagens e dados",
    render(el) {
      const s = JR.settings();
      const T = [["venda", "Depois da venda", "{nome}, {ganho}, {saldo}"], ["niver", "Aniversário", "{nome}, {saldo}, {idade}"], ["bis", "Pedindo bis (reativação)", "{nome}, {saldo}"], ["saldo", "Saldo parado", "{nome}, {saldo}"], ["lenda", "Lendas da casa", "{nome}, {saldo}"]];
      el.innerHTML = `
        ${JR.state.demo ? `<div class="note warn"><b>Você está vendo dados de exemplo.</b> Os clientes são fictícios, mas seguem o perfil real da planilha. O acervo da biblioteca e os números de redes sociais são os reais. Para usar com os clientes de verdade, importe a planilha abaixo.</div>` : ""}
        <section class="grid g-2">
          <form class="panel stack" id="set-f">
            <div class="panel-h"><h2>Regras do cashback</h2></div>
            <div class="volume" style="background:var(--sunken)">${JR.art.knob(s.cashbackPct, { label: "Cashback", size: 110 })}<div><div class="eyebrow">Cashback no volume</div><div class="big">${U.num(s.cashbackPct, 1).replace(",0", "")}% de volta</div><div class="dim xs">a cada R$ 100 consumidos, ${U.money(s.cashbackPct)} de saldo</div></div></div>
            <div class="form-grid">
              <div class="field"><label for="s-pct">Cashback (%)</label><input id="s-pct" class="input" inputmode="decimal" value="${U.num(s.cashbackPct, 2)}"><span class="help">Planilha: total ÷ 12,5 = 8%. Vale para as próximas vendas.</span></div>
              <div class="field"><label for="s-min">Resgate mínimo (R$)</label><input id="s-min" class="input" inputmode="decimal" value="${U.num(s.minRedeem, 2)}"><span class="help">0 = sem mínimo.</span></div>
              <div class="field full"><label for="s-re">Visita com resgate</label><select id="s-re" class="input"><option value="none" ${s.redeemEarns === "none" ? "selected" : ""}>Não gera cashback (como na planilha)</option><option value="net" ${s.redeemEarns === "net" ? "selected" : ""}>Gera cashback sobre o valor pago</option></select></div>
            </div>
            <div class="panel-h mt"><h2>Status do cliente</h2><span class="hint">dias desde a última visita</span></div>
            <div class="form-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">
              <div class="field"><label for="s-a">Ativo até</label><input id="s-a" class="input" inputmode="numeric" value="${s.status.ativo}"></div>
              <div class="field"><label for="s-m">Morno até</label><input id="s-m" class="input" inputmode="numeric" value="${s.status.morno}"></div>
              <div class="field"><label for="s-f">Afastado até</label><input id="s-f" class="input" inputmode="numeric" value="${s.status.afastado}"></div>
            </div>
            <div class="panel-h mt"><h2>Outros</h2></div>
            <div class="form-grid">
              <div class="field"><label for="s-own">Nome no painel</label><input id="s-own" class="input" value="${U.esc(s.owner)}"></div>
              <div class="field"><label for="s-loan">Prazo de empréstimo (dias)</label><input id="s-loan" class="input" inputmode="numeric" value="${s.loanDays}"></div>
              <div class="field"><label for="s-c1">Concorrente 1</label><input id="s-c1" class="input" value="${U.esc(s.competitors[0])}"></div>
              <div class="field"><label for="s-c2">Concorrente 2</label><input id="s-c2" class="input" value="${U.esc(s.competitors[1])}"></div>
            </div>
            <div class="panel-h mt"><h2>Mensagens de WhatsApp</h2></div>
            ${T.map(([k, l, vars]) => `<div class="field"><label for="t-${k}">${l}</label><textarea id="t-${k}" class="input" style="min-height:76px">${U.esc(s.tpl[k])}</textarea><span class="help">Campos: ${vars}</span></div>`).join("")}
            <button class="btn red" type="submit">${I("check")}Salvar ajustes</button>
          </form>
          <div class="stack">
            <div class="panel stack">
              <div class="panel-h"><h2>Trazer a planilha</h2></div>
              <p class="muted small">Importa as abas <b>Cash</b> (clientes, compras e resgates), <b>Livro</b> (acervo e empréstimos) e <b>Camp</b> (redes e ideias) do arquivo <b>Jhow Cashback.xlsx</b>. A leitura acontece neste navegador e nada é enviado para fora.</p>
              <label class="btn red block" for="imp-x">${I("upload")}Escolher planilha .xlsx</label>
              <input id="imp-x" type="file" accept=".xlsx,.xls" hidden>
              <div id="imp-out"></div>
            </div>
            <div class="panel stack">
              <div class="panel-h"><h2>Backup</h2></div>
              <p class="muted small">Os dados ficam salvos neste navegador. Faça backup toda semana e guarde o arquivo em um lugar seguro (ex.: OneDrive).</p>
              <div class="row"><button class="btn" data-act="export">${I("download")}Baixar backup</button><label class="btn" for="imp-j">${I("upload")}Restaurar backup</label><input id="imp-j" type="file" accept=".json" hidden></div>
              <p class="dim xs">${U.num(JR.state.customers.length)} clientes · ${U.num(JR.state.visits.length)} lançamentos · ${U.num(JR.state.books.length)} livros ${JR.storageOk ? "" : '· <span style="color:var(--warn)">não consegui salvar neste navegador</span>'}</p>
            </div>
            <div class="panel stack">
              <div class="panel-h"><h2>Zona de perigo</h2></div>
              <div class="row"><button class="btn danger" data-act="demo">${I("undo")}Recarregar exemplo</button><button class="btn danger" data-act="wipe">${I("trash")}Apagar tudo</button></div>
            </div>
            <div class="note credits"><b>Fotos.</b> Unsplash, licença livre para uso comercial: ${JR.art.CREDITS.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l}</a>`).join(" · ")}. Ilustrações feitas para o Jhow.</div>
            <div class="note"><b>Privacidade (LGPD).</b> Nome, telefone e aniversário dos clientes são dados pessoais. Use só para o programa de fidelidade, não compartilhe o backup e apague quem pedir para sair.</div>
          </div>
        </section>`;

      el.querySelector("#set-f").onsubmit = (e) => {
        e.preventDefault();
        const g = (id) => el.querySelector(id).value;
        const a = parseInt(g("#s-a"), 10), m = parseInt(g("#s-m"), 10), f = parseInt(g("#s-f"), 10);
        if (!(a > 0 && m > a && f > m)) return JR.toast("Os dias de status precisam ser crescentes (ativo < morno < afastado).", { err: true });
        const pct = U.parseMoney(g("#s-pct")); if (!(pct >= 0 && pct <= 50)) return JR.toast("Cashback precisa estar entre 0% e 50%.", { err: true });
        Object.assign(s, { cashbackPct: pct, minRedeem: U.parseMoney(g("#s-min")), redeemEarns: g("#s-re"), status: { ativo: a, morno: m, afastado: f }, owner: g("#s-own").trim() || "Jhow", loanDays: parseInt(g("#s-loan"), 10) || 30, competitors: [g("#s-c1").trim() || "Concorrente 1", g("#s-c2").trim() || "Concorrente 2"] });
        T.forEach(([k]) => (s.tpl[k] = g("#t-" + k)));
        JR.reindex(); JR.save(); JR.toast("Ajustes salvos."); JR.updateBadges();
      };

      el.querySelector("#imp-x").onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const out = el.querySelector("#imp-out");
        out.innerHTML = `<p class="muted small">Lendo ${U.esc(file.name)}…</p>`;
        try {
          const { state, summary } = await JR.importXlsx(file);
          out.innerHTML = `<div class="note"><b>Encontrei na planilha:</b><br>${U.num(summary.customers)} clientes · ${U.num(summary.visits)} compras · ${U.num(summary.redeems)} resgates<br>Consumo total ${U.money(summary.spend)} · cashback em aberto ${U.money(summary.balance)}<br>${U.num(summary.books)} livros (${summary.loans} emprestados) · ${summary.social} meses de redes · ${summary.ideas} ideias${summary.warn.length ? `<br><span style="color:var(--warn)">Avisos: ${summary.warn.map(U.esc).join("; ")}</span>` : ""}</div>`;
          const ok = await JR.confirm({ title: "Substituir os dados atuais?", text: `Os ${U.num(JR.state.customers.length)} clientes atuais${JR.state.demo ? " (de exemplo)" : ""} serão trocados pelos ${U.num(summary.customers)} da planilha. Se tiver algo importante, baixe um backup antes.`, ok: "Importar planilha" });
          if (!ok) { out.innerHTML += `<p class="dim xs mt">Importação cancelada.</p>`; return; }
          await JR.replaceState(state); JR.toast("Planilha importada. Bem-vindo ao sistema!"); JR.go("palco");
        } catch (err) { out.innerHTML = `<div class="note warn">${U.esc(err.message)}</div>`; }
        e.target.value = "";
      };
      el.querySelector("#imp-j").onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          if (!data || !Array.isArray(data.customers)) throw new Error("Esse arquivo não é um backup do sistema.");
          const ok = await JR.confirm({ title: "Restaurar backup?", text: `Troca tudo pelos ${U.num(data.customers.length)} clientes do backup.`, ok: "Restaurar" });
          if (!ok) return;
          await JR.replaceState(data); await JR.load(); JR.toast("Backup restaurado."); JR.go("palco");
        } catch (err) { JR.toast(U.esc(err.message), { err: true }); }
        e.target.value = "";
      };
      el.onclick = async (e) => {
        const a = e.target.closest("[data-act]"); if (!a) return;
        if (a.dataset.act === "export") {
          const blob = new Blob([JSON.stringify(JR.state)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a"); link.href = url; link.download = "jhow-rock-cafe-backup-" + U.today() + ".json"; document.body.append(link); link.click(); link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          JR.toast("Backup gerado. Se o download não começar, abra o sistema direto pelo arquivo index.html.");
        }
        if (a.dataset.act === "demo") { if (await JR.confirm({ title: "Recarregar dados de exemplo?", text: "Apaga os dados atuais e volta para os clientes fictícios.", ok: "Recarregar", danger: true })) { await JR.replaceState(JR.seedDemo()); JR.toast("Exemplo recarregado."); JR.go("palco"); } }
        if (a.dataset.act === "wipe") { if (await JR.confirm({ title: "Apagar tudo?", text: "Começa do zero: sem clientes, vendas ou livros. Não dá para desfazer.", ok: "Apagar tudo", danger: true })) { await JR.replaceState(JR.emptyState()); JR.toast("Tudo apagado. Palco limpo."); JR.go("palco"); } }
      };
    },
  };
})();
