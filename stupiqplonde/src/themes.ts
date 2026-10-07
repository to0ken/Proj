export type Theme = "rainbow" | "pink" | "blue";

export interface ThemeConfig {
    name: string;
    emoji: string;
    bgPrimary: string;
    bgSecondary: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    messageOwn: string;
    messageOther: string;
    border: string;
}

export const themes: Record<Theme, ThemeConfig> = {
    rainbow: {
        name: "Радужная",
        emoji: "🌈",
        bgPrimary: "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab, #f09819, #ee7752)",
        bgSecondary: "#1e1e2f",
        textPrimary: "#f2f3f5",
        textSecondary: "#cfd2d9",
        accent: "#e73c7e",
        messageOwn: "#d100ff",
        messageOther: "#ffe900",
        border: "rgba(143, 150, 163, 0.5)",
    },
    pink: {
        name: "Розовая",
        emoji: "🌸",
        bgPrimary: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
        bgSecondary: "#2d1f3d",
        textPrimary: "#fff0f5",
        textSecondary: "#ffb6c1",
        accent: "#ff69b4",
        messageOwn: "#ff1493",
        messageOther: "#ffb6c1",
        border: "rgba(255, 182, 193, 0.5)",
    },
    blue: {
        name: "Голубая",
        emoji: "💙",
        bgPrimary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        bgSecondary: "#1a2332",
        textPrimary: "#e0f2ff",
        textSecondary: "#87ceeb",
        accent: "#4169e1",
        messageOwn: "#1e90ff",
        messageOther: "#87ceeb",
        border: "rgba(135, 206, 235, 0.5)",
    },
};

export const THEME_KEY = "selected-theme";

export function getSavedTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && saved in themes) {
        return saved as Theme;
    }
    return "rainbow";
}

export function saveTheme(theme: Theme) {
    localStorage.setItem(THEME_KEY, theme);
}