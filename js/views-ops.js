/* =====================================================================
   Telas de operação: Palco (painel), Caixa, Clientes, Perfil, Cadastro
   ===================================================================== */
(function () {
  const JR = window.JR, U = JR.u, I = JR.icon;
  JR.views = JR.views || {};

  /* ---------------------------------------------------------- busca de clientes */
  const nameCache = new Map();
  const normName = (c) => { const h = nameCache.get(c.id); if (h && h[0] === c.name) return h[1]; const n = U.norm(c.name); nameCache.set(c.id, [c.name, n]); return n; };
  JR.search = function (q, limit = 8) {
    const qs = U.norm(q); if (!qs) return [];
    const toks = qs.split(/\s+/); const dg = U.digits(q);
    const out = [];
    for (const c of JR.state.customers) {
      const n = normName(c);
      let ok = toks.every((t) => n.includes(t));
      if (!ok && dg.length >= 4 && c.phone && c.phone.includes(dg)) ok = true;
      if (ok) out.push(c);
    }
    out.sort((a, b) => { const na = normName(a), nb = normName(b); const sa = na.startsWith(qs) ? 0 : 1, sb = nb.startsWith(qs) ? 0 : 1; if (sa !== sb) return sa - sb; return ((JR.stats.get(b.id).last || "") > (JR.stats.get(a.id).last || "") ? 1 : -1); });
    return out.slice(0, limit);
  };

  const custRow = (c, opts = {}) => {
    const s = JR.stats.get(c.id);
    const since = s.since == null ? "sem visitas" : s.since === 0 ? "veio hoje" : "há " + s.since + (s.since === 1 ? " dia" : " dias");
    return `<div class="li click" data-act="${opts.act || "open"}" data-id="${c.id}" tabindex="0" role="button">
      ${JR.pick(c.name, s.tier === "lenda" ? "lenda" : JR.STATUS[s.status].cls)}
      <div class="main-t"><div class="name">${U.esc(c.name)}</div>
        <div class="meta">${JR.statusPill(s.status)} ${s.visits ? JR.tierBadge(s.tier) : ""}<span>${s.visits} visita${s.visits === 1 ? "" : "s"}</span><span>${since}</span>${opts.extra || ""}</div></div>
      <div class="val num">${U.money(s.balance)}<small>saldo</small></div></div>`;
  };
  JR.custRow = custRow;

  /* ================================================================ PALCO */
  JR.views.palco = {
    title: "Palco", sub: "o show de hoje",
    render(el) {
      const today = U.today();
      const st = JR.state;
      const todayV = st.visits.filter((v) => v.date === today).sort((a, b) => (b.ts || 0) - (a.ts || 0));
      const vToday = U.sum(todayV, (v) => v.amount);
      const eToday = U.sum(todayV, (v) => v.earn || 0);
      const rToday = U.sum(todayV, (v) => v.redeem || 0);
      const m0 = today.slice(0, 7) + "-01";
      const pm = JR.periodMetrics(m0, today);
      const prevStart = U.addMonths(today.slice(0, 7), -1) + "-01";
      const prevSame = U.addDays(prevStart, U.days(m0, today));
      const pp = JR.periodMetrics(prevStart, prevSame);
      const snap = JR.baseSnapshot();
      const bdays = JR.birthdays("semana");
      const bis = st.customers.map((c) => [c, JR.stats.get(c.id)]).filter(([, s]) => (s.status === "afastado" || s.status === "morno") && s.balance >= 5).sort((a, b) => b[1].balance - a[1].balance).slice(0, 5);
      const late = st.books.filter((b) => JR.bookStatus(b) === "atrasado");
      const days = []; for (let i = 29; i >= 0; i--) days.push(U.addDays(today, -i));
      const dmap = {}; st.visits.forEach((v) => { if (v.date >= days[0]) dmap[v.date] = (dmap[v.date] || 0) + v.amount; });
      const h = new Date().getHours();
      const hello = (h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite") + ", " + U.esc(JR.settings().owner);
      // volume do caixa: hoje comparado à média diária dos 29 dias anteriores (5 = dia normal, 11 = recorde)
      const avgDay = U.sum(days.slice(0, -1), (d) => dmap[d] || 0) / 29;
      const vol = avgDay > 0 ? Math.min(11, (vToday / avgDay) * 5) : 0;
      const delta = (a, b) => (b ? (a >= b ? "▲ " : "▼ ") + U.pct(Math.abs(a - b) / b, 0) + " vs mesmo período do mês passado" : "primeiro mês com dados");

      el.innerHTML = `
      <section class="stage-hero">
        <div class="grow">
          <div class="hello">${hello}</div><div class="date">${U.dateLong(today)} · ${U.num(snap.total)} clientes na banda</div>
          <div class="row" style="margin-top:18px">
            <a class="btn red xl" href="#caixa">${I("coffee")}Nova venda</a>
            <button class="btn xl ghost" data-act="new">${I("plus")}Novo cliente</button>
          </div>
        </div>
        <div class="volume" data-tip="<b>Volume do caixa</b>Hoje comparado à média dos últimos 30 dias. 5 é um dia normal; 11 é dia de recorde.">${JR.art.knob(vol, { label: "Volume do caixa" })}
          <div><div class="eyebrow">Volume do caixa</div><div class="big">${U.money(vToday)}</div><div class="dim xs">média de ${U.money(avgDay)} por dia</div>${vol >= 10 ? '<span class="eleven-msg">Esse dia vai até 11!</span>' : ""}</div></div>
        ${JR.art.strings()}
      </section>

      <section class="grid g-4">
        <div class="tile hot"><span class="screws"></span><div class="k">${I("coin")}Hoje no caixa</div><div class="v">${U.money(vToday)}</div><div class="d">${todayV.length} visita${todayV.length === 1 ? "" : "s"} · cashback +${U.money(eToday)} · resgatado ${U.money(rToday)}</div></div>
        <div class="tile"><span class="screws"></span><div class="k">${I("users")}Novos no mês</div><div class="v">${U.num(pm.leads)}</div><div class="d">${delta(pm.leads, pp.leads)}</div></div>
        <div class="tile"><span class="screws"></span><div class="k">${I("ticket")}Ticket médio do mês</div><div class="v">${U.money(pm.ticket)}</div><div class="d">${U.num(pm.visits)} visitas · ${U.money(pm.valor)}</div></div>
        <div class="tile"><span class="screws"></span><div class="k">${I("bolt")}Cashback em circulação</div><div class="v">${U.money(snap.balance)}</div><div class="d">${U.num(snap.withBal)} clientes com saldo para usar</div></div>
      </section>

      <section class="grid g-main">
        <div class="stack">
          <div class="panel setlist paper">
            <div class="panel-h"><h2>Setlist <span class="tag">de hoje</span></h2><span class="hint">ordem das vendas lançadas hoje</span><div class="right"><a class="btn sm" href="#caixa">${I("plus")}Lançar</a></div></div>
            ${todayV.length ? `<div class="list">${todayV.slice(0, 12).map((v, i) => { const c = JR.byId.get(v.cid); return `<div class="li"><span class="ord">${String(todayV.length - i).padStart(2, "0")}</span>${JR.pick(c ? c.name : "?")}<div class="main-t"><div class="name">${U.esc(c ? c.name : "Cliente removido")}</div><div class="meta">${v.redeem > 0 ? `<span class="pill bad">Resgate ${U.money(v.redeem)}</span>` : `<span>+${U.money(v.earn)} de cashback</span>`}${v.ts > 1e12 ? `<span>${new Date(v.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>` : ""}</div></div><div class="val num">${U.money(v.amount)}</div><button class="icon-btn danger" data-act="undo" data-id="${v.id}" data-tip="Estornar esta venda" aria-label="Estornar">${I("undo")}</button></div>`; }).join("")}</div>${todayV.length > 12 ? `<p class="dim small mt">+ ${todayV.length - 12} vendas anteriores hoje</p>` : ""}`
              : JR.art.empty("guitar", "Palco vazio", "Nenhuma venda lançada hoje. A guitarra tá esperando o primeiro acorde.", `<a class="btn" href="#caixa">${I("coffee")}Abrir o caixa</a>`)}
          </div>
          <div class="panel">
            <div class="panel-h"><h2>Últimos 30 dias</h2><span class="hint">consumo de clientes cadastrados por dia</span></div>
            ${JR.vbars(days.map((d) => ({ label: d.slice(8), tipLabel: U.date(d) + " · " + U.toDate(d).toLocaleDateString("pt-BR", { weekday: "short" }), value: U.r2(dmap[d] || 0) })), { fmt: (v, short) => (short ? U.moneyAxis(v) : U.money(v)), height: 150 })}
          </div>
        </div>
        <div class="stack">
          <div class="panel">
            <div class="panel-h"><h2>${I("gift")} Aniversariantes</h2><span class="hint">próximos 7 dias</span><div class="right"><a class="btn sm ghost" href="#fas">Ver todos</a></div></div>
            ${bdays.length ? `<div class="list">${bdays.slice(0, 6).map((b) => `<div class="li click" data-act="open" data-id="${b.c.id}">${JR.pick(b.c.name)}<div class="main-t"><div class="name">${U.esc(b.c.name)}</div><div class="meta"><span>${b.inDays === 0 ? '<span class="pill bad">Hoje!</span>' : b.inDays === 1 ? "amanhã" : "em " + b.inDays + " dias"}</span><span>${String(b.day).padStart(2, "0")}/${String(b.c.birth.m).padStart(2, "0")}${b.turning ? " · faz " + b.turning : ""}</span></div></div><a class="icon-btn" style="color:var(--ok)" href="${U.wa(b.c.phone, JR.msg("niver", b.c))}" target="_blank" rel="noopener" data-act="wa" data-kind="niver" data-id="${b.c.id}" data-tip="Mandar parabéns no WhatsApp" aria-label="WhatsApp">${I("wa")}</a></div>`).join("")}</div>` : `<div class="empty">Ninguém sopra velinhas esta semana.</div>`}
          </div>
          <div class="panel">
            <div class="panel-h"><h2>Pedindo bis</h2><span class="hint">sumindo, mas com saldo</span><div class="right"><a class="btn sm ghost" href="#fas/bis">Ver todos</a></div></div>
            ${bis.length ? `<div class="list">${bis.map(([c]) => custRow(c)).join("")}</div>` : `<div class="empty">Ninguém esfriando com saldo. A banda tá completa.</div>`}
          </div>
          <div class="panel">
            <div class="panel-h"><h2>${I("book")} Biblioteca</h2><div class="right"><a class="btn sm ghost" href="#biblioteca">Abrir</a></div></div>
            ${late.length ? `<p class="small muted" style="margin-bottom:8px"><b style="color:var(--fg)">${late.length} livro${late.length > 1 ? "s" : ""}</b> com devolução atrasada</p><div class="list">${late.slice(0, 4).map((b) => `<div class="li"><div class="main-t"><div class="name">${U.esc(U.titleCase(b.title))}</div><div class="meta"><span>${U.esc(JR.loanName(b.loan))}</span><span>desde ${U.date(b.loan.date)}</span></div></div><span class="pill bad">Atrasado</span></div>`).join("")}</div>` : `<div class="empty">Todos os livros dentro do prazo.</div>`}
          </div>
        </div>
      </section>`;

      el.onclick = async (e) => {
        const a = e.target.closest("[data-act]"); if (!a) return;
        const act = a.dataset.act;
        if (act === "open") JR.openCustomer(a.dataset.id);
        if (act === "new") JR.customerForm(null, { onSave: (c) => JR.openCustomer(c.id) });
        if (act === "wa") { JR.logContact(a.dataset.id, a.dataset.kind); }
        if (act === "undo") {
          const v = JR.state.visits.find((x) => x.id === a.dataset.id); if (!v) return;
          const c = JR.byId.get(v.cid);
          const ok = await JR.confirm({ title: "Estornar venda?", text: `Remove a venda de ${U.money(v.amount)} de ${U.esc(c ? c.name : "cliente")}. O cashback dessa visita também sai do saldo.`, ok: "Estornar", danger: true });
          if (!ok) return;
          const del = JR.deleteVisit(v.id); JR.refresh();
          JR.toast("Venda estornada.", { undo: () => { JR.restoreVisit(del); JR.refresh(); } });
        }
      };
    },
  };

  /* ================================================================ CAIXA */
  const pos = { cid: null, amount: "", redeemOn: false, redeem: "", date: "", note: "", q: "", done: null };
  JR.posSelect = (cid) => { Object.assign(pos, { cid, amount: "", redeemOn: false, redeem: "", note: "", done: null }); };

  JR.views.caixa = {
    title: "Caixa", sub: "lançar venda e cashback",
    render(el, params) {
      if (params && params[0] && JR.byId.get(params[0]) && pos.cid !== params[0]) JR.posSelect(params[0]);
      el.innerHTML = `<div class="pos"><div class="panel" id="pos-left"></div><div class="panel beans" id="pos-right"></div></div>`;
      const left = el.querySelector("#pos-left"), right = el.querySelector("#pos-right");

      const renderLeft = () => {
        const today = U.today();
        const servedIds = [...new Set(JR.state.visits.filter((v) => v.date === today).sort((a, b) => (b.ts || 0) - (a.ts || 0)).map((v) => v.cid))].slice(0, 6);
        left.innerHTML = `
          <div class="panel-h"><span class="step-n">1</span><h2>Quem tá no balcão?</h2></div>
          <div class="stack">
            <div class="search">${I("search")}<input id="pos-q" class="input" placeholder="Nome ou telefone do cliente" autocomplete="off" value="${U.esc(pos.q)}" ${pos.cid ? "" : "autofocus"}></div>
            <div id="pos-res"></div>
            <button class="btn block" data-act="new">${I("plus")}Cadastrar cliente novo</button>
          </div>`;
        const res = left.querySelector("#pos-res");
        const draw = () => {
          const q = pos.q.trim();
          if (!q) {
            res.innerHTML = servedIds.length ? `<div class="eyebrow" style="margin:6px 0">Atendidos hoje</div><div class="list">${servedIds.map((id) => JR.byId.get(id)).filter(Boolean).map((c) => custRow(c, { act: "pick" })).join("")}</div>` : `<p class="dim small">Digite pelo menos 2 letras do nome ou 4 números do telefone.</p>`;
            return;
          }
          const r = JR.search(q, 8);
          res.innerHTML = r.length ? `<div class="list">${r.map((c) => custRow(c, { act: "pick" })).join("")}</div>` : `<div class="empty"><p>Ninguém com “${U.esc(q)}”.</p><button class="btn red sm" data-act="new">${I("plus")}Cadastrar “${U.esc(q)}”</button></div>`;
        };
        draw();
        const qi = left.querySelector("#pos-q");
        qi.oninput = () => { pos.q = qi.value; draw(); };
        qi.onkeydown = (e) => { if (e.key === "Enter") { const f = res.querySelector("[data-act=pick]"); if (f) f.click(); } };
        if (!pos.cid && window.innerWidth > 900) setTimeout(() => qi.focus(), 30);
      };

      const renderRight = () => {
        if (pos.done) return renderDone();
        const c = pos.cid && JR.byId.get(pos.cid);
        if (!c) {
          right.innerHTML = `<div class="panel-h"><span class="step-n">2</span><h2>Comanda</h2></div><div class="cafe-empty"><img class="banner-img" src="assets/fotos/cafe.jpg" alt="" decoding="async"><div class="banner-shade"></div>${JR.art.cup("art-md")}<div class="big">Comanda vazia</div><p>Escolha quem está no balcão para abrir a comanda. O café já tá passando.</p></div>`;
          return;
        }
        const s = JR.stats.get(c.id);
        if (!pos.date) pos.date = U.today();
        right.innerHTML = `
          <div class="panel-h"><span class="step-n">2</span><h2>Comanda</h2><span class="hint">${I("coffee")} pedido no balcão</span></div>
          <div class="stack" style="gap:14px">
            <div class="who-card">${JR.pick(c.name, "big " + (s.tier === "lenda" ? "lenda" : JR.STATUS[s.status].cls))}
              <div class="main-t"><div class="nm">${U.esc(c.name)}</div><div class="row mt">${JR.statusPill(s.status)}${s.visits ? JR.tierBadge(s.tier) : ""}<span class="dim small">${s.visits} visitas · ${U.phoneFmt(c.phone)}</span></div></div>
              <button class="icon-btn" data-act="clear" aria-label="Trocar cliente" data-tip="Trocar cliente">${I("x")}</button></div>
            <div class="bal"><div><div class="eyebrow">Saldo de cashback</div><div class="dim xs">${s.lastRedeem ? "último resgate em " + U.date(s.lastRedeem) : "nunca resgatou"}</div></div><div class="amt num">${U.money(s.balance)}</div></div>
            <div class="field"><label for="pos-amt">Valor da conta</label><div class="money-in"><span>R$</span><input id="pos-amt" class="input" inputmode="decimal" placeholder="0,00" autocomplete="off" value="${U.esc(pos.amount)}"></div></div>
            <label class="switch" ${s.balance <= 0 ? 'style="opacity:.5;pointer-events:none"' : ""}><input type="checkbox" id="pos-ron" ${pos.redeemOn ? "checked" : ""} ${s.balance <= 0 ? "disabled" : ""}><span class="track"></span><span><b>Usar cashback nesta conta</b><br><span class="dim small">${s.balance > 0 ? "até " + U.money(s.balance) : "sem saldo disponível"}${JR.settings().redeemEarns === "none" ? " · visita com resgate não gera cashback" : ""}</span></span></label>
            <div class="field" id="pos-rwrap" ${pos.redeemOn ? "" : "hidden"}><label for="pos-red">Quanto do saldo usar</label><input id="pos-red" class="input" inputmode="decimal" placeholder="0,00" value="${U.esc(pos.redeem)}"></div>
            <div class="form-grid">
              <div class="field"><label for="pos-date">Data</label><input id="pos-date" type="date" class="input" value="${pos.date}" max="${U.today()}"></div>
              <div class="field"><label for="pos-note">Observação</label><input id="pos-note" class="input" placeholder="opcional" value="${U.esc(pos.note)}"></div>
            </div>
            <div class="calc" id="pos-calc"></div>
            <div id="pos-err" class="small" style="color:var(--warn)" role="alert"></div>
            <button class="btn red xl block" id="pos-go" data-act="go">${I("check")}Lançar venda</button>
          </div>`;
        const amt = right.querySelector("#pos-amt"), ron = right.querySelector("#pos-ron"), red = right.querySelector("#pos-red"), rwrap = right.querySelector("#pos-rwrap");
        const calc = () => {
          const a = U.parseMoney(pos.amount); const r = pos.redeemOn ? U.parseMoney(pos.redeem) : 0;
          const p = JR.preview(c.id, a, r);
          right.querySelector("#pos-calc").innerHTML = `
            <div class="ln"><span>Consumo</span><b>${U.money(p.amount)}</b></div>
            ${pos.redeemOn ? `<div class="ln"><span>Cashback usado</span><b>− ${U.money(p.redeem)}</b></div>` : ""}
            <div class="ln total"><span>A pagar</span><b>${U.money(Math.max(0, p.pay))}</b></div>
            <div class="ln earn"><span class="plus">${I("bolt")}Cashback gerado (${U.num(JR.settings().cashbackPct, 1).replace(",0", "")}%)</span><b>+ ${U.money(p.earn)}</b></div>
            <div class="ln"><span>Saldo depois</span><b>${U.money(p.newBalance)}</b></div>`;
          const showErr = a > 0 || r > 0;
          right.querySelector("#pos-err").textContent = showErr && p.errors.length ? p.errors[0] : "";
          right.querySelector("#pos-go").disabled = !!p.errors.length;
        };
        amt.oninput = () => { pos.amount = amt.value; if (pos.redeemOn && !pos.redeemTouched) { pos.redeem = U.num(Math.min(s.balance, U.parseMoney(pos.amount)), 2); red.value = pos.redeem; } calc(); };
        amt.onkeydown = (e) => { if (e.key === "Enter") right.querySelector("#pos-go").click(); };
        if (ron) ron.onchange = () => { pos.redeemOn = ron.checked; pos.redeemTouched = false; rwrap.hidden = !ron.checked; if (ron.checked) { const a = U.parseMoney(pos.amount); pos.redeem = a > 0 ? U.num(Math.min(s.balance, a), 2) : ""; red.value = pos.redeem; } calc(); };
        red.oninput = () => { pos.redeem = red.value; pos.redeemTouched = true; calc(); };
        right.querySelector("#pos-date").onchange = (e) => (pos.date = e.target.value || U.today());
        right.querySelector("#pos-note").oninput = (e) => (pos.note = e.target.value);
        calc();
        if (window.innerWidth > 900) setTimeout(() => amt.focus(), 30);
      };

      const renderDone = () => {
        const { v, c } = pos.done; const s = JR.stats.get(c.id);
        const msg = JR.msg("venda", c, { ganho: U.money(v.earn) });
        right.innerHTML = `
          <div class="panel-h"><span class="step-n">${I("check")}</span><h2>Venda lançada</h2></div>
          <div class="stack" style="gap:16px">
            <div class="ticket">
              <span class="stamp">${v.redeem > 0 ? "RESGATE" : "PAGO"}</span>
              <div class="body">
                <div class="ro">Rock on!</div>
                <div class="t-name">${U.esc(c.name)}</div>
                <div class="t-row"><span>Consumo <b>${U.money(v.amount)}</b></span>${v.redeem > 0 ? `<span>Resgate <b>${U.money(v.redeem)}</b></span>` : ""}<span>Ganhou <b>+${U.money(v.earn)}</b></span></div>
                <div class="t-row"><span>${U.date(v.date)}</span><span>Visita nº ${s.visits}</span><span>${JR.TIERS[s.tier].label}</span></div>
                <div class="barcode"></div>
              </div>
              <div class="stub"><span class="eyebrow">Saldo</span><span class="big">${U.money(s.balance)}</span><span class="eyebrow">cashback</span></div>
            </div>
            <div class="grid g-2" style="gap:10px">
              <a class="btn wa xl block" href="${U.wa(c.phone, msg)}" target="_blank" rel="noopener" data-act="wa-sale">${I("wa")}Enviar no WhatsApp</a>
              <button class="btn red xl block" data-act="again" autofocus>${I("plus")}Próxima venda</button>
            </div>
            <div class="row"><button class="btn sm ghost" data-act="open" data-id="${c.id}">${I("users")}Ver ficha do cliente</button><button class="btn sm ghost" data-act="undo-last">${I("undo")}Estornar esta venda</button></div>
            <p class="dim xs">O WhatsApp abre com a mensagem pronta. Confira e toque em enviar por lá.</p>
          </div>`;
      };

      renderLeft(); renderRight();

      el.onclick = async (e) => {
        const a = e.target.closest("[data-act]"); if (!a) return;
        const act = a.dataset.act;
        if (act === "pick") { JR.posSelect(a.dataset.id); pos.q = ""; renderLeft(); renderRight(); if (window.innerWidth <= 1100) right.scrollIntoView({ behavior: "smooth", block: "start" }); }
        if (act === "clear") { JR.posSelect(null); renderRight(); renderLeft(); }
        if (act === "new") JR.customerForm(null, { preset: pos.q, onSave: (c) => { JR.posSelect(c.id); pos.q = ""; renderLeft(); renderRight(); } });
        if (act === "go") {
          try {
            const v = JR.registerVisit({ cid: pos.cid, amount: U.parseMoney(pos.amount), redeem: pos.redeemOn ? U.parseMoney(pos.redeem) : 0, date: pos.date, note: pos.note });
            pos.done = { v, c: JR.byId.get(pos.cid) };
            renderRight(); renderLeft(); JR.updateBadges();
          } catch (err) { JR.toast(err.message, { err: true }); }
        }
        if (act === "again") { JR.posSelect(null); pos.date = ""; renderLeft(); renderRight(); left.scrollIntoView({ behavior: "smooth", block: "start" }); }
        if (act === "open") JR.openCustomer(a.dataset.id);
        if (act === "undo-last" && pos.done) {
          const ok = await JR.confirm({ title: "Estornar esta venda?", text: "A venda e o cashback gerado nela saem do histórico do cliente.", ok: "Estornar", danger: true });
          if (!ok) return;
          const cid = pos.done.c.id; JR.deleteVisit(pos.done.v.id); JR.posSelect(cid); renderRight(); renderLeft(); JR.toast("Venda estornada. A comanda continua aberta.");
        }
      };
    },
  };

  /* ================================================================ CLIENTES */
  const cl = { q: "", f: "todos", sort: "recente", limit: 60 };
  const FILTERS = [
    ["todos", "Todos", () => true],
    ["ativo", "Ativos", (c, s) => s.status === "ativo"],
    ["morno", "Mornos", (c, s) => s.status === "morno"],
    ["afastado", "Afastados", (c, s) => s.status === "afastado"],
    ["sumido", "Sumidos", (c, s) => s.status === "sumido"],
    ["lenda", "Lendas 6x+", (c, s) => s.tier === "lenda"],
    ["saldo", "Com saldo", (c, s) => s.balance >= 1],
    ["niver", "Niver no mês", (c) => c.birth && c.birth.m === new Date().getMonth() + 1],
  ];
  const SORTS = { recente: ["Última visita", (a, b) => (b[1].last || "").localeCompare(a[1].last || "")], saldo: ["Maior saldo", (a, b) => b[1].balance - a[1].balance], consumo: ["Maior consumo", (a, b) => b[1].spend - a[1].spend], visitas: ["Mais visitas", (a, b) => b[1].visits - a[1].visits], nome: ["Nome (A–Z)", (a, b) => a[0].name.localeCompare(b[0].name, "pt-BR")], novos: ["Cadastro recente", (a, b) => (b[0].createdAt || "").localeCompare(a[0].createdAt || "")] };

  JR.views.clientes = {
    title: "Clientes", sub: "a banda inteira",
    render(el, params) {
      if (params && params[0]) { cl.f = params[0]; }
      const snap = JR.baseSnapshot();
      el.innerHTML = `
        ${JR.art.banner({ photo: "amp-grade.jpg", kicker: "A banda inteira", title: "Clientes", text: "Cada cliente é um fã. Aqui fica quem veio, quanto consumiu e quanto cashback tem para usar.", pos: "center 40%",
          aside: `<div class="bstat"><b>${U.num(snap.total)}</b><span>na banda</span></div><div class="bstat"><b>${U.num(snap.status.ativo)}</b><span>no palco</span></div><div class="bstat"><b>${U.num(snap.tiers.lenda)}</b><span>lendas</span></div>` })}
        <div class="row" style="gap:12px">
          <div class="search" style="flex:1 1 280px">${I("search")}<input id="cl-q" class="input" placeholder="Buscar por nome ou telefone" value="${U.esc(cl.q)}" autocomplete="off"></div>
          <select id="cl-sort" class="input" style="width:auto;flex:0 0 auto" aria-label="Ordenar">${Object.entries(SORTS).map(([k, [l]]) => `<option value="${k}" ${cl.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select>
          <button class="btn red" data-act="new">${I("plus")}Novo cliente</button>
        </div>
        <div class="chips" id="cl-chips"></div>
        <div class="panel" style="padding:8px 10px"><div id="cl-list" class="list"></div></div>`;
      const draw = () => {
        const base = JR.state.customers.map((c) => [c, JR.stats.get(c.id)]);
        const counts = FILTERS.map(([k, , fn]) => base.filter(([c, s]) => fn(c, s)).length);
        el.querySelector("#cl-chips").innerHTML = FILTERS.map(([k, l], i) => `<button class="chip ${cl.f === k ? "on" : ""}" data-f="${k}">${l} <span class="n">${U.num(counts[i])}</span></button>`).join("");
        const fn = (FILTERS.find((f) => f[0] === cl.f) || FILTERS[0])[2];
        let rows = base.filter(([c, s]) => fn(c, s));
        if (cl.q.trim()) { const ids = new Set(JR.search(cl.q, 100000).map((c) => c.id)); rows = rows.filter(([c]) => ids.has(c.id)); }
        rows.sort(SORTS[cl.sort][1]);
        const list = el.querySelector("#cl-list");
        list.innerHTML = rows.length
          ? rows.slice(0, cl.limit).map(([c]) => custRow(c)).join("") + (rows.length > cl.limit ? `<div style="padding:12px;text-align:center"><button class="btn" data-act="more">Mostrar mais (${U.num(rows.length - cl.limit)} restantes)</button></div>` : `<p class="dim xs" style="padding:10px 8px">${U.num(rows.length)} cliente${rows.length === 1 ? "" : "s"}</p>`)
          : JR.art.empty("amp", "Ninguém aqui", `Nenhum cliente nesse filtro${cl.q ? " com “" + U.esc(cl.q) + "”" : ""}.`);
      };
      draw();
      const q = el.querySelector("#cl-q");
      q.oninput = U.debounce(() => { cl.q = q.value; cl.limit = 60; draw(); }, 120);
      el.querySelector("#cl-sort").onchange = (e) => { cl.sort = e.target.value; draw(); };
      el.onclick = (e) => {
        const f = e.target.closest("[data-f]"); if (f) { cl.f = f.dataset.f; cl.limit = 60; draw(); return; }
        const a = e.target.closest("[data-act]"); if (!a) return;
        if (a.dataset.act === "open") JR.openCustomer(a.dataset.id);
        if (a.dataset.act === "more") { cl.limit += 120; draw(); }
        if (a.dataset.act === "new") JR.customerForm(null, { onSave: (c) => { draw(); JR.openCustomer(c.id); } });
      };
      el.onkeydown = (e) => { if (e.key === "Enter") { const a = e.target.closest("[data-act=open]"); if (a) JR.openCustomer(a.dataset.id); } };
    },
  };

  /* ================================================================ PERFIL DO CLIENTE */
  JR.openCustomer = function (id) {
    const c0 = JR.byId.get(id); if (!c0) return;
    const d = JR.drawer({ title: "Ficha do cliente", body: "", foot: "", onClose: () => JR.refresh(true) });
    const draw = () => {
      const c = JR.byId.get(id); if (!c) { d.close(); return; }
      const s = JR.stats.get(id);
      const vs = (JR.vByC.get(id) || []).slice().reverse();
      const age = U.age(c.birth);
      const t = JR.TIERS[s.tier];
      const toNext = t.next ? t.next - s.visits : 0;
      const books = JR.state.books.filter((b) => b.loan && b.loan.cid === id);
      const lastC = JR.lastContact(id);
      d.set(`
        <div class="pass ${s.tier}"><div class="pass-top"><span class="hole"></span><span>${s.tier === "lenda" ? "All access" : s.tier === "fa" ? "Backstage" : "Fã-clube"}</span><span class="no">Jhow Rock Café</span></div>
        <div class="prof-h">${JR.pick(c.name, "big " + (s.tier === "lenda" ? "lenda" : JR.STATUS[s.status].cls))}
          <div style="min-width:0"><div class="nm">${U.esc(c.name)}</div><div class="row mt">${JR.statusPill(s.status)}${s.visits ? JR.tierBadge(s.tier) : ""}<span class="dim small">cliente desde ${U.date(s.first)}</span></div></div></div></div>
        <div class="row">
          <a class="btn red" href="#caixa/${id}" data-act="sell">${I("ticket")}Lançar venda</a>
          ${c.phone ? `<a class="btn wa" href="${U.wa(c.phone, "Oi, " + U.firstName(c.name) + "! Aqui é do Jhow Rock Café 🤘")}" target="_blank" rel="noopener" data-act="wa">${I("wa")}WhatsApp</a>` : ""}
          <button class="btn" data-act="edit">${I("edit")}Editar</button>
        </div>
        <div class="grid g-2" style="gap:10px">
          <div class="tile hot"><div class="k">${I("bolt")}Saldo cashback</div><div class="v">${U.money(s.balance)}</div><div class="d">ganhou ${U.money(s.earned)} · usou ${U.money(s.redeemed)}</div></div>
          <div class="tile"><div class="k">${I("coin")}Consumo total</div><div class="v">${U.money(s.spend)}</div><div class="d">ticket médio ${U.money(s.ticket)}</div></div>
        </div>
        <div class="stack" style="gap:8px">
          <div class="row" style="justify-content:space-between"><span class="eyebrow">Volume de fã · ${s.visits} visita${s.visits === 1 ? "" : "s"}</span><span class="dim xs">${t.next ? `faltam ${toNext} para ${JR.TIERS[JR.tier(t.next)].label}` : "nível máximo — lenda da casa"}</span></div>
          ${JR.leds(s.visits)}
        </div>
        <div class="kv">
          <div><div class="k">Telefone</div><div class="v copy">${U.phoneFmt(c.phone)} ${c.phone ? `<button data-act="copy" data-v="${U.esc(U.phoneFmt(c.phone))}" aria-label="Copiar telefone">${I("copy")}</button>` : ""}</div></div>
          <div><div class="k">Aniversário</div><div class="v">${c.birth && c.birth.d ? String(c.birth.d).padStart(2, "0") + "/" + String(c.birth.m).padStart(2, "0") + (age != null ? " · " + age + " anos" : "") : "—"}</div></div>
          <div><div class="k">Profissão</div><div class="v">${U.esc(c.profession || "—")}${c.area ? `<div class="dim xs">${U.esc(c.area)}</div>` : ""}</div></div>
          <div><div class="k">Última visita</div><div class="v">${s.last ? U.date(s.last) + ` <span class="dim xs">(${s.since === 0 ? "hoje" : "há " + s.since + " dias"})</span>` : "—"}</div></div>
          <div><div class="k">Sexo</div><div class="v">${c.gender === "f" ? "Feminino" : c.gender === "m" ? "Masculino" : c.gender === "o" ? "Outro" : "—"}</div></div>
          <div><div class="k">Último contato</div><div class="v">${lastC ? U.date(lastC.date) + ` <span class="dim xs">(${lastC.kind})</span>` : "—"}</div></div>
        </div>
        <div class="field"><label for="cf-notes">Anotações sobre o cliente</label><textarea id="cf-notes" class="input" placeholder="Preferências, quem indicou, banda favorita…">${U.esc(c.notes || "")}</textarea><span class="help">Salva sozinho ao sair do campo.</span></div>
        ${books.length ? `<div><div class="eyebrow" style="margin-bottom:6px">Livros com ${U.esc(U.firstName(c.name))}</div><div class="list">${books.map((b) => `<div class="li"><div class="main-t"><div class="name">${U.esc(U.titleCase(b.title))}</div><div class="meta">desde ${U.date(b.loan.date)}</div></div>${JR.bookStatus(b) === "atrasado" ? '<span class="pill bad">Atrasado</span>' : '<span class="pill line">No prazo</span>'}</div>`).join("")}</div></div>` : ""}
        <div class="tl">
          <div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="eyebrow">Histórico · ${vs.length} lançamento${vs.length === 1 ? "" : "s"}</span>${c.legacy && c.legacy.extraVisits ? `<span class="dim xs">+${c.legacy.extraVisits} visitas antigas só contadas na planilha</span>` : ""}</div>
          ${vs.length ? `<div class="list">${vs.slice(0, 40).map((v) => `<div class="li"><span class="ic ${v.redeem > 0 ? "r" : ""}">${I(v.redeem > 0 ? "bolt" : "ticket")}</span><div class="main-t"><div class="name">${v.redeem > 0 ? "Resgate de " + U.money(v.redeem) : "Compra"}</div><div class="meta"><span>${U.date(v.date)}</span>${v.earn ? `<span>+${U.money(v.earn)} cashback</span>` : ""}${v.note ? `<span>${U.esc(v.note)}</span>` : ""}</div></div><div class="val num">${U.money(v.amount)}</div><button class="icon-btn danger" data-act="undo" data-vid="${v.id}" aria-label="Estornar" data-tip="Estornar lançamento">${I("trash")}</button></div>`).join("")}</div>${vs.length > 40 ? `<p class="dim xs mt">Mostrando os 40 mais recentes.</p>` : ""}` : `<div class="empty">Ainda sem compras. <a class="btn sm red" href="#caixa/${id}" data-act="sell">Lançar a primeira</a></div>`}
        </div>
        <hr class="divider">
        <div class="row" style="justify-content:space-between"><span class="dim xs">ID ${U.esc(c.id)}</span><button class="btn sm danger" data-act="del">${I("trash")}Excluir cliente</button></div>`);
      const notes = d.body.querySelector("#cf-notes");
      notes.onblur = () => { if (notes.value !== (c.notes || "")) { JR.updateCustomer(id, { notes: notes.value }); JR.toast("Anotação salva."); } };
    };
    draw();
    d.body.onclick = async (e) => {
      const a = e.target.closest("[data-act]"); if (!a) return;
      const act = a.dataset.act;
      if (act === "sell") { JR.posSelect(id); d.close(); }
      if (act === "wa") JR.logContact(id, "conversa");
      if (act === "copy") JR.copy(a.dataset.v);
      if (act === "edit") JR.customerForm(id, { onSave: draw });
      if (act === "undo") {
        const v = JR.state.visits.find((x) => x.id === a.dataset.vid); if (!v) return;
        const ok = await JR.confirm({ title: "Estornar lançamento?", text: `${v.redeem > 0 ? "Resgate" : "Compra"} de ${U.money(v.amount)} em ${U.date(v.date)}. O saldo de cashback é recalculado.`, ok: "Estornar", danger: true });
        if (!ok) return;
        const del = JR.deleteVisit(v.id); draw();
        JR.toast("Lançamento estornado.", { undo: () => { JR.restoreVisit(del); draw(); } });
      }
      if (act === "del") {
        const c = JR.byId.get(id);
        const ok = await JR.confirm({ title: "Excluir cliente?", text: `Apaga ${U.esc(c.name)} e todo o histórico de compras e cashback. Não dá para desfazer.`, ok: "Excluir para sempre", danger: true });
        if (!ok) return;
        JR.deleteCustomer(id); d.close(); JR.toast("Cliente excluído.");
      }
    };
  };

  /* ================================================================ CADASTRO / EDIÇÃO */
  JR.customerForm = function (id, { onSave, preset } = {}) {
    const c = id ? JR.byId.get(id) : null;
    const isPhone = preset && /^\d[\d\s()-]*$/.test(preset.trim());
    const v = c ? Object.assign({}, c) : { name: isPhone ? "" : preset || "", phone: isPhone ? preset : "", gender: "", birth: null, profession: "", area: "", notes: "" };
    const b = v.birth || {};
    const d = JR.drawer({
      title: c ? "Editar cliente" : "Novo cliente na banda",
      body: `
        <form id="cform" class="form-grid" novalidate>
          <div class="field full"><label for="f-name">Nome completo *</label><input id="f-name" class="input" value="${U.esc(v.name)}" autocomplete="off" autofocus required></div>
          <div class="field"><label for="f-phone">WhatsApp</label><input id="f-phone" class="input" inputmode="tel" placeholder="(31) 9 9999-9999" value="${U.esc(v.phone ? U.phoneFmt(v.phone) : "")}"><span class="help" id="f-dup"></span></div>
          <div class="field"><label for="f-gender">Sexo</label><select id="f-gender" class="input"><option value="">—</option><option value="f" ${v.gender === "f" ? "selected" : ""}>Feminino</option><option value="m" ${v.gender === "m" ? "selected" : ""}>Masculino</option><option value="o" ${v.gender === "o" ? "selected" : ""}>Outro</option></select></div>
          <div class="field full"><span class="label">Aniversário</span><div class="trio">
            <input id="f-bd" class="input" inputmode="numeric" placeholder="Dia" aria-label="Dia" value="${b.d || ""}">
            <select id="f-bm" class="input" aria-label="Mês"><option value="">Mês</option>${U.MONTHS_L.map((m, i) => `<option value="${i + 1}" ${b.m === i + 1 ? "selected" : ""}>${m}</option>`).join("")}</select>
            <input id="f-by" class="input" inputmode="numeric" placeholder="Ano (opcional)" aria-label="Ano" value="${b.y || ""}"></div><span class="help">Usado para os parabéns e o voucher do mês do aniversário.</span></div>
          <div class="field"><label for="f-prof">Profissão</label><input id="f-prof" class="input" placeholder="ex.: professora" value="${U.esc(v.profession)}"></div>
          <div class="field"><label for="f-area">Área</label><select id="f-area" class="input"><option value="">—</option>${JR.AREAS.map((a) => `<option ${v.area === a ? "selected" : ""}>${a}</option>`).join("")}${v.area && !JR.AREAS.includes(v.area) ? `<option selected>${U.esc(v.area)}</option>` : ""}</select></div>
          <div class="field full"><label for="f-notes">Anotações</label><textarea id="f-notes" class="input" placeholder="Preferências, como conheceu o café…">${U.esc(v.notes)}</textarea></div>
          <p class="dim xs full">Dados pessoais ficam guardados neste navegador e servem só para o programa de cashback e relacionamento (LGPD).</p>
        </form>`,
      foot: `<button class="btn ghost" data-x2>Cancelar</button><button class="btn red" id="f-save">${I("check")}${c ? "Salvar" : "Cadastrar"}</button>`,
    });
    const $ = (s) => d.el.querySelector(s);
    $("[data-x2]").onclick = d.close;
    const phone = $("#f-phone");
    phone.oninput = () => {
      const dup = JR.findDupPhone(phone.value, id);
      $("#f-dup").innerHTML = dup ? `Esse telefone já é de <a href="#" data-dup="${dup.id}">${U.esc(dup.name)}</a>.` : "";
    };
    phone.oninput();
    d.el.addEventListener("click", (e) => { const a = e.target.closest("[data-dup]"); if (a) { e.preventDefault(); d.close(); JR.openCustomer(a.dataset.dup); } });
    const save = () => {
      const name = $("#f-name").value.trim();
      if (name.length < 2) { $("#f-name").classList.add("err"); $("#f-name").focus(); JR.toast("Informe o nome do cliente.", { err: true }); return; }
      const bd = parseInt($("#f-bd").value, 10), bm = parseInt($("#f-bm").value, 10), by = parseInt($("#f-by").value, 10);
      if ($("#f-bd").value && !(bd >= 1 && bd <= 31)) { $("#f-bd").classList.add("err"); JR.toast("Dia do aniversário inválido.", { err: true }); return; }
      if ($("#f-by").value && !(by > 1900 && by <= new Date().getFullYear())) { $("#f-by").classList.add("err"); JR.toast("Ano de nascimento inválido.", { err: true }); return; }
      const data = { name, phone: phone.value, gender: $("#f-gender").value, birth: bd && bm ? { d: bd, m: bm, y: by || null } : null, profession: $("#f-prof").value.trim(), area: $("#f-area").value, notes: $("#f-notes").value };
      let saved;
      if (c) { saved = JR.updateCustomer(id, data); JR.toast("Cadastro atualizado."); }
      else { saved = JR.addCustomer(data); JR.toast(`${U.esc(U.firstName(saved.name))} entrou pra banda! 🤘`); }
      d.close(); onSave && onSave(saved); JR.updateBadges();
    };
    $("#f-save").onclick = save;
    $("#cform").onsubmit = (e) => { e.preventDefault(); save(); };
  };
})();
