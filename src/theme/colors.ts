export const Colors = {
  light: {
    background: "#F4F7FF",
    innerBackground: ["#FFFFFF", "#E0E7FF", "#CBD5E1"] as const,
    navBackground: "#FFFFFF",
    cardBackground: "rgba(255,255,255,0.75)",

    text: "#0F172A",
    text2: "#FFFFFF",
    buttonGradient: ["#2563EB", "#4F46E5", "#7C3AED"] as const,
    navDefaultIcon: "#64748B",

    primaryGradient: ["#2563EB", "#4F46E5", "#7C3AED"] as const,
    primary: "#2563EB",

    errorMsg: "#EF4444",
    successMsg: "#22C55E",
  },
  dark: {
    background: "#5353ff",
    innerBackground: ["#4C1D95", "#4C1D95", "#000000"] as const,
    navBackground: "#1b1b1b",
    cardBackground: "rgba(15,23,42,0.7)",

    text: "#FFFFFF",
    text2: "#FFFFFF",
    buttonGradient: ["#b06cf0", "#7e46d7", "#9333EA"] as const,
    navDefaultIcon: "#94A3B8",

    primaryGradient: ["#0b0810", "#5B21B6", "#9333EA"] as const,
    primary: "#9333EA",
    
    errorMsg: "#EF4444",
    successMsg: "#22C55E",
  },
};