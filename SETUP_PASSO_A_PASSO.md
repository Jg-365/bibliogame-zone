# 🚀 Script de Setup Automático - Sistema de Notificações

## ✅ O que já foi feito automaticamente:

### 1. Frontend (100% Completo)

- ✅ Componente `NotificationSettings.tsx` criado
- ✅ Botão de notificações no perfil com ícone de sino
- ✅ Dialog de configurações implementado
- ✅ Interface completa e responsiva

### 2. Migrations SQL (100% Criadas)

- ✅ Arquivo criado:
  `supabase/migrations/20251007100000_email_notifications_system.sql`
- ✅ Tabelas: `notification_preferences`, `notification_queue`
- ✅ Triggers automáticos para follows, posts, comments, likes
- ✅ Políticas RLS configuradas

### 3. Edge Functions (100% Criadas)

- ✅ Função criada: `supabase/functions/send-notifications/index.ts`
- ✅ Função criada: `supabase/functions/daily-reminders/index.ts`
- ✅ Templates HTML profissionais
- ✅ Integração com Resend

---

## ⚠️ O que VOCÊ precisa fazer (não pode ser automatizado):

### PASSO 1: Instalar Supabase CLI (5 minutos)

#### Windows (PowerShell como Administrador):

```powershell
# Usando Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Ou usando npm:

```bash
npm install -g supabase
```

#### Verificar instalação:

```bash
supabase --version
```

---

### PASSO 2: Fazer Login no Supabase (2 minutos)

```bash
supabase login
```

Isso vai abrir o navegador para você autorizar. Depois volte ao terminal.

---

### PASSO 3: Linkar com seu Projeto (2 minutos)

```bash
# Listar seus projetos
supabase projects list

# Linkar com o projeto (substitua pelo ID correto)
supabase link --project-ref SEU_PROJECT_REF
```

O `project-ref` você encontra em:

- Dashboard do Supabase → Settings → General → Reference ID

---

### PASSO 4: Aplicar a Migration (1 minuto)

```bash
supabase db push
```

Isso vai criar as tabelas `notification_preferences` e `notification_queue` no
banco.

---

### PASSO 5: Atualizar Tipos TypeScript (1 minuto)

```bash
# Gerar tipos atualizados
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

Isso vai adicionar as novas tabelas aos tipos TypeScript e resolver os erros de
compilação.

---

### PASSO 6: Criar Conta no Resend (5 minutos)

1. Acesse: https://resend.com
2. Clique em **Sign Up**
3. Verifique seu e-mail
4. No dashboard:
   - Vá em **API Keys**
   - Clique em **Create API Key**
   - Nome: "ReadQuest Notifications"
   - Copie a key (começa com `re_...`)
   - ⚠️ **IMPORTANTE**: Salve em local seguro, só aparece uma vez!

**Plano Grátis:**

- ✅ 100 e-mails por dia
- ✅ 1 domínio personalizado
- ✅ Perfeito para começar!

---

### PASSO 7: Deploy das Edge Functions (2 minutos)

```bash
# Deploy da função de envio
supabase functions deploy send-notifications

# Deploy da função de lembretes diários
supabase functions deploy daily-reminders
```

---

### PASSO 8: Configurar Secrets (2 minutos)

```bash
# Adicionar API Key do Resend (use a key que você copiou)
supabase secrets set RESEND_API_KEY=re_sua_key_aqui

# Adicionar URL do site
supabase secrets set SITE_URL=https://bibliogame-zone.vercel.app
```

---

### PASSO 9: Configurar Cron Jobs (3 minutos)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **+ New Query**
4. Cole o código abaixo (leia as instruções primeiro):

```sql
-- IMPORTANTE: Substitua os valores antes de executar!
-- YOUR_PROJECT_REF: encontre em Settings → API → Project URL (exemplo: abcdefghijklmnop)
-- YOUR_ANON_KEY: encontre em Settings → API → Project API keys → anon public

-- Habilitar extensão pg_cron (execute apenas uma vez)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Processar fila de notificações a cada 5 minutos
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

-- Criar lembretes diários a cada hora
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

-- Verificar se os cron jobs foram criados
SELECT * FROM cron.job;
```

5. Clique em **RUN** (ou F5)
6. Deve aparecer os 2 cron jobs na listagem

---

### PASSO 10: Testar! (5 minutos)

#### Teste 1: Interface

1. Faça login no app
2. Vá para **Perfil**
3. Clique no botão **"Notificações"** (ícone de sino 🔔)
4. Ative/desative as configurações
5. Salve o horário do lembrete

#### Teste 2: Verificar Banco

No SQL Editor do Supabase:

```sql
-- Ver suas preferências
SELECT * FROM notification_preferences;
```

#### Teste 3: Trigger de Notificação

1. Siga alguém no app (ou peça para alguém te seguir)
2. Verifique se a notificação foi enfileirada:

```sql
SELECT * FROM notification_queue
WHERE sent = false
ORDER BY created_at DESC;
```

#### Teste 4: Envio Manual de E-mail

No terminal:

```bash
# Buscar project ref e anon key no dashboard
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Depois verifique:

- Dashboard → Edge Functions → Logs
- Seu e-mail (pode ir para spam na primeira vez)

---

## 📋 Checklist Final

Marque conforme for completando:

- [ ] Supabase CLI instalado
- [ ] Login no Supabase feito
- [ ] Projeto linkado
- [ ] Migration aplicada (`supabase db push`)
- [ ] Tipos TypeScript atualizados
- [ ] Conta Resend criada
- [ ] API Key do Resend copiada
- [ ] Edge Functions deployadas
- [ ] Secrets configurados (RESEND_API_KEY, SITE_URL)
- [ ] Cron jobs configurados
- [ ] Teste de interface feito
- [ ] Teste de banco feito
- [ ] Teste de trigger feito
- [ ] Teste de envio feito

---

## 🎯 Resumo dos Comandos (na ordem)

```bash
# 1. Instalar CLI (escolha um método)
npm install -g supabase
# OU
scoop install supabase

# 2. Login
supabase login

# 3. Listar e linkar projeto
supabase projects list
supabase link --project-ref SEU_PROJECT_REF

# 4. Aplicar migration
supabase db push

# 5. Gerar tipos
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# 6. Deploy das functions
supabase functions deploy send-notifications
supabase functions deploy daily-reminders

# 7. Configurar secrets
supabase secrets set RESEND_API_KEY=re_sua_key
supabase secrets set SITE_URL=https://bibliogame-zone.vercel.app
```

---

## ⏱️ Tempo Total Estimado

- Instalação e setup: **10-15 minutos**
- Configuração Resend: **5 minutos**
- Deploy e testes: **10 minutos**

**Total: ~30 minutos** ⚡

---

## 🆘 Problemas Comuns

### "supabase: command not found"

- **Solução**: Instale a CLI (Passo 1)
- Se usar npm: Reinicie o terminal após instalar

### "Failed to link project"

- **Solução**: Verifique se o project-ref está correto
- Veja em: Dashboard → Settings → General → Reference ID

### "Permission denied" no deploy

- **Solução**: Faça login novamente: `supabase login`

### Tipos TypeScript ainda com erro

- **Solução**:
  1. Verifique se a migration foi aplicada
  2. Regenere os tipos:
     `supabase gen types typescript --linked > src/integrations/supabase/types.ts`
  3. Reinicie o servidor de dev: `npm run dev`

### E-mails não chegam

- **Solução**:
  1. Verifique a pasta de spam
  2. Verifique se RESEND_API_KEY está correta
  3. Veja logs: Dashboard → Edge Functions → send-notifications → Logs
  4. Veja dashboard do Resend: https://resend.com/emails

---

## 📞 Próximos Passos Após Setup

Quando tudo estiver funcionando:

1. **Teste em produção**: Peça para alguns usuários testarem
2. **Monitore**: Acompanhe os logs e a fila de notificações
3. **Ajuste**: Configure horários dos lembretes baseado no uso
4. **Expanda**: Adicione mais tipos de notificação conforme necessário

---

## 📚 Documentação de Referência

- **Sistema completo**: `EMAIL_NOTIFICATIONS_SYSTEM.md`
- **Supabase CLI**: https://supabase.com/docs/guides/cli
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Resend**: https://resend.com/docs
- **pg_cron**: https://supabase.com/docs/guides/database/extensions/pg_cron

---

**Bom setup! 🚀**

Se tiver alguma dúvida, confira os logs ou peça ajuda!
