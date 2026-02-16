# Guia de Deploy - Hunter AI

Este guia explica como fazer o deploy completo do Hunter AI.

## Pre-requisitos

1. Conta no [GitHub](https://github.com)
2. Conta no [Supabase](https://supabase.com) (free tier disponivel)
3. Conta na [Vercel](https://vercel.com) (free tier disponivel)
4. Conta na [Railway](https://railway.app) (free tier disponivel)
5. (Opcional) Conta na [OpenAI](https://platform.openai.com) para AI scoring
6. (Opcional) Conta na [Resend](https://resend.com) para emails

## Passo 1: Criar Repositorio no GitHub

1. Crie um novo repositorio no GitHub
2. Faca push do codigo:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/hunter-ai.git
git push -u origin main
```

## Passo 2: Configurar Supabase

### 2.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e faca login
2. Clique em "New Project"
3. Escolha um nome e senha para o banco de dados
4. Selecione a regiao mais proxima
5. Aguarde a criacao do projeto

### 2.2 Obter Credenciais

1. Va em **Settings** > **API**
2. Copie:
   - **Project URL** (ex: `https://xxx.supabase.co`)
   - **anon/public key** (para o frontend)
   - **service_role key** (para o backend - MANTENHA SEGURO!)

3. Va em **Settings** > **Database**
4. Copie a **Connection string** (URI)
   - Substitua `[YOUR-PASSWORD]` pela senha que voce definiu

### 2.3 Configurar Storage

1. Va em **Storage**
2. Clique em "New bucket"
3. Nome: `resumes`
4. Marque "Public bucket"
5. Clique em "Create bucket"

### 2.4 Executar Script SQL

1. Va em **SQL Editor**
2. Cole o conteudo de `supabase/setup.sql`
3. Clique em "Run"

### 2.5 Criar Usuario Admin

1. Va em **Authentication** > **Users**
2. Clique em "Add user"
3. Preencha email e senha
4. Clique em "Create user"

## Passo 3: Deploy na Vercel (Web App)

### 3.1 Conectar Repositorio

1. Acesse [vercel.com](https://vercel.com) e faca login
2. Clique em "Add New" > "Project"
3. Importe seu repositorio do GitHub
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`

### 3.2 Configurar Variaveis de Ambiente

Adicione as seguintes variaveis:

| Variavel | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do Supabase |
| `DATABASE_URL` | Connection string do Postgres |
| `NEXT_PUBLIC_APP_URL` | URL do seu app na Vercel (ex: https://hunter-ai.vercel.app) |

### 3.3 Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Acesse a URL gerada para testar

## Passo 4: Deploy na Railway (Worker)

### 4.1 Criar Projeto

1. Acesse [railway.app](https://railway.app) e faca login
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha seu repositorio

### 4.2 Configurar Servico

1. Clique no servico criado
2. Va em **Settings**
3. Configure:
   - **Root Directory**: `apps/worker`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`

### 4.3 Configurar Variaveis de Ambiente

Va em **Variables** e adicione:

| Variavel | Valor |
|----------|-------|
| `SUPABASE_URL` | URL do seu projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do Supabase |
| `DATABASE_URL` | Connection string do Postgres |
| `OPENAI_API_KEY` | Sua API key da OpenAI (opcional) |
| `RESEND_API_KEY` | Sua API key do Resend (opcional) |
| `FROM_EMAIL` | Email de origem (ex: noreply@seudominio.com) |
| `RECRUITER_EMAIL` | Email do recrutador para notificacoes |
| `NEXT_PUBLIC_APP_URL` | URL do seu app na Vercel |
| `POLL_INTERVAL_MS` | Intervalo de polling em ms (default: 30000) |
| `BATCH_SIZE` | Quantidade de candidatos por ciclo (default: 5) |

### 4.4 Deploy

1. O deploy sera automatico apos configurar as variaveis
2. Verifique os logs para confirmar que o worker esta rodando

## Passo 5: Verificar Deploy

### 5.1 Testar Web App

1. Acesse a URL da Vercel
2. Faca login com o usuario admin criado
3. Crie uma vaga de teste
4. Compartilhe o link e faca uma aplicacao de teste

### 5.2 Verificar Worker

1. Na Railway, va em **Logs**
2. Verifique se o worker esta processando candidatos
3. Confirme que os scores estao sendo atualizados no painel

## Troubleshooting

### Erro de conexao com banco de dados

- Verifique se a `DATABASE_URL` esta correta
- Certifique-se de que a senha nao contem caracteres especiais nao escapados

### Worker nao processa candidatos

- Verifique os logs na Railway
- Confirme que `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estao corretos
- Verifique se o candidato tem `needs_scoring = true`

### Emails nao sao enviados

- Verifique se `RESEND_API_KEY` esta configurado
- Confirme que o dominio do `FROM_EMAIL` esta verificado no Resend
- Verifique os logs do worker para erros

### AI scoring retorna valores padrao

- Verifique se `OPENAI_API_KEY` esta configurado
- Confirme que sua conta OpenAI tem creditos disponiveis
- Verifique os logs do worker para erros da API

## Custos Estimados

| Servico | Free Tier | Uso Tipico |
|---------|-----------|------------|
| Supabase | 500MB DB, 1GB Storage | Suficiente para MVP |
| Vercel | 100GB bandwidth | Suficiente para MVP |
| Railway | $5/mes creditos | ~$0-5/mes para worker leve |
| OpenAI | Pay-as-you-go | ~$0.01 por candidato |
| Resend | 3000 emails/mes | Suficiente para MVP |

## Proximos Passos

1. Configure um dominio customizado na Vercel
2. Configure HTTPS e verificacao de dominio no Resend
3. Adicione monitoramento com Sentry ou similar
4. Configure backups automaticos no Supabase
