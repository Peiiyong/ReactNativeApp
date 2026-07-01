export const Colors = {
  light: {
    background: "#5353ff",
    innerBackground: ["#4C1D95", "#2E1065", "#000000"] as const,
    navBackground: "#1b1b1b",

    text: "#FFFFFF",
    buttonGradient: ["#9333EA", "#5B21B6", "#2E1065"] as const,
    navDefaultIcon: "#999",

    primaryGradient: ["#2E1065", "#5B21B6", "#9333EA"] as const,
    primary: "#3B82F6",

    errorMsg: "#EF4444",
    successMsg: "#22C55E",
  },
  dark: {
    background: "#0F172A",
    innerBackground: ["#1E293B", "#0F172A", "#000000"] as const,
    navBackground: "#1E293B",
    text: "#FFFFFF",
    buttonGradient: ["#60A5FA", "#3B82F6", "#1D4ED8"] as const,
    primaryGradient: ["#60A5FA", "#3B82F6", "#1D4ED8"] as const,
    navDefaultIcon: "#999",
    primary: "#60A5FA",
    errorMsg: "#EF4444",
    successMsg: "#22C55E",
  },
};