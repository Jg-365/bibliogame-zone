# Correções de Bugs: Sistema de Streak e Estatísticas do Usuário

## Problemas Identificados

### 1. Sistema de Streak não funcionando

**Causa**: Inconsistência nos nomes dos campos entre o banco de dados e o código

**Campos no banco**:

- `current_streak` (sequência atual)
- `longest_streak` (melhor sequência)
- `last_activity_date` (última atividade)

**Campos que o código estava procurando**:

- `reading_streak` (não existe)
- `best_streak` (não existe)
- `last_activity` (não existe)

### 2. Estatísticas do usuário não aparecendo

**Causa**: Hook `useStreakUpdate` não existia, apesar de ser importado e usado

### 3. Triggers do banco inconsistentes

**Causa**: Migrações diferentes usaram nomes de campos diferentes ao longo do
tempo

## Correções Implementadas

### 1. ✅ Criado hook `useStreakUpdate.tsx`

- Implementada lógica completa de atualização de streak
- Usa nomes corretos dos campos do banco
- Inclui notificações para marcos de streak (1 dia, múltiplos de 7, recordes)

### 2. ✅ Corrigido hook `useDashboard.ts`

- Atualizado para usar `longest_streak` em vez de `best_streak`

### 3. ✅ Criado botão de debug `DebugStatsButton.tsx`

- Permite atualização manual das estatísticas
- Força recálculo de streak
- Útil para testes e resolução de problemas

### 4. ✅ Criada migração de correção `20250101000000_fix_field_names.sql`

- Corrige função `update_reading_streak_on_session()` para usar campos corretos
- Atualiza função `check_broken_streaks()`
- Corrige função `check_and_grant_achievements()` para streak

### 5. ✅ Scripts de debug SQL

- `debug_streak.sql`: Para testar triggers e verificar dados
- `manual_stats_update.sql`: Para correção manual no banco

## Como Testar

1. **No Dashboard**: Use os botões "Atualizar Stats Manualmente" e "Atualizar
   Streak Manualmente"

2. **Criar sessão de leitura**: Adicione uma sessão de leitura e verifique se:

   - As estatísticas de páginas lidas aumentam
   - O streak é atualizado (se for um novo dia)
   - Notificações de streak aparecem

3. **Verificar no banco**: Execute os scripts SQL para verificar dados
   diretamente

## Arquivos Modificados

### Novos arquivos:

- `src/hooks/useStreakUpdate.tsx`
- `src/components/DebugStatsButton.tsx`
- `supabase/migrations/20250101000000_fix_field_names.sql`
- `debug_streak.sql`
- `manual_stats_update.sql`

### Arquivos modificados:

- `src/features/dashboard/hooks/useDashboard.ts`
- `src/features/dashboard/components/Dashboard.tsx`
- `src/hooks/useProfile.tsx`

## ⚠️ PRÓXIMO PASSO OBRIGATÓRIO

**VOCÊ PRECISA EXECUTAR O SQL NO SUPABASE DASHBOARD PRIMEIRO!**

1. 📋 Abra o arquivo `INSTRUCOES_SUPABASE.md`
2. 🔧 Siga as instruções para executar o SQL no Supabase Dashboard
3. ✅ Após executar o SQL, teste com os botões de debug
4. 🧹 Remover os botões de debug após confirmar que tudo funciona

**Sem executar o SQL no banco, as correções não terão efeito!**
