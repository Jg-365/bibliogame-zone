# 📚 ReadQuest - Plataforma Gamificada de Leitura

Uma plataforma moderna e gamificada para acompanhar e compartilhar sua jornada de leitura com recursos sociais, sistema de conquistas e design responsivo completo.

## ✨ Recursos Principais

### 📖 Gestão de Livros

- Busca integrada com Google Books API
- Adição manual de livros personalizados
- Acompanhamento de progresso de leitura
- Estados de livros (Quero Ler, Lendo, Concluído)
- Histórico completo de sessões de leitura

### 🔥 Sistema de Sequência (Streaks)

- Contagem automática de dias consecutivos de leitura
- Animações e celebrações para marcos alcançados
- Acompanhamento visual da sequência atual e recorde
- Integração automática com sessões de leitura

### 🏆 Gamificação e Conquistas

- Sistema de pontos por páginas lidas
- Conquistas desbloqueáveis por marcos
- Níveis de usuário baseados em múltiplos critérios
- Leaderboards públicos por diferentes métricas

### 👥 Recursos Sociais

- Feed social com posts sobre leituras
- Sistema de curtidas e comentários
- Posts automáticos para sessões e conquistas
- Compartilhamento de reflexões sobre livros

### 🌐 Design Responsivo Completo

- Interface adaptável para desktop, tablet e mobile
- Navegação otimizada para cada dispositivo
- Menu lateral para desktop, navegação inferior para mobile
- Experiência consistente em todas as telas

### 🧭 Sistema de Navegação (4 Seções)

1. **Dashboard** - Visão geral e estatísticas
2. **Social** - Feed social e interações
3. **Ranking** - Leaderboards públicos
4. **Profile** - Perfil e configurações

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, Radix UI Components
- **Animações**: Framer Motion
- **Backend**: Supabase (PostgreSQL, Authentication, RLS)
- **Testes**: Playwright (E2E Testing)
- **Estado**: TanStack Query (React Query)
- **Ícones**: Lucide React

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

### Configuração do Ambiente

1. **Clone o repositório**

```bash
git clone https://github.com/your-username/bibliogame-zone.git
cd bibliogame-zone
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure o Supabase**

- Crie um projeto no [Supabase](https://supabase.com)
- Execute as migrações do banco de dados:
  ```bash
  # Execute todas as migrações na ordem:
  # 1. 20250924124125_1b258378-f466-4719-bba3-4c87ff7657af.sql
  # 2. 20250924140000_complete_gamification_system.sql
  # 3. 20250924160000_fix_activity_feed_policies.sql
  # 4. 20250924163019_fix_follows_foreign_keys.sql
  # 5. 20250924164000_fix_follows_user_id.sql
  # 6. 20250924170000_achievement_system.sql
  # 7. 20250924170000_add_custom_books_support.sql
  # 8. 20250924170001_add_profile_columns.sql
  # 9. 20250924180000_cleanup_achievements.sql
  # 10. 20250925111150_delete_user_function.sql
  # 11. 20250925111200_fix_achievements_function.sql
  # 12. 20250930141500_social_system.sql
  # 13. 20250930150000_streak_system.sql
  ```

4. **Configure as variáveis de ambiente**

```bash
# Crie o arquivo .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Execute o projeto**

```bash
npm run dev
```

## 🧪 Testes

### Executar Testes E2E

```bash
# Executar todos os testes
npx playwright test

# Executar testes em modo interativo
npx playwright test --ui

# Executar testes específicos
npx playwright test readquest.spec.ts

# Gerar relatório HTML
npx playwright show-report
```

### Cobertura de Testes

- ✅ Autenticação de usuários
- ✅ Navegação responsiva
- ✅ Funcionalidades do dashboard
- ✅ Sistema de livros
- ✅ Recursos sociais
- ✅ Design responsivo em múltiplos dispositivos

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes de interface (Radix UI)
│   ├── Navigation.tsx   # Sistema de navegação principal
│   ├── StreakDisplay.tsx # Exibição visual da sequência
│   ├── StreakBadge.tsx  # Badge compacto da sequência
│   └── ...
├── hooks/               # Custom hooks
│   ├── useAuth.tsx      # Autenticação
│   ├── useProfile.tsx   # Dados do perfil
│   ├── useBooks.tsx     # Gestão de livros
│   ├── useStreakUpdate.tsx # Sistema de streaks
│   └── ...
├── pages/               # Páginas principais
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Social.tsx       # Feed social
│   ├── Ranking.tsx      # Leaderboards
│   ├── Profile.tsx      # Perfil do usuário
│   └── ...
├── integrations/        # Integrações externas
│   └── supabase/        # Cliente e tipos do Supabase
└── types/               # Definições de tipos TypeScript
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- `profiles` - Dados dos usuários e estatísticas
- `books` - Biblioteca de livros dos usuários
- `reading_sessions` - Sessões de leitura detalhadas
- `achievements` - Conquistas disponíveis
- `user_achievements` - Conquistas desbloqueadas pelos usuários

### Sistema Social

- `posts` - Posts do feed social
- `post_likes` - Curtidas em posts
- `post_comments` - Comentários em posts

### Recursos de Segurança

- Row Level Security (RLS) em todas as tabelas
- Políticas de acesso baseadas na autenticação
- Triggers automáticos para atualizações de estatísticas

## 🔄 Sistema de Streaks

O sistema de sequência monitora automaticamente a atividade de leitura:

1. **Detecção Automática**: Atualiza a sequência quando uma sessão é registrada
2. **Lógica de Continuidade**: Verifica dias consecutivos de leitura
3. **Celebrações**: Animações especiais para marcos importantes
4. **Persistência**: Mantém histórico de sequência atual e recorde

## 🎨 Design System

- **Cores**: Sistema de cores consistente com modo claro/escuro
- **Tipografia**: Hierarquia tipográfica clara
- **Espaçamento**: Grid system baseado em Tailwind CSS
- **Componentes**: Biblioteca de componentes reutilizáveis
- **Animações**: Transições suaves com Framer Motion

## 🚀 Deploy e Produção

### Preparação para Deploy

```bash
# Build de produção
npm run build

# Preview do build
npm run preview
```

### Sugestões de Hosting

- **Vercel** (Recomendado para React)
- **Netlify**
- **AWS Amplify**
- **Firebase Hosting**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para a comunidade de leitores

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend as a Service
- [Radix UI](https://radix-ui.com) - Componentes de interface
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS
- [Framer Motion](https://framer.com/motion) - Animações
- [Lucide](https://lucide.dev) - Ícones
