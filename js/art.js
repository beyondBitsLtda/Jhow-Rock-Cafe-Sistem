/* =====================================================================
   Arte do Jhow: ilustrações em traço (no estilo do selo), knob de
   amplificador, cordas de guitarra e banners com foto
   ===================================================================== */
(function () {
  const JR = window.JR, U = JR.u;
  let seq = 0;
  const A = (JR.art = {});

  // guitarra elétrica (vertical)
  A.guitar = (cls) => `<svg class="art ${cls || ""}" viewBox="0 0 120 300" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M53 44 49 14c-.5-6 3-10 10-11 7 0 11 4 11 10l-3 31z" fill="var(--art-fill)"/>
      <circle cx="47" cy="16" r="2.4"/><circle cx="46" cy="27" r="2.4"/><circle cx="73" cy="16" r="2.4"/><circle cx="74" cy="27" r="2.4"/>
      <rect x="53" y="44" width="14" height="128" fill="var(--art-fill)"/>
      <path d="M53 58h14M53 72h14M53 85h14M53 97h14M53 108h14M53 118h14M53 127h14M53 135h14M53 142h14M53 149h14" stroke-width="1.4"/>
      <path d="M60 172c-9-6-17-21-29-23-8-1-12 6-11 16 1 9 9 15 9 25 0 9-12 14-12 33 0 26 20 44 43 44s43-18 43-44c0-19-12-24-12-33 0-10 9-15 9-26 0-9-4-15-11-15-12 2-20 17-29 23z" fill="var(--art-fill)"/>
      <path d="M45 186c4-2 9-3 15-3s11 1 15 3l-2 54c-6 6-20 6-26 0z" stroke-width="1.6"/>
      <rect x="47" y="196" width="26" height="8" rx="3" fill="var(--art-ink)"/><rect x="47" y="214" width="26" height="8" rx="3" fill="var(--art-ink)"/>
      <rect x="45" y="246" width="30" height="7" rx="2" fill="var(--art-ink)"/>
      <circle cx="86" cy="238" r="5"/><circle cx="92" cy="254" r="5"/><circle cx="84" cy="268" r="4"/>
      <path d="M57 12v236M60 12v236M63 12v236" stroke-width=".8"/>
      <path d="M28 268c-10 6-14 14-10 22" stroke-width="1.6" stroke-dasharray="1 4"/>
    </g></svg>`;

  // amplificador valvulado com placa JHOW
  A.amp = (cls) => { const id = "g" + ++seq; return `<svg class="art ${cls || ""}" viewBox="0 0 220 170" aria-hidden="true">
    <defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6M3 0v6" stroke="currentColor" stroke-width=".9" opacity=".55"/></pattern></defs>
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">
      <path d="M82 16c0-8 56-8 56 0v8H82z"/>
      <rect x="8" y="24" width="204" height="138" rx="10" fill="var(--art-fill)"/>
      <rect x="18" y="34" width="184" height="30" rx="4" fill="var(--art-ink)" stroke-width="1.6"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${40 + i * 26}" cy="49" r="7.5" fill="var(--art-fill)" stroke-width="1.8"/><path d="M${40 + i * 26} 49l${[3, -4, 5, 0, -5, 4][i]} ${[-6, -5, -3, -7, -3, -5][i]}" stroke-width="1.8" stroke-linecap="round"/>`).join("")}
      <circle cx="190" cy="49" r="3.4" fill="var(--red)" stroke="none"/>
      <rect x="18" y="72" width="184" height="80" rx="4" fill="url(#${id})" stroke-width="1.6"/>
      <rect x="76" y="100" width="68" height="24" rx="4" fill="var(--art-fill)" stroke-width="1.6"/>
    </g>
    <text x="110" y="118" text-anchor="middle" fill="currentColor" style="font-family:var(--f-display);font-size:19px">Jhow</text></svg>`; };

  // xícara de café com vapor em forma de raio
  A.cup = (cls) => `<svg class="art ${cls || ""}" viewBox="0 0 140 130" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <path class="steam s1" d="M50 40c-6-7 6-12 0-20s6-12 0-18" stroke-width="2"/>
      <path class="steam s2" d="M74 42l-7-13h9l-6-14h8l-6-12" stroke="var(--red)" stroke-width="2.6"/>
      <path class="steam s3" d="M94 40c-6-7 6-12 0-20s6-12 0-18" stroke-width="2"/>
      <path d="M26 54h92v10c0 26-18 42-46 42S26 90 26 64z" fill="var(--art-fill)"/>
      <path d="M118 62c12 0 16 6 16 13s-6 14-20 15" stroke-width="2.6"/>
      <path d="M8 110c4 6 22 10 64 10s60-4 64-10c-4-5-20-6-30-6M38 104c-12 0-26 1-30 6" />
      <ellipse cx="72" cy="56" rx="44" ry="5" fill="var(--art-ink)" stroke-width="1.4"/>
      <path d="M52 76l6 8 6-8 6 8 6-8 6 8 6-8" stroke-width="1.6" opacity=".7"/>
    </g></svg>`;

  // disco de vinil
  A.vinyl = (cls) => `<svg class="art ${cls || ""}" viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="96" fill="var(--art-ink)" stroke="currentColor" stroke-width="2"/>
    ${[86, 78, 70, 62, 54, 46].map((r) => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="currentColor" stroke-width=".7" opacity=".45"/>`).join("")}
    <path d="M40 60a72 72 0 0 1 40-26" fill="none" stroke="currentColor" stroke-width="3" opacity=".35" stroke-linecap="round"/>
    <circle cx="100" cy="100" r="32" fill="var(--red)"/>
    <text x="100" y="96" text-anchor="middle" fill="#fff" style="font-family:var(--f-display);font-size:15px">Jhow</text>
    <text x="100" y="110" text-anchor="middle" fill="#fff" style="font-family:var(--f-head);font-weight:800;font-size:7px;letter-spacing:2px">ROCK CAFÉ</text>
    <circle cx="100" cy="100" r="3.5" fill="var(--bg)"/></svg>`;

  // knob de amplificador: valor de 0 a 11 (porque esse vai até 11)
  A.knob = (value, { label = "", max = 11, size = 132 } = {}) => {
    const v = Math.max(0, Math.min(max, value));
    const a0 = -135, a1 = 135, ang = a0 + (v / max) * (a1 - a0);
    const pt = (deg, r) => { const t = ((deg - 90) * Math.PI) / 180; return [(70 + r * Math.cos(t)).toFixed(1), (70 + r * Math.sin(t)).toFixed(1)]; };
    let ticks = "";
    for (let i = 0; i <= max; i++) {
      const d = a0 + (i / max) * (a1 - a0); const [x1, y1] = pt(d, 52); const [x2, y2] = pt(d, 58); const [tx, ty] = pt(d, 66);
      const lit = i <= Math.round(v);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lit ? (i >= 10 ? "var(--red)" : "var(--fg)") : "var(--line-2)"}" stroke-width="${i % 5 === 0 || i === 11 ? 2.4 : 1.4}"/>`;
      if (i % 2 === 0 || i === 11) ticks += `<text x="${tx}" y="${(+ty + 3).toFixed(1)}" text-anchor="middle" class="knob-n${i === 11 ? " eleven" : ""}">${i}</text>`;
    }
    const [px, py] = pt(ang, 34);
    return `<svg class="knob" viewBox="0 0 140 140" width="${size}" height="${size}" role="img" aria-label="${U.esc(label)}: ${U.num(v, 1)} de ${max}">
      ${ticks}
      <circle cx="70" cy="70" r="44" fill="var(--sunken)" stroke="var(--line-2)" stroke-width="2"/>
      <circle cx="70" cy="70" r="38" fill="var(--raised)" stroke="var(--line)" stroke-width="1"/>
      ${Array.from({ length: 24 }, (_, i) => { const [x1, y1] = pt(i * 15, 38); const [x2, y2] = pt(i * 15, 44); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line)" stroke-width="2"/>`; }).join("")}
      <line x1="70" y1="70" x2="${px}" y2="${py}" stroke="var(--fg)" stroke-width="4" stroke-linecap="round"/>
      <circle cx="70" cy="70" r="6" fill="var(--red)"/></svg>`;
  };

  // divisor: seis cordas, da mi grave à mi aguda
  A.strings = () => `<div class="strings" aria-hidden="true">${[2.4, 2, 1.6, 1.2, 1, .8].map((w) => `<i style="height:${w}px"></i>`).join("")}</div>`;

  // banner de página com foto duotone
  A.banner = ({ photo, kicker, title, text, aside, pos }) => `
    <section class="banner">
      <img class="banner-img" src="assets/fotos/${photo}" alt="" style="object-position:${pos || "center"}" decoding="async">
      <div class="banner-shade"></div>
      <div class="banner-in">
        ${kicker ? `<div class="banner-k">${kicker}</div>` : ""}
        <h2 class="banner-t">${title}</h2>
        ${text ? `<p class="banner-p">${text}</p>` : ""}
      </div>
      ${aside ? `<div class="banner-aside">${aside}</div>` : ""}
      ${A.strings()}
    </section>`;

  // estado vazio ilustrado
  A.empty = (art, title, text, action) => `<div class="empty art-empty">${A[art]("art-md")}<div class="big">${title}</div>${text ? `<p>${text}</p>` : ""}${action || ""}</div>`;

  A.CREDITS = [
    ["Guitarra Les Paul", "https://unsplash.com/photos/YStboKiFPVw"],
    ["Amplificador Marshall", "https://unsplash.com/photos/bPM4JhFJaus"],
    ["Painel de amplificador", "https://unsplash.com/photos/MfLGvcy9ooY"],
    ["Latte art", "https://unsplash.com/photos/h8okJrDFE1Y"],
    ["Toca-discos", "https://unsplash.com/photos/uFRUlkiSN9Q"],
    ["Violão", "https://unsplash.com/photos/jZLlUKhIxBM"],
    ["Guitarra (detalhe)", "https://unsplash.com/photos/eKgDq3Qqhi4"],
  ];
})();
