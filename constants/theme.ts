import { DarkTheme as NavigationDark, DefaultTheme as NavigationLight } from "@react-navigation/native";

export const DarkTheme = {
  ...NavigationDark,
  colors: {
    ...NavigationDark.colors,
    background: "#000", // fundo geral da navegação
    card: "#111",        // fundo do cabeçalho e tabbar
    text: "#fff",
    border: "#333",
  },
};

export const LightTheme = {
  ...NavigationLight,
  colors: {
    ...NavigationLight.colors,
    background: "#fff",
    card: "#fff",
    text: "#000",
    border: "#eee",
  },
};