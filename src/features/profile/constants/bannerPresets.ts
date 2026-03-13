export interface BannerPreset {
  id: string;
  name: string;
  imageUrl: string;
}

export const PROFILE_BANNER_PRESETS: BannerPreset[] = [
  {
    id: "library-wood",
    name: "Biblioteca Clássica",
    imageUrl:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "cozy-desk",
    name: "Mesa Cozy",
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "tech-librarian",
    name: "Tech Librarian",
    imageUrl:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "night-reading",
    name: "Leitura Noturna",
    imageUrl:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "paper-texture",
    name: "Papel Editorial",
    imageUrl:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "minimal-study",
    name: "Estúdio Minimal",
    imageUrl:
      "https://images.unsplash.com/photo-1455885666463-9d791bcb9cd0?auto=format&fit=crop&w=1600&q=80",
  },
];
