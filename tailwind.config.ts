import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── v4 tokens ──────────────────────────────────────────
        night:           "var(--night)",
        "deep-blue":     "var(--deep-blue)",
        "forest-night":  "var(--forest-night)",
        "forest-dark":   "var(--forest-dark)",
        "forest-mid":    "var(--forest-mid)",
        "forest-bright": "var(--forest-bright)",
        "surface-dim":   "var(--surface-dim)",
        warn:            "var(--warn)",

        // ── Shared tokens (used by both v3 and v4 components) ──
        surface:         "var(--surface)",
        firefly:         "var(--firefly)",
        "firefly-glow":  "var(--firefly-glow)",
        tina:            "var(--tina)",
        toto:            "var(--toto)",
        magic:           "var(--magic)",
        "magic-bright":  "var(--magic-bright)",
        ink:             "var(--ink)",
        success:         "var(--success)",
        forest:          "var(--forest-mid)",
        "forest-deep":   "var(--forest-dark)",

        // ── v3 backward-compat aliases ─────────────────────────
        "bg-twilight":    "var(--deep-blue)",
        "bg-forest-dark": "var(--forest-dark)",
        "firefly-bright": "var(--firefly-bright)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)",    "sans-serif"],
        akshar:  ["var(--font-akshar)",  "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "glow-fire":    "0 0 24px 6px rgba(255,200,74,0.35)",
        "glow-success": "0 0 24px 6px rgba(0,200,150,0.35)",
        "glow-tina":    "0 0 24px 6px rgba(255,107,157,0.4)",
        "glow-toto":    "0 0 24px 6px rgba(78,205,196,0.4)",
        "firefly":      "0 0 12px 4px rgba(255,200,74,0.3)",
        "firefly-lg":   "0 0 24px 8px rgba(255,200,74,0.35)",
        "card":         "0 8px 32px rgba(0,0,0,0.3)",
        "card-lg":      "0 16px 48px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "night-sky":          "linear-gradient(180deg,#060B18 0%,#0D1117 40%,#141B35 100%)",
        "forest-sky":         "linear-gradient(180deg,#060E0A 0%,#0A1810 40%,#16241C 100%)",
        "dawn-forest":        "linear-gradient(180deg,#0D1117 0%,#141B35 30%,#16241C 70%,#0A1810 100%)",
        // v3 compat
        "twilight-gradient":  "linear-gradient(180deg,#141B35 0%,#20243F 100%)",
        "forest-gradient":    "linear-gradient(180deg,#16241C 0%,#0D1A10 100%)",
      },
      animation: {
        "float":         "float 5s ease-in-out infinite",
        "pulse-glow":    "pulse-glow 2s ease-in-out infinite",
        "bounce-in":     "bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "star-twinkle":  "star-twinkle 3s ease-in-out infinite",
        "gentle-bounce": "float 3s ease-in-out infinite",
        "firefly-drift": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform:"translateY(0px) rotate(0deg)" },
          "30%":     { transform:"translateY(-10px) rotate(-1deg)" },
          "70%":     { transform:"translateY(-6px) rotate(1deg)" },
        },
        "pulse-glow": {
          "0%,100%": { opacity:"0.6", transform:"scale(1)" },
          "50%":     { opacity:"1",   transform:"scale(1.05)" },
        },
        "bounce-in": {
          "0%":   { transform:"scale(0.5)", opacity:"0" },
          "80%":  { transform:"scale(1.08)", opacity:"1" },
          "100%": { transform:"scale(1)",   opacity:"1" },
        },
        "star-twinkle": {
          "0%,100%": { opacity:"0.2" },
          "50%":     { opacity:"0.9" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
