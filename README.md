# Jhow Rock Café — Backstage

Protótipo funcional do sistema que substitui a planilha **Jhow Cashback.xlsx** na operação do café: caixa com cashback, cadastro de clientes, relacionamento por WhatsApp, indicadores, campanhas e biblioteca do clube do livro.

Funciona no computador e no celular, sem instalar nada: é só abrir o `index.html` no navegador (Edge ou Chrome).

## Como usar

1. Abra `index.html` com duplo clique.
2. O sistema abre direto no **Caixa**, a mesma ação que o Jhow faz na planilha: achar o cliente e lançar a compra. Na primeira vez, ele vem com **dados de exemplo**. Os clientes são fictícios, mas seguem o perfil real da planilha.
3. Para usar com os dados de verdade, vá em **Ajustes → Trazer a planilha** e escolha o arquivo `Jhow Cashback.xlsx`. A leitura acontece no próprio navegador e nada sai do computador.
4. Faça **backup semanal** em Ajustes → Baixar backup.

Atalhos no computador: `/` busca um cliente e `N` abre uma nova venda.

## Da planilha para o sistema

| Aba da planilha | Tela no sistema | O que mudou |
|---|---|---|
| **Cash** (2 linhas por cliente, 6 slots de compra, subtotal, resgates nos comentários) | **Caixa**, **Clientes** e ficha do cliente | Lançamento em 3 toques: busca, valor e confirmação. Saldo, visitas, consumo, status e nível de fã são calculados sozinhos, com histórico completo e estorno. |
| **Mkt** (indicadores mensais/trimestrais digitados à mão) | **Números** | Leads, visitas, consumo, ticket, frequência (1x, 2x, 3x, 4–5x, 6x+), recência (3/6/9 meses), sexo, faixa etária e profissões saem automaticamente. Só o faturamento da loja, os vouchers e a alimentação interna são lançados à mão. A tabela mantém os subtotais por trimestre. |
| **Prof** | Campo "Área" no cadastro e gráfico de profissões | As abreviações da planilha são mapeadas para áreas na importação. |
| **Camp** | **Campanhas** | Google e Instagram contra os concorrentes, mês a mês, e um quadro de ideias (Ideias → Ensaiando → No palco). |
| **Livro** | **Biblioteca** | Acervo com 1.017 títulos, empréstimo vinculado ao cliente, devolução, atrasos e mais lidos. |
| *(não existia)* | **Fã-clube** | Aniversariantes, clientes esfriando com saldo, saldo parado e maiores fãs, com mensagem de WhatsApp pronta. |

### Regras herdadas da planilha

- Cashback de **8%** (planilha: total ÷ 12,5), configurável em Ajustes.
- **Visita com resgate não gera cashback**, como na planilha. Em Ajustes dá para mudar para gerar sobre o valor pago.
- Visitas totais = compras + visitas de resgate. Consumo total = compras + contas das visitas de resgate.
- Status pela última visita: **Ativo** (até 90 dias), **Morno** (até 180), **Afastado** (até 270) e **Sumido** (acima disso). Os limites são configuráveis.
- Nível de fã: Estreante (1 visita), Groupie (2–3), Fã (4–5) e Lenda (6+).

### Conferência da importação

Testada com a planilha real:

| | Planilha | Sistema |
|---|---|---|
| Clientes | 4.301 | 4.301 |
| Total resgatado | R$ 19.900,00 | R$ 19.900,00 |
| Cashback em aberto | R$ 36.747,57 | R$ 36.746,84 (arredondamento de centavos) |
| Clientes com saldo negativo | 14 | 14 |
| Consumo total | R$ 757.743 | R$ 757.737 |
| Visitas | 14.380 | 14.392 |

Datas digitadas com erro (no futuro ou inválidas) são trocadas pela data mais próxima do mesmo cliente, e a tela de importação avisa quantas foram corrigidas.

## Estrutura

```
index.html          shell da aplicação
css/app.css         identidade visual (tema escuro, rock)
js/core.js          utilitários, persistência (IndexedDB) e regras de negócio
js/ui.js            gaveta, modal, toast, tooltip e gráficos
js/views-ops.js     Palco, Caixa, Clientes, ficha e cadastro
js/views-more.js    Fã-clube, Números, Campanhas, Biblioteca e Ajustes
js/importer.js      importação da planilha .xlsx (SheetJS, carregado sob demanda)
js/seed.js          gerador dos dados de exemplo
js/data-books.js    acervo extraído da aba "Livro" (sem dados de leitores)
assets/             selo do Jhow
```

## Identidade visual

Preto predominante, com o selo do Jhow, tipografia de pôster de show e elementos de rock e café:

- Fotos de guitarra, amplificadores, toca-discos, violão e café tratadas em duotone preto e papel, as mesmas cores do selo (pasta `assets/fotos/`).
- Ilustrações próprias em traço: guitarra, amplificador com a placa "Jhow", xícara com vapor em forma de raio e disco de vinil (`js/art.js`).
- Knob de amplificador que mostra o "volume do caixa" do dia (5 é um dia normal, 11 é recorde), setlist do dia em papel com fita crepe, comprovante em formato de ingresso de show, credencial de backstage na ficha do cliente, palheta de guitarra como avatar e cordas de guitarra como divisor.

As fotos são do [Unsplash](https://unsplash.com/license) (licença livre para uso comercial, sem atribuição obrigatória) e estão creditadas em Ajustes. Elas ficam salvas dentro do projeto, não em CDN, para funcionar sem internet e no link publicado.

## Limites do protótipo

- Os dados ficam **no navegador do computador ou celular onde o sistema foi aberto**. Dois aparelhos não compartilham dados. Para o caixa e o celular do Jhow verem a mesma base, a próxima etapa é um backend (banco de dados na nuvem com login).
- Não há login nem perfis de acesso.
- O botão de WhatsApp abre a conversa com a mensagem pronta, mas o envio é feito pela pessoa no próprio WhatsApp.

## Privacidade (LGPD)

A planilha e os backups têm dados pessoais dos clientes (nome, telefone e data de nascimento). Recomendações:

- Não versionar `Jhow Cashback.xlsx` nem arquivos de backup em repositórios remotos. Vale incluí-los no `.gitignore`.
- Usar os dados só para o programa de fidelidade e relacionamento.
- Excluir o cadastro de quem pedir (ficha do cliente → Excluir cliente).
