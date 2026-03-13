import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        xs: "0.75rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        xs: "375px",
        xxs: "320px",
      },

      /* ── Font Families ── */
      fontFamily: {
        display: ["Newsreader", "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },

      /* ── Colors (mapped from CSS variables) ── */
      colors: {
        border: {
          DEFAULT: "hsl(var(--border))",
          subtle: "hsl(var(--border-subtle))",
          accent: "hsl(var(--border-accent))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "text-secondary": "hsl(var(--text-secondary))",
        "text-tertiary": "hsl(var(--text-tertiary))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          hover: "hsl(var(--success-hover))",
          glow: "hsl(var(--success-glow))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      /* ── Background images / gradients ── */
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-success": "var(--gradient-success)",
        "gradient-gold": "var(--gradient-gold)",
        "gradient-background": "var(--gradient-background)",
        "gradient-glass": "var(--gradient-glass)",
        "gradient-rarity-epic": "var(--gradient-rarity-epic)",
        "gradient-rarity-legendary": "var(--gradient-rarity-legendary)",
      },

      /* ── Box shadows ── */
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
        amber: "var(--shadow-amber)",
        emerald: "var(--shadow-emerald)",
        lg: "var(--shadow-lg)",
      },

      /* ── Border radii ── */
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },

      /* ── Keyframes ── */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: { height: "0" },
        },
        "rq-slide-up": {
          from: {
            transform: "translateY(16px)",
            opacity: "0",
          },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "rq-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "rq-badge-pop": {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "65%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "rq-count-up": {
          from: {
            transform: "translateY(8px)",
            opacity: "0",
          },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "rq-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "rq-pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 8px hsl(var(--primary-glow) / 0.3)",
          },
          "50%": {
            boxShadow: "0 0 24px hsl(var(--primary-glow) / 0.6)",
          },
        },
        "rq-shimmer": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(200%)" },
        },
        "rq-spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },

      /* ── Animation utilities ── */
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "rq-slide-up 0.4s cubic-bezier(0.0, 0, 0.2, 1) both",
        "fade-in": "rq-fade-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) both",
        "badge-pop": "rq-badge-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "count-up": "rq-count-up 0.4s cubic-bezier(0.0, 0, 0.2, 1) both",
        float: "rq-float 3s ease-in-out infinite",
        "pulse-glow": "rq-pulse-glow 2.5s ease-in-out infinite",
        shimmer: "rq-shimmer 1.5s linear infinite",
        "spin-slow": "rq-spin-slow 8s linear infinite",
      },

      /* ── Spacing additions ── */
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
      },

      /* ── Transition durations ── */
      transitionDuration: {
        "80": "80ms",
        "250": "250ms",
        "400": "400ms",
        "600": "600ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
