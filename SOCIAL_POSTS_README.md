# 📚 Sistema de Posts Sociais - Instagram de Livros

## 🎉 Funcionalidades Implementadas

### ✅ Sistema Completo de Posts

- **Criar Posts**: Componente `CreatePost` com interface intuitiva
- **Feed de Posts**: Visualização em tempo real dos posts da comunidade
- **Upload de Imagens**: Suporte a imagens nos posts via Supabase Storage
- **Associação com Livros**: Posts podem ser vinculados a livros da biblioteca
  do usuário

### ✅ Sistema de Interações

- **Curtidas**: Sistema completo de like/unlike com contadores em tempo real
- **Comentários**: Sistema de comentários aninhados com possibilidade de
  exclusão
- **Ações Contextuais**: Menu de ações para posts próprios (editar/excluir)

### ✅ Interface Responsiva

- **Mobile-First**: Design otimizado para dispositivos móveis
- **Tabs de Navegação**: Posts, Atividades e Ranking organizados em abas
- **Cards Interativos**: Design atrativo inspirado em redes sociais

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### `social_posts`

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → auth.users)
- content: TEXT (conteúdo do post)
- book_id: UUID (Foreign Key → books, opcional)
- image_url: TEXT (URL da imagem, opcional)
- likes_count: INTEGER (contador de curtidas)
- comments_count: INTEGER (contador de comentários)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `post_likes`

```sql
- id: UUID (Primary Key)
- post_id: UUID (Foreign Key → social_posts)
- user_id: UUID (Foreign Key → auth.users)
- created_at: TIMESTAMP
- UNIQUE(post_id, user_id) (evita likes duplicados)
```

#### `post_comments`

```sql
- id: UUID (Primary Key)
- post_id: UUID (Foreign Key → social_posts)
- user_id: UUID (Foreign Key → auth.users)
- content: TEXT (conteúdo do comentário)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Funções SQL Otimizadas

#### `get_social_posts_feed()`

- Busca posts com dados do usuário, livro e status de like
- Suporte a paginação (limit/offset)
- JOIN otimizado com profiles e books

#### `get_post_comments()`

- Busca comentários de um post específico
- Inclui dados do usuário autor do comentário
- Ordenação cronológica

### Triggers Automáticos

- **Contadores automáticos**: Atualização automática de `likes_count` e
  `comments_count`
- **Timestamps**: Atualização automática de `updated_at`

## 🔐 Segurança (RLS)

### Políticas Implementadas

- **Posts**: Usuários podem ver todos os posts, mas só editar/excluir os
  próprios
- **Likes**: Usuários podem curtir qualquer post, mas só remover seus próprios
  likes
- **Comentários**: Usuários podem comentar em qualquer post, mas só
  editar/excluir seus próprios comentários

## 🛠️ Componentes Criados

### `CreatePost.tsx`

- Interface para criar novos posts
- Upload de imagens
- Seleção de livros da biblioteca
- Validações de conteúdo
- Preview em tempo real

### `PostCard.tsx`

- Exibição individual de posts
- Sistema de curtidas interativo
- Seção de comentários expansível
- Ações contextuais (excluir post próprio)
- Design responsivo

### `SocialSection.tsx` (Atualizado)

- Integração com sistema de posts
- Navegação por abas (Posts, Atividades, Ranking)
- Feed infinito de posts
- Estados de carregamento e vazio

## 🎣 Hooks Criados

### `usePosts.tsx`

- **Hook principal** para gerenciamento de posts
- Operações: buscar, criar, curtir, excluir posts
- **Cache inteligente** com React Query
- **Otimistic updates** para melhor UX

### `usePostComments.tsx`

- Gerenciamento específico de comentários
- Operações: buscar, criar, excluir comentários
- Integrado com o sistema principal de posts

### `useImageUpload.tsx`

- Upload otimizado para Supabase Storage
- Geração de nomes únicos
- Tratamento de erros
- Estados de carregamento

## 🚀 Como Usar

### 1. Aplicar Migration

```bash
# A migration já está criada em:
supabase/migrations/20251002120000_social_posts_system.sql
```

### 2. Configurar Storage (se necessário)

```sql
-- Criar bucket para imagens dos posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Políticas de acesso ao storage
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Images are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'images');
```

### 3. Usar no Frontend

```tsx
import { SocialSection } from "@/components/SocialSection";

// A SocialSection já está integrada no Dashboard
// O sistema está pronto para uso!
```

## 📱 Funcionalidades da Interface

### Criar Post

1. Clique no campo "Compartilhe sua experiência de leitura..."
2. Digite o conteúdo do post (até 500 caracteres)
3. Opcionalmente selecione um livro da sua biblioteca
4. Opcionalmente adicione uma imagem
5. Clique em "Publicar"

### Interagir com Posts

- **Curtir**: Clique no botão ❤️ "Curtir"
- **Comentar**: Clique em "Comentar" e digite seu comentário
- **Compartilhar**: Clique em "Compartilhar" (funcionalidade futura)

### Gerenciar Posts Próprios

- Clique no menu ⋯ no canto superior direito do seu post
- Selecione "Excluir post" para remover

## 🎨 Design System

### Cores e Temas

- **Integrado** com o design system existente
- **Modo escuro** compatível
- **Cores semânticas** para ações (curtir = vermelho, etc.)

### Responsividade

- **Mobile-first** design
- **Breakpoints** otimizados para tablets e desktop
- **Touch-friendly** buttons e interações

## 🔮 Próximas Funcionalidades

### Em Desenvolvimento

- [ ] **Sistema de Seguir Usuários**
- [ ] **Notificações em Tempo Real**
- [ ] **Grupos de Leitura**
- [ ] **Hashtags e Busca**
- [ ] **Stories temporários**
- [ ] **Reações diversas** (além de curtidas)

### Melhorias Técnicas

- [ ] **Infinite scroll** no feed
- [ ] **Cache offline** com Service Workers
- [ ] **Compressão de imagens** automática
- [ ] **Moderação de conteúdo**

## 🐛 Solução de Problemas

### Problemas Comuns

1. **Posts não aparecem**

   - Verifique se a migration foi aplicada
   - Confirme as políticas RLS no Supabase

2. **Upload de imagem falha**

   - Verifique configuração do Storage
   - Confirme políticas de acesso ao bucket 'images'

3. **Likes não funcionam**
   - Verifique se o usuário está autenticado
   - Confirme triggers de contadores no banco

### Logs e Debug

```tsx
// Para debug, adicione logs nos hooks:
console.log("Posts:", posts);
console.log("Is loading:", isLoading);
console.log("User:", user);
```

---

🎉 **O sistema de posts está completamente funcional e pronto para uso!**

Agora a ReadQuest tem um verdadeiro "Instagram de livros" onde os usuários podem
compartilhar suas experiências de leitura, curtir e comentar posts de outros
leitores, criando uma comunidade engajada em torno da paixão pelos livros! 📚✨
