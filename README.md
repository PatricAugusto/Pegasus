# 🐎 Pegasus — Assistente de Gestão Financeira Pessoal Automatizada

Sistema inteligente de gestão financeira pessoal construído com **Node.js**, **Express**, **TypeScript**, **GrammY (Telegram Bot)** e **SQLite (Prisma ORM)**.

Projetado sob princípios de **alta coesão e baixo acoplamento (Clean Architecture / Modular DDD)** para permitir manutenção facilitada e integração fluida de agentes de inteligência artificial.

---

## 🛠️ Tecnologias Utilizadas

* **Linguagem:** TypeScript (ES2022 / NodeNext)
* **Backend:** Node.js + Express 5
* **Bot Framework:** [GrammY](https://grammy.dev/) (Framework moderno e 100% tipado para Telegram)
* **Banco de Dados:** SQLite local (`prisma/dev.db`)
* **ORM:** Prisma 6 (Totalmente tipado, com migrações e Prisma Studio)
* **Validação:** Zod

---

## 📂 Arquitetura Componentizada

```
src/
├── common/                         # Utilitários globais e formatadores
│   ├── formatters.ts               # Moeda (BRL), datas e meses
│   └── errors.ts                   # Classes de erros customizados (AppError, NotFoundError)
├── config/                         # Configuração e validação de ambiente (Zod)
│   └── env.ts
├── db/                             # Conexão e cliente singleton do Prisma
│   └── prisma.ts
├── modules/
│   ├── categories/                 # Domínio de Categorias
│   │   ├── category.constants.ts   # Categorias padrão (Alimentação, Transporte, etc.)
│   │   └── category.service.ts     # Regras de negócio de categorias
│   ├── users/                      # Domínio de Usuários
│   │   └── user.service.ts         # Regras de negócio de usuários
│   ├── transactions/               # Domínio de Transações
│   │   ├── transaction.types.ts    # DTOs e tipos de balanço/resumo
│   │   └── transaction.service.ts  # Criação, saldo, extrato e métricas por categoria
│   ├── bot/                        # Componente de Interface: Telegram Bot
│   │   ├── bot.context.ts          # Extensão de contexto do GrammY
│   │   ├── bot.instance.ts         # Instância central do bot
│   │   ├── keyboards/              # Teclados e botões inline isolados
│   │   ├── middlewares/            # Injeção de usuário e tratamento de erros
│   │   ├── handlers/               # Handlers de cada comando, callback e mensagem
│   │   │   ├── commands/           # /start, /ajuda, /gasto, /receita, /saldo, etc.
│   │   │   ├── callbacks/          # Ações dos botões inline (action_saldo, etc.)
│   │   │   └── messages/           # Fallback (Ponto de entrada do futuro Agente LLM)
│   │   └── bot.module.ts           # Orquestrador e inicializador do Bot
│   └── http/                       # Componente de Interface: API REST Express
│       ├── controllers/            # Controladores HTTP desacoplados
│       ├── routes/                 # Roteamento modular (Health, API)
│       └── app.ts                  # Factory e configuração do servidor Express
└── index.ts                        # Bootstrap e lifecycle da aplicação
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

## 🧪 Testes Unitários

A aplicação conta com uma suíte abrangente de testes unitários desenvolvida com **Vitest** e **Supertest**, cobrindo cada componente em isolamento com mocks tipados:

```bash
# Executa a suíte completa de testes
npm test

# Modo observador (watch) para TDD
npm run test:watch
```

Cobertura dos testes:
* **Common:** Formatadores de moeda (BRL), datas completas/abreviadas e classes de erros de domínio (`AppError`, `NotFoundError`).
* **Categorias:** Busca semântica case-insensitive, criação condicional e idempotência do seed padrão.
* **Transações:** Normalização de valores negativos (`Math.abs`), fallback para categoria padrão `Outros`, cálculo de saldo líquido e ranking de gastos por categoria.
* **Usuários:** Cadastro de novos usuários do Telegram e atualização reativa de alterações no perfil.
* **HTTP Controllers:** Validação de contratos REST (`/health`, `/api/users`, `/api/categories`, `/api/transactions`, `/api/summary/:id`).
* **Bot Parsing:** Validação de regex para comandos financeiros (decimais com ponto e vírgula, extração de categoria e descrição).

---

1. **Serviços como Tools prontas**: Métodos como `transactionService.create`, `transactionService.getBalance` e `categoryService.findByName` estão 100% tipados e desacoplados de bibliotecas de bot ou HTTP. O agente de IA pode chamá-los diretamente através de Function Calling / Tool Calling.
2. **Ponto de Injeção Claro**: O handler [`fallback.handler.ts`](file:///C:/Users/Suporte%20Quick/Desktop/Sprint/Pegasus/Pegasus/src/modules/bot/handlers/messages/fallback.handler.ts) isola qualquer mensagem de texto, áudio ou foto recebida, permitindo direcioná-la para o Agente Orquestrador sem tocar na lógica dos comandos tradicionais.
