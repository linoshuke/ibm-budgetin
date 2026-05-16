import type { Config } from "tailwindcss";

function withAlpha(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        tablet: "768px",
        desktop: "1024px",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-headline)", "system-ui", "sans-serif"],
        headline: ["var(--font-headline)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        label: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "monospace"],
      },
      colors: {
        brand: {
          primary: "#4f46e5",
          secondary: "#0f172a",
          accent: "#22d3ee",
        },
        "on-secondary-fixed": withAlpha("--c-on-secondary-fixed"),
        "primary-fixed": withAlpha("--c-primary-fixed"),
        "on-primary": withAlpha("--c-on-primary"),
        "secondary-fixed-dim": withAlpha("--c-secondary-fixed-dim"),
        "tertiary-fixed-dim": withAlpha("--c-tertiary-fixed-dim"),
        "on-error-container": withAlpha("--c-on-error-container"),
        "inverse-primary": withAlpha("--c-inverse-primary"),
        secondary: withAlpha("--c-secondary"),
        "surface-container-lowest": withAlpha("--c-surface-container-lowest"),
        "on-surface": withAlpha("--c-on-surface"),
        "inverse-surface": withAlpha("--c-inverse-surface"),
        "on-background": withAlpha("--c-on-background"),
        "tertiary-fixed": withAlpha("--c-tertiary-fixed"),
        error: withAlpha("--c-error"),
        "on-secondary-container": withAlpha("--c-on-secondary-container"),
        "surface-variant": withAlpha("--c-surface-variant"),
        "inverse-on-surface": withAlpha("--c-inverse-on-surface"),
        outline: withAlpha("--c-outline"),
        "on-primary-fixed-variant": withAlpha("--c-on-primary-fixed-variant"),
        "on-tertiary-fixed-variant": withAlpha("--c-on-tertiary-fixed-variant"),
        tertiary: withAlpha("--c-tertiary"),
        "on-tertiary-container": withAlpha("--c-on-tertiary-container"),
        "surface-tint": withAlpha("--c-surface-tint"),
        "surface-bright": withAlpha("--c-surface-bright"),
        "on-surface-variant": withAlpha("--c-on-surface-variant"),
        "secondary-fixed": withAlpha("--c-secondary-fixed"),
        "secondary-container": withAlpha("--c-secondary-container"),
        "surface-container-highest": withAlpha("--c-surface-container-highest"),
        "surface-container": withAlpha("--c-surface-container"),
        "on-secondary-fixed-variant": withAlpha("--c-on-secondary-fixed-variant"),
        "on-tertiary": withAlpha("--c-on-tertiary"),
        "on-tertiary-fixed": withAlpha("--c-on-tertiary-fixed"),
        "surface-container-high": withAlpha("--c-surface-container-high"),
        surface: withAlpha("--c-surface"),
        "on-error": withAlpha("--c-on-error"),
        "surface-container-low": withAlpha("--c-surface-container-low"),
        primary: withAlpha("--c-primary"),
        "on-primary-container": withAlpha("--c-on-primary-container"),
        "outline-variant": withAlpha("--c-outline-variant"),
        "surface-dim": withAlpha("--c-surface-dim"),
        background: withAlpha("--c-background"),
        "tertiary-container": withAlpha("--c-tertiary-container"),
        "primary-fixed-dim": withAlpha("--c-primary-fixed-dim"),
        "primary-container": withAlpha("--c-primary-container"),
        "on-secondary": withAlpha("--c-on-secondary"),
        "error-container": withAlpha("--c-error-container"),
        "on-primary-fixed": withAlpha("--c-on-primary-fixed"),
      },
    },
  },
  plugins: [],
};

export default config;
