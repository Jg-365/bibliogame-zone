# Sistema de Notificações por E-mail - ReadQuest

## 📧 Visão Geral

Sistema completo de notificações por e-mail que permite aos usuários receberem
lembretes de leitura e atualizações sobre atividades sociais.

## ✨ Funcionalidades

### 1. **Notificações Sociais**

- 👥 **Novos Seguidores**: Receba um e-mail quando alguém começar a seguir você
- 📝 **Novas Publicações**: Seja notificado quando pessoas que você segue
  publicarem algo
- 💬 **Comentários**: Receba alertas quando comentarem em suas publicações
- ❤️ **Curtidas**: Seja notificado quando curtirem suas publicações

### 2. **Lembretes de Leitura**

- 📚 **Lembrete Diário**: Receba um e-mail diário lembrando de ler
- ⏰ **Horário Personalizado**: Configure o horário do lembrete
- 🔥 **Proteção de Sequência**: O lembrete só é enviado se você ainda não leu no
  dia
- 📖 **Livro Atual**: Mostra qual livro você está lendo atualmente

### 3. **Preferências Granulares**

- ✅ **Controle Total**: Ative/desative cada tipo de notificação individualmente
- 🎛️ **Master Toggle**: Desative todas as notificações de uma vez
- 🔗 **Links Diretos**: Todos os e-mails incluem links diretos para o conteúdo
- 🚫 **Fácil Cancelamento**: Link para gerenciar preferências em todos os
  e-mails

## 🏗️ Arquitetura

### Componentes do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                               │
├─────────────────────────────────────────────────────────────────┤
│  - NotificationSettings.tsx (Componente React)                  │
│  - Profile.tsx (Página com aba de notificações)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase Database                             │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                        │
│  - notification_preferences (preferências do usuário)           │
│  - notification_queue (fila de notificações)                    │
│                                                                 │
│  Triggers:                                                      │
│  - queue_follow_notification()                                  │
│  - queue_post_notification()                                    │
│  - queue_comment_notification()                                 │
│  - queue_like_notification()                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Edge Functions                               │
├─────────────────────────────────────────────────────────────────┤
│  - send-notifications (processa fila e envia e-mails)           │
│  - daily-reminders (cria lembretes diários)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Resend API                                 │
├─────────────────────────────────────────────────────────────────┤
│  - Envio transacional de e-mails                                │
│  - Templates HTML responsivos                                   │
│  - Rastreamento de entrega                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Estrutura de Dados

### notification_preferences

```sql
{
  id: uuid,
  user_id: uuid,
  email_notifications_enabled: boolean,
  notify_on_follow: boolean,
  notify_on_comment: boolean,
  notify_on_like: boolean,
  notify_on_post: boolean,
  daily_reading_reminder: boolean,
  reminder_time: time, -- HH:MM:SS
  created_at: timestamp,
  updated_at: timestamp
}
```

### notification_queue

```sql
{
  id: uuid,
  user_id: uuid, -- destinatário
  notification_type: text, -- 'follow', 'comment', 'like', 'post', 'reading_reminder'
  trigger_user_id: uuid, -- quem causou a notificação
  related_entity_id: uuid, -- ID do post, comentário, etc
  related_entity_type: text, -- 'post', 'comment', etc
  data: jsonb, -- dados adicionais específicos
  sent: boolean,
  sent_at: timestamp,
  created_at: timestamp
}
```

## 🚀 Configuração

### 1. Executar a Migration

```bash
# Executar no Supabase Dashboard ou via CLI
supabase migration up
```

Isso criará:

- ✅ Tabelas `notification_preferences` e `notification_queue`
- ✅ Políticas RLS para segurança
- ✅ Triggers automáticos para enfileirar notificações
- ✅ Função para criar preferências padrão

### 2. Configurar Edge Functions

```bash
# Deploy das Edge Functions
supabase functions deploy send-notifications
supabase functions deploy daily-reminders
```

### 3. Configurar Variáveis de Ambiente no Supabase

No Supabase Dashboard → Settings → Edge Functions → Secrets:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx  # Sua API key do Resend
SITE_URL=https://bibliogame-zone.vercel.app  # URL do seu site
```

### 4. Configurar Resend

1. Criar conta em [Resend.com](https://resend.com)
2. Adicionar e verificar seu domínio (ou usar domínio de teste)
3. Gerar API Key
4. Adicionar API Key às variáveis de ambiente do Supabase

### 5. Configurar Cron Jobs

No Supabase Dashboard → Database → Cron Jobs (pg_cron):

```sql
-- Processar fila de notificações a cada 5 minutos
SELECT cron.schedule(
  'process-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/send-notifications',
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
    url:='https://your-project.supabase.co/functions/v1/daily-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

## 📧 Templates de E-mail

Todos os e-mails seguem um design consistente:

- **Header**: Gradiente roxo com logo/título
- **Content**: Conteúdo principal com CTA destacado
- **Footer**: Links úteis e gerenciamento de preferências
- **Responsivo**: Otimizado para desktop e mobile
- **Links Diretos**: Todos os e-mails têm links para o conteúdo específico

### Exemplos de E-mails

#### 1. Novo Seguidor

```
🎉 Novo seguidor!

Olá, João!
Maria Silva agora está seguindo você no ReadQuest!
[Ver perfil de Maria Silva]
```

#### 2. Nova Publicação

```
📝 Nova publicação

Olá, João!
Pedro Santos, que você segue, acabou de publicar:
"Acabei de terminar 1984 de George Orwell. Que experiência incrível!"
[Ver publicação completa]
```

#### 3. Lembrete de Leitura

```
📚 Lembrete de leitura

Olá, João!
Que tal dedicar alguns minutos à leitura hoje?
🔥 Você está em uma sequência de 7 dias! Não deixe ela acabar!

CONTINUANDO A LER:
1984 - George Orwell
[Acessar biblioteca]
```

## 🔒 Segurança e Privacidade

### Row Level Security (RLS)

- ✅ Usuários só podem ver suas próprias preferências
- ✅ Usuários só podem editar suas próprias preferências
- ✅ Notificações na fila são privadas
- ✅ Edge Functions usam Service Role Key para acesso

### Proteções Implementadas

- 🚫 Não notifica sobre próprias ações (ex: curtir próprio post)
- ✅ Verifica preferências antes de enfileirar
- ✅ Respeita master toggle de notificações
- ✅ Links de cancelamento em todos os e-mails

## 🎨 Interface do Usuário

### Página de Configurações

Localizada em: **Perfil → Aba Notificações**

Seções:

1. **Master Toggle**: Liga/desliga todas as notificações
2. **Atividades Sociais**: 4 tipos de notificações sociais
3. **Lembretes de Leitura**: Toggle + configuração de horário
4. **Informações**: Explicação sobre o sistema

Recursos de UX:

- ✨ Switches animados
- 🎯 Feedback visual imediato
- 💬 Descrições claras de cada opção
- ⏰ Seletor de horário intuitivo
- 🔔 Ícones representativos para cada tipo

## 🧪 Testando o Sistema

### 1. Testar Preferências

```javascript
// No console do navegador
const { data } = await supabase
  .from("notification_preferences")
  .select("*")
  .eq("user_id", "YOUR_USER_ID")
  .single();

console.log(data);
```

### 2. Testar Fila de Notificações

```javascript
// Seguir alguém e verificar se notificação foi enfileirada
const { data } = await supabase
  .from("notification_queue")
  .select("*")
  .eq("user_id", "TARGET_USER_ID")
  .eq("sent", false);

console.log(data);
```

### 3. Testar Edge Function Manualmente

```bash
# Via curl
curl -X POST \
  https://your-project.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 4. Verificar Logs das Edge Functions

No Supabase Dashboard → Edge Functions → Logs

## 📊 Monitoramento

### Métricas Importantes

- 📨 **Taxa de Entrega**: Quantos e-mails foram enviados com sucesso
- 📬 **Fila de Notificações**: Quantas notificações pendentes
- ⚙️ **Preferências Ativas**: Quantos usuários têm notificações habilitadas
- 📅 **Lembretes Enviados**: Quantos lembretes diários foram enviados

### Queries Úteis

```sql
-- Total de notificações pendentes
SELECT COUNT(*) FROM notification_queue WHERE sent = false;

-- Usuários com notificações habilitadas
SELECT COUNT(*) FROM notification_preferences WHERE email_notifications_enabled = true;

-- Taxa de envio nas últimas 24h
SELECT
  COUNT(*) FILTER (WHERE sent = true) as sent,
  COUNT(*) FILTER (WHERE sent = false) as pending,
  COUNT(*) as total
FROM notification_queue
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Tipos de notificações mais comuns
SELECT notification_type, COUNT(*) as count
FROM notification_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type
ORDER BY count DESC;
```

## 🐛 Troubleshooting

### Notificações não estão sendo enviadas

1. ✅ Verificar se RESEND_API_KEY está configurada
2. ✅ Verificar logs da Edge Function `send-notifications`
3. ✅ Verificar se cron job está ativo
4. ✅ Verificar se há notificações na fila (`sent = false`)

### E-mails não chegam

1. ✅ Verificar se domínio está verificado no Resend
2. ✅ Verificar pasta de spam
3. ✅ Verificar logs no dashboard do Resend
4. ✅ Verificar se email do usuário está correto

### Lembretes diários não funcionam

1. ✅ Verificar se `daily_reading_reminder` está true
2. ✅ Verificar se `email_notifications_enabled` está true
3. ✅ Verificar horário configurado vs horário atual
4. ✅ Verificar se já não leu hoje (não envia se já leu)

## 🔄 Fluxo Completo

### Exemplo: Usuário A curte publicação do Usuário B

```
1. Usuário A clica em "Curtir" no post do Usuário B
   ↓
2. Trigger `notify_on_like` é executado
   ↓
3. Verifica preferências do Usuário B
   ↓
4. Se notificações habilitadas:
   - Insere registro em notification_queue
   ↓
5. Cron job executa send-notifications (a cada 5 min)
   ↓
6. Edge Function:
   - Lê notificações pendentes
   - Busca dados do usuário (email, nome)
   - Busca dados de quem curtiu (nome)
   - Gera template HTML
   - Envia via Resend
   - Marca como enviada (sent = true)
   ↓
7. Usuário B recebe e-mail:
   "João Silva curtiu sua publicação!"
   [Ver publicação]
```

## 📝 Próximas Melhorias

### Futuras Features

- [ ] Notificações in-app (além de e-mail)
- [ ] Digest semanal (resumo semanal de atividades)
- [ ] Preferências de frequência (imediato, diário, semanal)
- [ ] Notificações push (PWA)
- [ ] Templates personalizáveis
- [ ] A/B testing de templates
- [ ] Analytics de engajamento com e-mails
- [ ] Sugestões baseadas em IA

### Otimizações Técnicas

- [ ] Batch sending (enviar múltiplos e-mails de uma vez)
- [ ] Rate limiting por usuário
- [ ] Deduplicação (evitar múltiplas notificações do mesmo tipo)
- [ ] Retry automático em caso de falha
- [ ] Queue prioritization (priorizar certos tipos)

## 🤝 Contribuindo

Para adicionar novos tipos de notificação:

1. **Adicionar trigger SQL** na migration
2. **Adicionar template** em `send-notifications/index.ts`
3. **Adicionar toggle** em `NotificationSettings.tsx`
4. **Adicionar campo** em `notification_preferences` (migration)
5. **Testar** o fluxo completo

## 📚 Recursos

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentação Resend](https://resend.com/docs)
- [Documentação pg_cron](https://github.com/citusdata/pg_cron)
- [Best Practices para E-mail Transacional](https://www.emailonacid.com/blog/article/email-development/email-best-practices/)

## 📄 Licença

Este sistema faz parte do ReadQuest e segue a mesma licença do projeto
principal.
