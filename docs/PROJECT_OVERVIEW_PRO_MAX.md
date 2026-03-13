# Project Overview � ReadQuest (Bibliogame Zone)

Data: 2026-03-12  
Escopo: vis�o completa de produto, arquitetura, UX, dados, qualidade e evolu��o estrat�gica.

## 1) Resumo executivo

ReadQuest � uma plataforma de leitura gamificada com foco em:

- Gest�o de biblioteca pessoal
- Registro de sess�es de leitura e progresso por p�ginas
- Sistema de pontos, n�veis, conquistas e streak
- Camada social (feed, ranking, busca de usu�rios, intera��es)
- Perfil p�blico e privado com estat�sticas

Estado atual: base funcional j� madura para um app de leitura social, com boa componentiza��o (shadcn/ui + Tailwind), cache via React Query, integra��o Supabase e arquitetura de p�ginas principal consistente.

## 2) Stack e fundamentos t�cnicos

- Frontend: React 18 + TypeScript + Vite
- Roteamento: React Router
- Estado ass�ncrono/cache: @tanstack/react-query
- UI primitives: Radix + shadcn/ui
- Estilo: Tailwind + design tokens CSS vars
- Backend: Supabase (Auth, Postgres, Storage)
- Motion: Framer Motion
- Testes: Vitest + Testing Library + MSW + Playwright

## 3) Mapa de navega��o e dom�nio

Rotas principais identificadas:

- `/social-feed`
- `/search`
- `/library`
- `/profile`
- `/user/:userId`
- Fluxos auth/reset: `/forgot-password`, `/reset-password`

Dom�nios centrais:

- Leitura: livros, sess�es, p�ginas, status
- Engajamento: pontos, n�veis, streak, conquistas
- Social: posts, likes, coment�rios, follow, ranking
- Perfil: identidade, estat�sticas, personaliza��o

## 4) Arquitetura de frontend (vis�o pr�tica)

Padr�es presentes:

- Separa��o por `pages`, `components`, `hooks`, `features`, `shared`
- Hooks especializados por dom�nio (`useBooks`, `useProfile`, `useReadingSessions`, social/\*)
- Componentes base reutiliz�veis em `src/components/ui`
- Layout base com `PageShell`/`PageHeader`/`PageSection`
- Theme provider com toggle dark mode

Pontos fortes:

- Escalabilidade razo�vel para crescimento incremental
- Boa reutiliza��o de primitives
- Cache agressivo j� aplicado em diversas consultas

## 5) Camada de dados e consist�ncia

Entidades relevantes observadas:

- `profiles`
- `books`
- `reading_sessions`
- `social_posts`, `post_likes`, `post_comments`
- `follows`
- `achievements`, `user_achievements`

Regras-chave ativas:

- Pontua��o consolidada: 1 ponto por p�gina + 50 por livro conclu�do
- Ranking agora derivado de dados reais (livros/sess�es), mitigando hardcode e drift

Risco residual:

- Em alguns pontos do projeto ainda h� campos legados coexistindo (`points`, `reading_level`, `total_books_read`) e diferen�as de origem de verdade em m�dulos antigos.

## 6) UX e design system atual

Dire��o visual:

- Linguagem premium com card surfaces, contraste controlado, dark mode
- Padr�o de fundo �cozy + tech + librarian�
- Navega��o responsiva com foco em hotspots (ranking, adicionar p�ginas, social)
- Feedback t�til implementado para cliques mobile (haptics)

Padr�es existentes:

- Bot�es com variantes e estados
- Tabs, dialogs, dropdowns, badges, cards, skeletons
- Estados de carregamento e vazio em boa parte dos fluxos

## 7) Social: estado atual

Funcionalidades:

- Criar post com texto, livro relacionado e imagem
- Curtir, comentar, compartilhar
- Feed de atividades
- Ranking de leitores
- Busca de usu�rios

Qualidade percebida:

- Intera��es principais operacionais
- Melhorias recentes em mobile-first e dark mode
- Cache e placeholderData reduzem sensa��o de lat�ncia

## 8) Perfil e personaliza��o

Perfil privado:

- Hero com n�vel, pontos, streak
- Abas de livros, sequ�ncia, conquistas
- Gest�o de perfil com avatar e estat�sticas

Personaliza��o atual:

- Banner com presets curados e upload local por usu�rio
- Persist�ncia via localStorage

Gap para produ��o enterprise:

- Falta persistir banner no banco/storage com URL assinada/p�blica e pol�tica de modera��o/limites.

## 9) Performance e custo

Boas pr�ticas j� presentes:

- Lazy loading por rota
- Query cache com stale/gc agressivos
- Refetch reduzido
- placeholders para transi��es suaves

Dire��o de baixo custo (usage):

- Preferir agrega��es SQL no Supabase em vez de computar tudo no cliente
- TTLs diferentes por tipo de dado
- Pr�-busca apenas em hotspots de alta probabilidade
- IA com janela curta, RAG resumido e modelos econ�micos por tarefa

## 10) Qualidade, testes e observabilidade

Pontos positivos:

- Infra de testes j� configurada (unit/integration/e2e)
- Documenta��o t�cnica existente em `docs/`

Pontos cr�ticos:

- D�vida de lint global ainda alta (warnings e erros hist�ricos em v�rios m�dulos)
- Trechos com `any`, `console`, hooks condicionais e problemas de a11y em partes legadas

## 11) Seguran�a e privacidade (estado e recomenda��es)

- Uso de Supabase simplifica auth/storage/policies
- Recomendado revisar RLS integral por tabela social e de perfil
- Adotar sanitiza��o/limites em upload e conte�do user-generated
- Adotar trilha de auditoria para muta��es sens�veis

## 12) Backlog t�cnico priorit�rio sugerido (curto prazo)

1. Consolidar �single source of truth� de estat�sticas em views/fun��es SQL
2. Resolver lint errors bloqueantes por dom�nio
3. Persistir apar�ncia de perfil (banner/theme) no backend
4. Completar exclus�o de coment�rios e modera��o social
5. Estruturar telemetria de funil e reten��o

## 13) Vis�o estrat�gica de reten��o

Para elevar recorr�ncia di�ria/semanal:

- Loop de h�bito (gatilho ? a��o m�nima ? recompensa ? progress�o)
- Recompensas pequenas e frequentes (n�o s� marcos longos)
- Social proof e colabora��o (clubes, desafios, co-leitura)
- IA como copiloto de leitura (descoberta, resumo, debate, plano)

---

## 14) 50 propostas (funcionais + n�o funcionais + casos de uso + d�vidas + avalia��es)

1. Miss�es di�rias de leitura com dificuldade adaptativa.
2. Meta semanal inteligente baseada no hist�rico real do usu�rio.
3. Calend�rio de consist�ncia com recompensas progressivas.
4. �Retomar de onde parei� com CTA �nico no topo.
5. Modo foco de sess�o com timer Pomodoro de leitura.
6. Streak com prote��o contextual e explica��o clara de regra.
7. Sistema de �mini vit�rias� por microprogresso (5/10/15 p�ginas).
8. Cards de recomenda��o contextual por humor/tempo dispon�vel.
9. Recomenda��o por similaridade de leitores com perfil pr�ximo.
10. Recomenda��o h�brida (conte�do + colabora��o + popularidade local).
11. Ranking por janelas (semana/m�s) al�m do acumulado.
12. Ligas sazonais para reduzir vantagem de usu�rios antigos.
13. Clubes de leitura privados e p�blicos.
14. Desafios entre amigos (quem l� X p�ginas em Y dias).
15. Badges de qualidade de revis�o (n�o s� quantidade).
16. Feed com relev�ncia personalizada (score por afinidade).
17. Notifica��es inteligentes de retorno (anti-spam, hor�rio ideal).
18. �Resumo da semana� com progresso e pr�ximos passos.
19. Compartilhamento social com template visual premium.
20. Perfil p�blico com conquistas em destaque e trilha recente.
21. P�gina de descoberta com trilhas tem�ticas (Sci-Fi, carreira etc.).
22. Busca sem�ntica de livros por inten��o (�livro curto e inspirador�).
23. Filtro por tempo estimado de leitura restante.
24. Sess�o de leitura por voz (hands-free) para registrar p�ginas.
25. Captura OCR opcional de p�ginas para avan�ar progresso.
26. Leitura colaborativa (coorte) com checkpoints comuns.
27. �Mentor de leitura� por IA com plano de 30 dias.
28. Chat com IA sobre livro atual (sem spoilers por padr�o).
29. Debate socr�tico com IA (perguntas que aprofundam entendimento).
30. IA para gerar flashcards e revis�o espa�ada de n�o fic��o.
31. IA para resumir cap�tulos em n�veis (r�pido/detalhado/cr�tico).
32. RAG leve com notas do pr�prio usu�rio para respostas personalizadas.
33. Integra��o Groq/Llama com roteamento de custo por tarefa.
34. Guardrails de custo: limite di�rio de tokens por usu�rio.
35. Cache de respostas de IA por hash de prompt/contexto.
36. �Prompt compression� autom�tica para reduzir uso de tokens.
37. Ranking de qualidade de leitura (consist�ncia + reflex�o).
38. Pipeline de modera��o de conte�do social (texto/imagem).
39. Migra��o de hardcodes remanescentes para config/tokens/tabelas.
40. Tabela de eventos anal�ticos (product analytics) padronizada.
41. Coortes de reten��o D1/D7/D30 com dashboards nativos.
42. Feature flags para releases graduais e experimentos A/B.
43. Testes de regress�o visual para componentes cr�ticos.
44. Auditoria de acessibilidade cont�nua no CI.
45. SLA de performance (LCP, INP, CLS) por p�gina principal.
46. Offline-first parcial para registrar sess�es sem conex�o.
47. Sincroniza��o eventual com fila local resiliente.
48. Onboarding progressivo por perfil de leitor (iniciante/avan�ado).
49. Sistema de economia interna (moedas/recompensas cosm�ticas).
50. Roadmap de design system v2 com tokens versionados e guidelines de contribui��o.

---

## 15) Recomenda��o direta para IA com baixo consumo (Groq/Llama)

Estrat�gia pr�tica:

- Modelos menores por default (classifica��o, reescrita, extra��o).
- Modelos maiores s� em tarefas premium (debate profundo).
- Contexto curto com sumariza��o incremental.
- Cache agressivo por usu�rio + livro + cap�tulo.
- Limite di�rio de chamadas por feature e fallback local.

Resultado esperado: aumento de reten��o sem explos�o de custo, mantendo experi�ncia de alto valor percebido.
