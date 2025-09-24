import { Book, User, Achievement, RankingUser } from "@/types/reading";

export const mockUser: User = {
  id: "user1",
  name: "João Silva",
  email: "joao@example.com",
  points: 350,
  level: "Explorador",
  booksCompleted: 12,
  totalPagesRead: 2847,
  joinDate: new Date("2024-01-15"),
};

export const mockBooks: Book[] = [
  {
    id: "book1",
    title: "Dom Casmurro",
    author: "Machado de Assis",
    totalPages: 250,
    pagesRead: 180,
    status: "reading",
    dateAdded: new Date("2024-02-01"),
  },
  {
    id: "book2",
    title: "O Cortiço",
    author: "Aluísio Azevedo",
    totalPages: 320,
    pagesRead: 320,
    status: "completed",
    dateAdded: new Date("2024-01-20"),
    dateCompleted: new Date("2024-02-10"),
  },
  {
    id: "book3",
    title: "1984",
    author: "George Orwell",
    totalPages: 400,
    pagesRead: 0,
    status: "want-to-read",
    dateAdded: new Date("2024-02-15"),
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: "ach1",
    title: "Primeiro Livro",
    description: "Complete sua primeira leitura",
    icon: "book",
    rarity: "common",
    unlocked: true,
    unlockedAt: new Date("2024-01-25"),
    requirement: { type: "books_read", value: 1 },
  },
  {
    id: "ach2",
    title: "Devorador de Páginas",
    description: "Leia 1000 páginas",
    icon: "pages",
    rarity: "rare",
    unlocked: true,
    unlockedAt: new Date("2024-02-05"),
    requirement: { type: "pages_read", value: 1000 },
  },
  {
    id: "ach3",
    title: "Bibliófilo",
    description: "Complete 10 livros",
    icon: "library",
    rarity: "epic",
    unlocked: true,
    unlockedAt: new Date("2024-02-20"),
    requirement: { type: "books_read", value: 10 },
  },
  {
    id: "ach4",
    title: "Mestre dos Livros",
    description: "Complete 50 livros",
    icon: "crown",
    rarity: "legendary",
    unlocked: false,
    requirement: { type: "books_read", value: 50 },
  },
];

export const mockRanking: RankingUser[] = [
  { id: "user1", name: "João Silva", points: 350, level: "Explorador", booksCompleted: 12, rank: 1 },
  { id: "user2", name: "Maria Santos", points: 320, level: "Explorador", booksCompleted: 11, rank: 2 },
  { id: "user3", name: "Pedro Costa", points: 290, level: "Aventureiro", booksCompleted: 9, rank: 3 },
  { id: "user4", name: "Ana Lima", points: 260, level: "Aventureiro", booksCompleted: 8, rank: 4 },
  { id: "user5", name: "Carlos Mendes", points: 230, level: "Aventureiro", booksCompleted: 7, rank: 5 },
  { id: "user6", name: "Luisa Oliveira", points: 200, level: "Iniciante", booksCompleted: 6, rank: 6 },
  { id: "user7", name: "Ricardo Silva", points: 180, level: "Iniciante", booksCompleted: 5, rank: 7 },
  { id: "user8", name: "Sofia Pereira", points: 150, level: "Iniciante", booksCompleted: 4, rank: 8 },
  { id: "user9", name: "Miguel Reis", points: 120, level: "Iniciante", booksCompleted: 3, rank: 9 },
  { id: "user10", name: "Clara Nunes", points: 100, level: "Iniciante", booksCompleted: 2, rank: 10 },
];

export const getUserLevel = (points: number): string => {
  if (points >= 500) return "Mestre";
  if (points >= 200) return "Explorador";
  if (points >= 50) return "Aventureiro";
  return "Iniciante";
};

export const getPointsForNextLevel = (currentPoints: number): number => {
  if (currentPoints < 50) return 50 - currentPoints;
  if (currentPoints < 200) return 200 - currentPoints;
  if (currentPoints < 500) return 500 - currentPoints;
  return 0;
};