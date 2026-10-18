/* =====================================================================
   Shell: navegação, rotas por #hash, badges e inicialização
   ===================================================================== */
(function () {
  const JR = window.JR, U = JR.u, I = JR.icon;

  const NAV = [
    { id: "caixa", label: "Nova venda", icon: "coffee", cta: true },
    { group: "Operação" },
    { id: "palco", label: "Palco", icon: "amp" },
    { id: "clientes", label: "Clientes", icon: "users" },
    { id: "fas", label: "Fã-clube", icon: "heart", badge: () => JR.birthdays("hoje").length },
    { id: "biblioteca", label: "Biblioteca", icon: "book", badge: () => JR.state.books.filter((b) => JR.bookStatus(b) === "atrasado").length },
    { group: "Gestão" },
    { id: "numeros", label: "Números", icon: "chart" },
    { id: "campanhas", label: "Campanhas", icon: "mega" },
    { id: "ajustes", label: "Ajustes", icon: "knob" },
  ];
  const MORE = ["numeros", "campanhas", "biblioteca", "ajustes"];

  let current = "caixa", params = [];
  // rota interna: a navegação não depende de clicar em links, então nada abre em outra aba
  const fromHash = () => { try { return decodeURIComponent((location.hash || "").replace(/^#/, "")); } catch (e) { return ""; } };
  let route = fromHash() || "caixa"; // abre no caixa: a mesma ação que o Jhow faz na planilha
  const parse = () => { const [v, ...p] = route.split("/"); return { v: JR.views[v] ? v : "caixa", p }; };
  const syncUrl = (r, replace) => { try { history[replace ? "replaceState" : "pushState"](null, "", "#" + r); } catch (e) { /* visualizador pode bloquear: a rota interna segue valendo */ } };
  JR.setRoute = (r) => { route = r; syncUrl(r, true); };

  function shell() {
    document.getElementById("app").innerHTML = `
      <aside class="rail" aria-label="Menu">
        <a class="brand" href="#palco"><img class="brand-seal" src="assets/selo-dark.png" alt="Selo Jhow Rock Café"><span class="brand-name">Jhow<small>ROCK CAFÉ · BACKSTAGE</small></span></a>
        <nav class="nav" id="nav"></nav>
        <div class="rail-photo"><span>Café, rock<br>&amp; livros<small>Jhow Rock Café</small></span></div>
        <div class="rail-foot"><b>Atalhos</b><br><kbd>/</kbd> buscar cliente · <kbd>N</kbd> nova venda</div>
      </aside>
      <div class="main">
        <header class="topbar">
          <img class="mini-seal" src="assets/selo-dark.png" alt="">
          <h1 id="ttl"></h1>
          <span class="spacer"></span>
          <button class="demo-chip" id="demo-chip" hidden data-tip="Clientes fictícios. Importe a planilha em Ajustes.">Dados de exemplo</button>
          <button class="icon-btn" id="qs" aria-label="Buscar cliente" data-tip="Buscar cliente ( / )">${I("search")}</button>
        </header>
        <main id="view" class="view" tabindex="-1"></main>
      </div>
      <nav class="tabbar" id="tabbar" aria-label="Navegação"></nav>`;
    document.getElementById("qs").onclick = quickSearch;
    document.getElementById("demo-chip").onclick = () => JR.go("ajustes");
  }

  function drawNav() {
    document.getElementById("nav").innerHTML = NAV.map((n) => {
      if (n.group) return `<div class="nav-label">${n.group}</div>`;
      const b = n.badge ? n.badge() : 0;
      return `<a href="#${n.id}" class="${n.cta ? "cta" : ""} ${current === n.id && !n.cta ? "on" : ""}" ${current === n.id ? 'aria-current="page"' : ""}>${I(n.icon)}${n.label}${b ? `<span class="count">${b}</span>` : ""}</a>`;
    }).join("");
    const t = (id, label, icon) => `<a href="#${id}" class="${current === id ? "on" : ""}">${I(icon)}${label}</a>`;
    document.getElementById("tabbar").innerHTML = `${t("palco", "Palco", "amp")}${t("clientes", "Clientes", "users")}
      <a href="#caixa" class="pick-btn ${current === "caixa" ? "on" : ""}" aria-label="Nova venda"><span class="pk"><svg class="shape" viewBox="0 0 100 100" aria-hidden="true"><path d="${JR.PICK}"/></svg>${I("ticket", "ic")}</span>Caixa</a>
      ${t("fas", "Fã-clube", "heart")}<button class="${MORE.includes(current) ? "on" : ""}" id="more-btn">${I("menu")}Mais</button>`;
    document.getElementById("more-btn").onclick = moreMenu;
    document.getElementById("demo-chip").hidden = !JR.state.demo;
  }
  JR.updateBadges = drawNav;

  function moreMenu() {
    const d = JR.drawer({ title: "Mais", body: `<div class="list">${NAV.filter((n) => MORE.includes(n.id)).map((n) => { const b = n.badge ? n.badge() : 0; return `<a class="li click" href="#${n.id}" style="text-decoration:none">${I(n.icon)}<div class="main-t"><div class="name" style="font-family:var(--f-head);text-transform:uppercase;letter-spacing:.08em;font-size:1.1rem">${n.label}</div><div class="meta">${U.esc(JR.views[n.id].sub)}</div></div>${b ? `<span class="pill bad">${b}</span>` : ""}</a>`; }).join("")}</div>` });
    d.body.onclick = (e) => { if (e.target.closest("a")) d.close(); };
  }

  function quickSearch() {
    const d = JR.drawer({ title: "Buscar cliente", body: `<div class="search">${I("search")}<input id="qs-q" class="input" placeholder="Nome ou telefone" autofocus autocomplete="off"></div><div id="qs-r"></div>` });
    const q = d.el.querySelector("#qs-q"), r = d.el.querySelector("#qs-r");
    q.oninput = () => { const res = JR.search(q.value, 12); r.innerHTML = res.length ? `<div class="list">${res.map((c) => JR.custRow(c)).join("")}</div>` : q.value.trim() ? `<div class="empty">Ninguém encontrado.</div>` : ""; };
    q.onkeydown = (e) => { if (e.key === "Enter") { const f = r.querySelector("[data-act=open]"); if (f) f.click(); } };
    r.onclick = (e) => { const a = e.target.closest("[data-act=open]"); if (a) { d.close(); JR.openCustomer(a.dataset.id); } };
  }

  function render(keepScroll) {
    const { v, p } = parse();
    const changed = v !== current;
    current = v; params = p;
    const view = JR.views[v];
    document.getElementById("ttl").innerHTML = `${U.esc(view.title)} <span class="slash">/</span> <span class="sub">${U.esc(view.sub)}</span>`;
    document.title = view.title + " · Jhow Rock Café";
    const el = document.getElementById("view");
    const y = window.scrollY;
    el.onclick = null; el.onkeydown = null;
    try { view.render(el, params); }
    catch (err) { console.error(err); el.innerHTML = `<div class="panel"><div class="empty"><div class="big">Deu microfonia</div><p>${U.esc(err.message)}</p><a class="btn" href="#palco">Voltar ao palco</a></div></div>`; }
    drawNav();
    if (changed) window.scrollTo(0, 0); else if (keepScroll) window.scrollTo(0, y);
  }
  JR.refresh = (keep) => render(keep !== false);
  JR.go = (r) => { const same = r === route; route = r; if (!same) syncUrl(r); JR.closeAllDrawers(); render(false); };

  async function boot() {
    shell();
    try { await JR.load(); }
    catch (e) { console.error(e); JR.state = JR.seedDemo(); JR.reindex(); }
    JR.initTips();
    // qualquer link interno (#rota) vira navegação na mesma aba
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      e.preventDefault();
      const r = a.getAttribute("href").slice(1); if (r) JR.go(r);
    }, true);
    window.addEventListener("popstate", () => { route = fromHash() || "caixa"; JR.closeAllDrawers(); render(false); });
    window.addEventListener("hashchange", () => { const h = fromHash(); if (h && h !== route) { route = h; JR.closeAllDrawers(); render(false); } });
    // sem zoom por gesto: pinça no celular (iOS ignora user-scalable) e pinça do trackpad (ctrl + roda)
    ["gesturestart", "gesturechange"].forEach((t) => document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
    document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    document.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector(".drawer, .modal")) { if (e.key === "Escape") JR.closeAllDrawers(); return; }
      if (e.key === "/") { e.preventDefault(); quickSearch(); }
      if (e.key === "n" || e.key === "N") { e.preventDefault(); JR.go("caixa"); }
    });
    render(false);
    // mantém o painel atualizado quando o dia vira
    let day = U.today();
    setInterval(() => { if (U.today() !== day) { day = U.today(); JR.reindex(); render(true); } }, 60000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
