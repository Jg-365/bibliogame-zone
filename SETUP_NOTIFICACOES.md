# 🔔 Guia de Configuração do Sistema de Notificações

## ✅ Checklist de Implementação

### 1. **Migration do Banco de Dados** (OBRIGATÓRIO)

A migration já foi criada em:
`supabase/migrations/20251007100000_email_notifications_system.sql`

#### Opção A: Usando Supabase CLI (Recomendado)

```bash
# Verificar se está logado
supabase status

# Aplicar a migration
supabase db push
```

#### Opção B: Usando Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie todo o conteúdo de
   `supabase/migrations/20251007100000_email_notifications_system.sql`
5. Cole no editor e clique em **RUN**

**O que essa migration cria:**

- ✅ Tabela `notification_preferences` (preferências do usuário)
- ✅ Tabela `notification_queue` (fila de notificações)
- ✅ Políticas RLS (segurança)
- ✅ Triggers automáticos (follows, posts, comments, likes)
- ✅ Função para criar preferências padrão

---

### 2. **Atualizar Tipos TypeScript do Supabase** (OBRIGATÓRIO)

Depois de rodar a migration, você precisa atualizar os tipos TypeScript:

```bash
# Gerar novos tipos
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

**Ou via Supabase CLI:**

```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

Isso vai adicionar as novas tabelas aos tipos e remover os erros TypeScript no
`NotificationSettings.tsx`.

---

### 3. **Configurar Resend** (OBRIGATÓRIO para enviar e-mails)

#### 3.1. Criar conta no Resend

1. Acesse: https://resend.com
2. Crie uma conta gratuita
3. Você terá 100 e-mails gratuitos por dia

#### 3.2. Adicionar e verificar domínio (OPCIONAL)

- **Para testes**: Use o domínio de teste `onboarding@resend.dev` (já funciona)
- **Para produção**: Adicione e verifique seu domínio

#### 3.3. Gerar API Key

1. No dashboard do Resend: **API Keys** → **Create API Key**
2. Copie a API Key (começa com `re_...`)
3. Salve em um lugar seguro (só aparece uma vez)

---

### 4. **Deploy das Edge Functions** (OBRIGATÓRIO para enviar e-mails)

As Edge Functions já foram criadas em:

- `supabase/functions/send-notifications/index.ts`
- `supabase/functions/daily-reminders/index.ts`

#### 4.1. Deploy via Supabase CLI

```bash
# Deploy da função de envio de notificações
supabase functions deploy send-notifications

# Deploy da função de lembretes diários
supabase functions deploy daily-reminders
```

#### 4.2. Configurar Secrets (Variáveis de Ambiente)

```bash
# Adicionar API Key do Resend
supabase secrets set RESEND_API_KEY=re_seu_token_aqui

# Adicionar URL do site
supabase secrets set SITE_URL=https://bibliogame-zone.vercel.app
```

**Ou via Dashboard:**

1. Acesse: **Settings** → **Edge Functions** → **Secrets**
2. Adicione:
   - `RESEND_API_KEY`: sua API key do Resend
   - `SITE_URL`: URL do seu site em produção

---

### 5. **Configurar Cron Jobs** (OBRIGATÓRIO para automação)

Os cron jobs vão executar automaticamente as Edge Functions em intervalos
regulares.

#### 5.1. Habilitar pg_cron (uma vez)

No **SQL Editor** do Supabase:

```sql
-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### 5.2. Criar Cron Jobs

**IMPORTANTE:** Substitua `YOUR_PROJECT_REF` e `YOUR_ANON_KEY` pelos valores do
seu projeto.

Encontre esses valores em: **Settings** → **API**

```sql
-- 1. Processar fila de notificações a cada 5 minutos
SELECT cron.schedule(
  'process-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);

-- 2. Criar lembretes diários a cada hora
SELECT cron.schedule(
  'daily-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

**Verificar se os cron jobs foram criados:**

```sql
SELECT * FROM cron.job;
```

---

### 6. **Testar o Sistema** (RECOMENDADO)

#### 6.1. Testar Preferências de Notificação

1. Faça login no app
2. Vá para **Perfil**
3. Clique no botão **"Notificações"** (ícone de sino)
4. Ative/desative as preferências
5. Configure o horário do lembrete

**Verificar no banco:**

```sql
SELECT * FROM notification_preferences WHERE user_id = 'SEU_USER_ID';
```

#### 6.2. Testar Triggers (Enfileiramento)

**Teste 1: Seguir alguém**

1. Siga outro usuário no app
2. Verifique se a notificação foi enfileirada:

```sql
SELECT * FROM notification_queue
WHERE notification_type = 'follow'
AND sent = false
ORDER BY created_at DESC
LIMIT 5;
```

**Teste 2: Criar um post**

1. Crie uma publicação
2. Verifique se os seguidores foram notificados:

```sql
SELECT * FROM notification_queue
WHERE notification_type = 'post'
AND sent = false
ORDER BY created_at DESC
LIMIT 5;
```

#### 6.3. Testar Envio de E-mail (Manualmente)

Você pode chamar a Edge Function manualmente:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Verificar logs:**

- Dashboard → **Edge Functions** → **send-notifications** → **Logs**

---

## 🚨 Problemas Comuns

### TypeScript está reclamando sobre `notification_preferences`

**Solução:** Regenerar os tipos do Supabase (passo 2)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### E-mails não estão sendo enviados

**Checklist:**

1. ✅ RESEND_API_KEY está configurada?
2. ✅ Edge Function foi deployada?
3. ✅ Cron job está ativo?
4. ✅ Há notificações na fila? (`sent = false`)
5. ✅ Verifique os logs da Edge Function

### Notificações não estão sendo enfileiradas

**Checklist:**

1. ✅ Migration foi aplicada?
2. ✅ Triggers foram criados?
3. ✅ Usuário tem preferências habilitadas?
4. ✅ Usuário tem email válido?

### Lembretes diários não funcionam

**Checklist:**

1. ✅ Cron job está configurado?
2. ✅ `daily_reading_reminder` está true?
3. ✅ `email_notifications_enabled` está true?
4. ✅ Horário configurado corresponde ao horário atual?
5. ✅ Usuário já não leu hoje? (só envia se não leu)

---

## 📊 Monitoramento

### Verificar fila de notificações pendentes

```sql
SELECT
  notification_type,
  COUNT(*) as pendentes
FROM notification_queue
WHERE sent = false
GROUP BY notification_type;
```

### Verificar taxa de envio (últimas 24h)

```sql
SELECT
  COUNT(*) FILTER (WHERE sent = true) as enviadas,
  COUNT(*) FILTER (WHERE sent = false) as pendentes,
  COUNT(*) as total
FROM notification_queue
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Verificar usuários com notificações ativas

```sql
SELECT COUNT(*)
FROM notification_preferences
WHERE email_notifications_enabled = true;
```

---

## 🎯 Resumo do Fluxo

```
Usuário A curte post do Usuário B
         ↓
Trigger detecta a ação
         ↓
Verifica preferências do Usuário B
         ↓
Enfileira notificação (notification_queue)
         ↓
Cron job executa a cada 5 min
         ↓
Edge Function processa fila
         ↓
Busca dados (emails, nomes)
         ↓
Gera template HTML
         ↓
Envia via Resend
         ↓
Marca como enviada
         ↓
Usuário B recebe e-mail! ✉️
```

---

## ✨ O que Funciona Agora

Após completar o setup:

- ✅ Interface de configuração no perfil (botão "Notificações")
- ✅ Preferências granulares (liga/desliga cada tipo)
- ✅ Triggers automáticos (follows, posts, comments, likes)
- ✅ Fila de notificações (garante entrega)
- ✅ Templates HTML bonitos e responsivos
- ✅ Links diretos para o conteúdo
- ✅ Lembretes diários configuráveis
- ✅ Proteção de sequência (só lembra se não leu)

---

## 📝 Próximos Passos (Opcional)

Depois que tudo estiver funcionando, você pode:

1. Personalizar templates de e-mail
2. Adicionar mais tipos de notificação
3. Criar digest semanal
4. Adicionar notificações in-app
5. Implementar push notifications (PWA)

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar:

1. Verifique os logs das Edge Functions
2. Verifique a fila de notificações
3. Verifique os logs do Resend
4. Consulte o `EMAIL_NOTIFICATIONS_SYSTEM.md` para mais detalhes

---

**Pronto! 🚀 Seu sistema de notificações está configurado!**
