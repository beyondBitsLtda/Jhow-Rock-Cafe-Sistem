/* =====================================================================
   Dados de demonstração — clientes FICTÍCIOS, gerados com as mesmas
   distribuições da planilha real (ticket, frequência, sexo, idade,
   crescimento mensal). O acervo da biblioteca é o real (aba "Livro").
   ===================================================================== */
(function () {
  const JR = window.JR, U = JR.u;

  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const F = ["Ana", "Beatriz", "Camila", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena", "Isabela", "Juliana", "Karen", "Larissa", "Mariana", "Natália", "Patrícia", "Rafaela", "Sabrina", "Tatiane", "Vanessa", "Yasmin", "Aline", "Bruna", "Carolina", "Débora", "Elisa", "Flávia", "Giovana", "Ingrid", "Jéssica", "Kézia", "Letícia", "Luana", "Marina", "Nayara", "Priscila", "Renata", "Suelen", "Thaís", "Vitória", "Lorena", "Paloma", "Raquel", "Cássia", "Gleice", "Lívia", "Bianca", "Emilly", "Talita", "Simone", "Regina"];
  const M = ["André", "Bruno", "Caio", "Diego", "Eduardo", "Felipe", "Gustavo", "Henrique", "Igor", "João", "Kauã", "Lucas", "Marcelo", "Nicolas", "Otávio", "Pedro", "Rafael", "Samuel", "Thiago", "Vinícius", "Wesley", "Arthur", "Breno", "Davi", "Emanuel", "Fábio", "Gabriel", "Hugo", "Jonatas", "Leandro", "Matheus", "Rômulo", "Sérgio", "Túlio", "Victor"];
  const L = ["Silva", "Souza", "Oliveira", "Santos", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima", "Araújo", "Fernandes", "Carvalho", "Gomes", "Martins", "Rocha", "Ribeiro", "Alves", "Monteiro", "Mendes", "Barros", "Freitas", "Barbosa", "Pinto", "Moura", "Cavalcanti", "Dias", "Castro", "Campos", "Cardoso", "Teixeira", "Moreira", "Coelho", "Vieira", "Fonseca", "Duarte", "Batista", "Reis", "Prado", "Menezes"];
  const PROF = [["professora", "Educação"], ["professor", "Educação"], ["pedagoga", "Educação"], ["empreendedora", "Empreendedor(a)"], ["manicure", "Beleza"], ["cabeleireira", "Beleza"], ["advogada", "Direito"], ["advogado", "Direito"], ["enfermeira", "Saúde"], ["técnica de enfermagem", "Saúde"], ["vendedora", "Comércio & vendas"], ["vendedor", "Comércio & vendas"], ["analista administrativo", "Administração"], ["engenheiro civil", "Engenharia"], ["confeiteira", "Gastronomia"], ["motorista de app", "Logística & transporte"], ["desenvolvedor", "Tecnologia"], ["analista de sistemas", "Tecnologia"], ["contadora", "Contabilidade & finanças"], ["psicóloga", "Psicologia"], ["vigilante", "Segurança"], ["estudante de direito", "Estudante"], ["estudante", "Estudante"], ["social media", "Digital"], ["fotógrafa", "Arte & bem-estar"], ["professora de ioga", "Arte & bem-estar"], ["baterista", "Música"], ["guitarrista", "Música"], ["servidora pública", "Serviço público"], ["técnico de segurança do trabalho", "Técnico(a)"], ["operador de produção", "Operação"], ["biomédica", "Saúde"], ["veterinária", "Saúde"], ["fisioterapeuta", "Saúde"], ["gerente de loja", "Gestão"]];
  const NOTES = ["Pede sempre café coado e pão de queijo.", "Fã de Iron Maiden — puxar papo sobre a turnê.", "Vem com o grupo de ioga às quintas.", "Toca bateria numa banda cover de Queen.", "Prefere a mesa perto da estante de livros.", "Trabalha perto, vem no horário de almoço.", "Fez uma jornada pra conhecer a cafeteria na primeira compra.", "Intolerante a lactose — oferecer leite vegetal.", "Participa do clube do livro.", "Indicou várias amigas.", "Gosta do combo de terça.", "Comemorou aniversário aqui com os amigos.", "Sempre leva bolo de cenoura pra viagem.", "Mora no centro, vem a pé.", "Curte os discos de vinil da parede."];

  JR.seedDemo = function () {
    const r = rng(20231008);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const s = JR.emptyState();
    s.demo = true;
    const today = U.today();
    const start = "2023-10-08";
    const totalDays = U.days(start, today);

    // crescimento: mais cadastros nos meses recentes (como na planilha)
    const N = 680;
    const dayFor = () => { const x = Math.pow(r(), 0.62); return Math.min(totalDays, Math.floor(x * totalDays)); };
    const lognorm = (med, sd) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); return Math.exp(Math.log(med) + sd * z); };
    const visitsN = () => { const x = r(); return x < 0.54 ? 1 : x < 0.71 ? 2 : x < 0.79 ? 3 : x < 0.88 ? 4 + Math.floor(r() * 2) : x < 0.94 ? 6 + Math.floor(r() * 4) : 10 + Math.floor(r() * 14); };

    const used = new Set();
    for (let i = 0; i < N; i++) {
      const fem = r() < 0.71;
      let name; do { name = (fem ? pick(F) : pick(M)) + " " + pick(L) + (r() < 0.45 ? " " + pick(L) : ""); } while (used.has(name)); used.add(name);
      const ageY = (() => { const x = r(); return x < 0.05 ? 14 + Math.floor(r() * 4) : x < 0.38 ? 18 + Math.floor(r() * 12) : x < 0.7 ? 30 + Math.floor(r() * 10) : x < 0.87 ? 40 + Math.floor(r() * 10) : x < 0.96 ? 50 + Math.floor(r() * 10) : 60 + Math.floor(r() * 15); })();
      const yNow = new Date().getFullYear();
      const birth = { d: 1 + Math.floor(r() * 28), m: 1 + Math.floor(r() * 12), y: r() < 0.96 ? yNow - ageY : null };
      const created = U.addDays(start, dayFor());
      const prof = r() < 0.32 ? pick(PROF) : null;
      const c = {
        id: "c" + i.toString(36) + Math.floor(r() * 1e6).toString(36),
        name, gender: fem ? "f" : "m", birth,
        phone: "319" + (8 + Math.floor(r() * 2)) + String(Math.floor(r() * 1e7)).padStart(7, "0"),
        profession: prof ? prof[0] : "", area: prof ? prof[1] : "",
        notes: r() < 0.12 ? pick(NOTES) : "",
        createdAt: created, legacy: null,
      };
      s.customers.push(c);

      // visitas: espalhadas entre o cadastro e hoje, com decaimento
      const n = visitsN();
      const span = U.days(created, today);
      const dates = [created];
      const loyal = n >= 4;
      for (let k = 1; k < n; k++) {
        const x = loyal ? r() : Math.pow(r(), 1.8);
        dates.push(U.addDays(created, Math.max(1, Math.floor(x * span))));
      }
      dates.sort();
      let bal = 0;
      for (let k = 0; k < dates.length; k++) {
        const amount = U.r2(Math.min(260, Math.max(9, lognorm(47, 0.5))) - (r() < 0.5 ? 0 : 0.1 * Math.floor(r() * 10)));
        let redeem = 0;
        if (k > 0 && bal >= 8 && r() < 0.28) redeem = U.r2(Math.min(bal, amount));
        const earn = redeem > 0 ? 0 : U.r2(amount * 0.08);
        bal = U.r2(bal - redeem + earn);
        s.visits.push({ id: c.id + "v" + k, cid: c.id, date: dates[k], ts: k, amount, redeem, earn, note: "" });
      }
    }

    // movimento de hoje e aniversariantes da semana para o painel ganhar vida
    const regulars = s.customers.filter((c, i) => i % 23 === 0).slice(0, 9);
    regulars.forEach((c, k) => {
      const amount = U.r2(lognorm(45, 0.4));
      s.visits.push({ id: c.id + "hoje" + k, cid: c.id, date: today, ts: Date.now() - (k + 1) * 1800000, amount, redeem: 0, earn: U.r2(amount * 0.08), note: "" });
    });
    const t = new Date();
    s.customers.slice(30, 38).forEach((c, k) => { const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + k - 1); c.birth.d = d.getDate(); c.birth.m = d.getMonth() + 1; });

    // números lançados à mão por mês (faturamento da loja, vouchers, alimentação interna)
    const months = {};
    for (const v of s.visits) { const k = v.date.slice(0, 7); months[k] = (months[k] || 0) + v.amount; }
    Object.keys(months).forEach((k) => {
      if (k >= U.ym(today)) return;
      s.monthly[k] = { faturamento: Math.round(months[k] / (0.82 + r() * 0.1)), mktExt: Math.round(150 + r() * 1100), alimInt: Math.round(980 + r() * 600) };
    });

    // aba "Camp": números reais de jul–out/26 da planilha
    s.social = [
      { ym: "2026-07", g: 270, gNew: null, c1: 510, c1New: null, c2: null, ig: 8479, igNew: 96, igViews: 71912, igInt: 1201, igC: 13000 },
      { ym: "2026-08", g: 650, gNew: 380, c1: 702, c1New: 192, c2: null, ig: 8575, igNew: 175, igViews: 71170, igInt: 1160, igC: 13000 },
      { ym: "2026-09", g: 1051, gNew: 401, c1: 1093, c1New: 391, c2: null, ig: 8750, igNew: 91, igViews: 50320, igInt: 762, igC: 13100 },
      { ym: "2026-10", g: 1290, gNew: 239, c1: 1226, c1New: 133, c2: 3280, ig: 8841, igNew: null, igViews: null, igInt: null, igC: 13200 },
    ];
    const ideas = [["Dia do profissional: promoção por profissão", "ideia"], ["Promocional nos dias de comemoração", "ensaio"], ["Grupo de WhatsApp dos fãs", "palco"], ["Toda terça: combos promocionais", "palco"], ["UGC Jhow — clientes criando conteúdo", "ensaio"], ["Escolher fãs para divulgar a marca", "ideia"], ["Entrega de lanches", "ideia"]];
    s.ideas = ideas.map(([text, col], i) => ({ id: "i" + i, text, col, date: U.addDays(today, -i * 9) }));

    // biblioteca: acervo real + empréstimos fictícios
    s.books = (window.JR_BOOKS || []).map(([code, title, author, section, reads]) => ({ id: "b" + code, code, title, author, section, reads: reads || 0, loan: null, history: [] }));
    const pool = s.customers.filter((c) => c.notes.includes("livro") || r() < 0.08);
    for (let k = 0; k < 34 && s.books.length; k++) {
      const b = s.books[Math.floor(r() * s.books.length)];
      if (b.loan) continue;
      const c = pool[k % pool.length];
      b.loan = { cid: c.id, date: U.addDays(today, -Math.floor(r() * 52)), days: 30 };
    }
    return s;
  };
})();
