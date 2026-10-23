# 🐎 Pegasus — Assistente de Gestão Financeira Pessoal Automatizada

Sistema inteligente de gestão financeira pessoal construído com **Node.js**, **Express**, **TypeScript**, **GrammY (Telegram Bot)** e **SQLite (Prisma ORM)**.

Desenvolvido para operar em duas fases:
1. **Fase 1 (Atual):** Bot com comandos estruturados, menus interativos, CRUD completo de finanças e API REST em Express.
2. **Fase 2 (Próxima):** Camada de orquestração multi-agente com LLMs (Gemini Multimodal) para interpretação de áudios, fotos de comprovantes fiscais (OCR) e conselheiro orçamentário autônomo.

---

## 🛠️ Tecnologias Utilizadas

* **Linguagem:** TypeScript (ES2022 / NodeNext)
* **Backend:** Node.js + Express 5
* **Bot Framework:** [GrammY](https://grammy.dev/) (Framework moderno e tipado para Telegram)
* **Banco de Dados:** SQLite local (`prisma/dev.db`)
* **ORM:** Prisma 6 (Totalmente tipado, com migrações e Prisma Studio)
* **Validação:** Zod

---

## 📂 Estrutura do Projeto

```
Pegasus/
├── prisma/
│   ├── schema.prisma        # Modelo de dados (User, Transaction, Category, Budget)
│   └── dev.db               # Banco SQLite gerado automaticamente
├── src/
│   ├── config/
│   │   └── env.ts           # Validação de variáveis de ambiente
│   ├── db/
│   │   └── prisma.ts        # Conexão e cliente singleton do Prisma
│   ├── services/
│   │   ├── user.service.ts         # Gestão de usuários do Telegram
│   │   ├── category.service.ts     # Categorias padrão e customizadas
│   │   └── transaction.service.ts  # Lançamentos, saldo, extrato e métricas
│   ├── bot/
│   │   └── bot.ts           # Handlers do Telegram (comandos, botões inline, teclado)
│   ├── server/
│   │   └── app.ts           # Servidor Express com rotas de API e healthcheck
│   └── index.ts             # Inicialização do banco, Express e Bot
├── .env.example             # Modelo das variáveis de ambiente
├── package.json
└── tsconfig.json
```

---

## ⚡ Como Rodar o Projeto

### 1. Criar e Configurar o Bot no Telegram
1. Abra seu Telegram e converse com o [@BotFather](https://t.me/BotFather).
2. Envie o comando `/newbot` e siga as instruções para escolher nome e username.
3. Copie o **Token de Acesso HTTP** fornecido pelo BotFather.

### 2. Configurar o `.env`
Abra o arquivo `.env` na raiz do projeto e cole o seu token:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
TELEGRAM_BOT_TOKEN="SEU_TOKEN_AQUI"
```

### 3. Iniciar o Servidor & Bot
Em modo de desenvolvimento com hot-reload:
```bash
npm run dev
```

---

## 💬 Comandos Disponíveis no Bot

| Comando | Descrição | Exemplo |
| :--- | :--- | :--- |
| `/start` | Apresentação e menu de atalhos rápidos | `/start` |
| `/ajuda` | Manual com exemplos de uso | `/ajuda` |
| `/gasto <valor> <desc>` | Registra uma despesa no mês | `/gasto 35.50 Almoço Alimentação` |
| `/receita <valor> <desc>` | Registra uma receita ou entrada | `/receita 3500 Salário Mensal` |
| `/saldo` | Balanço líquido do mês (receitas vs despesas) | `/saldo` |
| `/extrato` | Histórico dos 10 lançamentos mais recentes | `/extrato` |
| `/resumo` | Gráfico em barras percentuais de gastos por categoria | `/resumo` |
| `/categorias` | Lista as categorias cadastradas no sistema | `/categorias` |

*💡 Dica: O bot aceita valores tanto com ponto quanto com vírgula (ex: `25.50` ou `25,50`).*

---

## 🌐 Endpoints da API REST (Express)

O servidor Express roda por padrão em `http://localhost:3000`:

* **`GET /health`**: Verifica status da API e conexão com SQLite.
* **`GET /api/categories`**: Lista todas as categorias padrão e personalizadas.
* **`GET /api/transactions`**: Lista as transações com suporte a paginação e filtro por `?telegramId=`.
* **`GET /api/summary/:telegramId`**: Retorna balanço mensal detalhado, percentual por categoria e lançamentos recentes do usuário.
* **`GET /api/users`**: Lista os usuários registrados pelo Telegram.

---

## 🔍 Visualizador Gráfico do Banco (Prisma Studio)

Para visualizar e editar os dados do SQLite no seu navegador:
```bash
npm run db:studio
```
Acesse: `http://localhost:5555`

---

## 🚀 Próxima Etapa: Orquestrador de Agentes & LLM

Na Fase 2, adicionaremos o orquestrador subjacente:
1. **Gemini 2.5 Flash / Pro Multimodal**:
   - Transcrição e extração de intenção de mensagens de **voz/áudio** (*"Gastei trinta reais na farmácia"*).
   - Leitura de comprovantes fiscais e **prints de PIX** via visão computacional.
2. **Orquestrador de Agentes**:
   - Router para delegar entre Registro de Transações, Consultas Analíticas e Alertas Orçamentários.
