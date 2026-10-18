/* =====================================================================
   Componentes de interface: gaveta, modal, toast, tooltip, gráficos
   ===================================================================== */
(function () {
  const JR = window.JR, U = JR.u;

  /* ---------------------------------------------------------- gaveta lateral */
  const stack = [];
  JR.drawer = function ({ title, body, foot, onMount, onClose, wide }) {
    const root = document.getElementById("overlay");
    const scrim = document.createElement("div"); scrim.className = "scrim";
    const el = document.createElement("aside"); el.className = "drawer"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    if (wide) el.style.width = "min(760px, 100%)";
    el.innerHTML = `<div class="drawer-h"><h3>${title}</h3><button class="icon-btn" data-x aria-label="Fechar">${JR.icon("x")}</button></div><div class="drawer-b">${body || ""}</div>${foot ? `<div class="drawer-f">${foot}</div>` : ""}`;
    root.append(scrim, el);
    const api = {
      el,
      body: el.querySelector(".drawer-b"),
      set(html) { api.body.innerHTML = html; },
      setFoot(html) { const f = el.querySelector(".drawer-f"); if (f) f.innerHTML = html; },
      close() { if (!el.isConnected) return; el.remove(); scrim.remove(); const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1); onClose && onClose(); },
    };
    scrim.onclick = api.close;
    el.querySelector("[data-x]").onclick = api.close;
    stack.push(api);
    onMount && onMount(api);
    const first = el.querySelector("[autofocus]"); if (first) setTimeout(() => first.focus(), 60);
    return api;
  };
  JR.closeAllDrawers = () => { while (stack.length) stack[stack.length - 1].close(); };

  /* ---------------------------------------------------------- modal / confirmação */
  JR.modal = function ({ title, body, acts }) {
    return new Promise((resolve) => {
      const root = document.getElementById("overlay");
      const scrim = document.createElement("div"); scrim.className = "scrim"; scrim.style.zIndex = 110;
      const el = document.createElement("div"); el.className = "modal"; el.setAttribute("role", "alertdialog"); el.setAttribute("aria-modal", "true");
      el.innerHTML = `<h3>${title}</h3><div class="stack">${body || ""}</div><div class="acts">${(acts || []).map((a, i) => `<button class="btn ${a.cls || ""}" data-i="${i}">${a.label}</button>`).join("")}</div>`;
      root.append(scrim, el);
      const done = (v) => { el.remove(); scrim.remove(); document.removeEventListener("keydown", esc, true); resolve(v); };
      const esc = (e) => { if (e.key === "Escape") { e.stopPropagation(); done(null); } };
      document.addEventListener("keydown", esc, true);
      scrim.onclick = () => done(null);
      el.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => done(acts[+b.dataset.i].value)));
      const pri = el.querySelector(".btn.red, .btn.danger"); (pri || el.querySelector(".btn")).focus();
    });
  };
  JR.confirm = ({ title, text, ok, danger }) => JR.modal({ title, body: `<p class="muted">${text}</p>`, acts: [{ label: "Cancelar", cls: "ghost", value: false }, { label: ok || "Confirmar", cls: danger ? "danger" : "red", value: true }] }).then((v) => !!v);

  /* ---------------------------------------------------------- toasts */
  JR.toast = function (text, opts = {}) {
    const root = document.getElementById("toasts");
    const el = document.createElement("div"); el.className = "toast" + (opts.err ? " err" : ""); el.setAttribute("role", "status");
    el.innerHTML = `<span class="t">${text}</span>${opts.undo ? `<button>Desfazer</button>` : ""}`;
    root.append(el);
    const kill = () => el.remove();
    if (opts.undo) el.querySelector("button").onclick = () => { opts.undo(); kill(); };
    setTimeout(kill, opts.ms || (opts.undo ? 6500 : 3200));
  };

  /* ---------------------------------------------------------- copiar */
  JR.copy = async function (text, btn) {
    try { await navigator.clipboard.writeText(text); JR.toast("Copiado: " + U.esc(text)); }
    catch (e) {
      const t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      t.remove(); JR.toast(ok ? "Copiado: " + U.esc(text) : "Selecione e copie manualmente: " + U.esc(text), { err: !ok });
    }
  };

  /* ---------------------------------------------------------- tooltip */
  JR.initTips = function () {
    const tip = document.getElementById("tip");
    let cur = null, hideT;
    const show = (t, x, y) => {
      const html = t.getAttribute("data-tip"); if (!html) return;
      tip.innerHTML = html; tip.classList.add("show");
      const r = tip.getBoundingClientRect();
      let left = x + 14, top = y - r.height - 12;
      if (left + r.width > window.innerWidth - 8) left = x - r.width - 14;
      if (top < 8) top = y + 18;
      tip.style.left = Math.max(8, left) + "px"; tip.style.top = top + "px";
    };
    document.addEventListener("mouseover", (e) => { const t = e.target.closest("[data-tip]"); if (t !== cur) { cur = t; if (!t) tip.classList.remove("show"); } });
    document.addEventListener("mousemove", (e) => { if (cur) show(cur, e.clientX, e.clientY); });
    document.addEventListener("touchstart", (e) => {
      const t = e.target.closest("[data-tip]"); if (!t) { tip.classList.remove("show"); return; }
      const p = e.touches[0]; show(t, p.clientX, p.clientY); clearTimeout(hideT); hideT = setTimeout(() => tip.classList.remove("show"), 1800);
    }, { passive: true });
    document.addEventListener("scroll", () => tip.classList.remove("show"), { passive: true, capture: true });
  };

  /* ---------------------------------------------------------- gráficos (HTML/CSS, responsivos) */
  // barras verticais: destaca a última (período atual) e rotula só ela e o pico
  JR.vbars = function (data, { fmt = (v) => U.num(v), height = 180, hi = "last" } = {}) {
    if (!data.length) return `<div class="empty">Sem dados no período.</div>`;
    const max = Math.max(1, ...data.map((d) => d.value));
    const peak = data.reduce((b, d, i) => (d.value > data[b].value ? i : b), 0);
    const step = niceStep(max);
    const top = Math.ceil(max / step) * step;
    const ticks = []; for (let v = 0; v <= top; v += step) ticks.push(v);
    const lines = ticks.map((v) => `<div class="vtick" style="bottom:${(v / top) * 100}%"><span>${fmt(v, true)}</span></div>`).join("");
    const bars = data.map((d, i) => {
      const isHi = hi === "last" ? i === data.length - 1 : false;
      const showV = i === data.length - 1 || i === peak;
      return `<div class="vbar${isHi ? " hi" : ""}" data-tip="<b>${U.esc(d.tipLabel || d.label)}</b>${U.esc(fmt(d.value))}${d.tipExtra ? "<br>" + U.esc(d.tipExtra) : ""}"><i style="height:${(d.value / top) * 100}%">${showV ? `<em>${U.esc(fmt(d.value, true))}</em>` : ""}</i></div>`;
    }).join("");
    const labels = data.map((d, i) => `<span>${data.length > 14 && i % 2 ? "" : U.esc(d.label)}</span>`).join("");
    return `<div class="vchart" style="--h:${height}px"><div class="vplot">${lines}<div class="vbars">${bars}</div></div><div class="vx">${labels}</div></div>`;
  };
  function niceStep(max) { const raw = max / 4; const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }

  // barras horizontais com rótulo e valor
  JR.hbars = function (rows, { fmt = (v) => U.num(v), total, red } = {}) {
    if (!rows.length) return `<div class="empty">Sem dados.</div>`;
    const max = Math.max(1, ...rows.map((r) => r.value));
    return `<div class="hbars">${rows.map((r) => `<div class="hbar" data-tip="<b>${U.esc(r.label)}</b>${U.esc(fmt(r.value))}${total ? " · " + U.pct(r.value / total) : ""}"><span class="lbl">${U.esc(r.label)}</span><span class="trk"><span class="fill${red && red(r) ? " red" : ""}" style="width:${(r.value / max) * 100}%;${r.color ? "background:" + r.color : ""}"></span></span><span class="n">${fmt(r.value)}</span></div>`).join("")}</div>`;
  };

  // barra empilhada (partes de um todo) com legenda — status da base
  JR.stackbar = function (parts) {
    const total = U.sum(parts, (p) => p.value) || 1;
    return `<div class="stackbar">${parts.filter((p) => p.value > 0).map((p) => `<div style="flex:${p.value};background:${p.color}" data-tip="<b>${U.esc(p.label)}</b>${U.num(p.value)} · ${U.pct(p.value / total)}"></div>`).join("")}</div>
      <div class="legend mt">${parts.map((p) => `<span><i style="background:${p.color}"></i>${U.esc(p.label)} <b>${U.num(p.value)}</b> <span class="dim">${U.pct(p.value / total, 0)}</span></span>`).join("")}</div>`;
  };

  // LED de nível de fã
  JR.leds = function (visits) {
    const n = Math.min(10, visits);
    let h = ""; for (let i = 1; i <= 10; i++) h += `<i class="${i <= n ? "on" + (i > 8 ? " r" : i > 5 ? " w" : "") : ""}"></i>`;
    return `<div class="leds" data-tip="<b>Volume de fã</b>${visits} visita${visits === 1 ? "" : "s"}">${h}</div>`;
  };
})();
