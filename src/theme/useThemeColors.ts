import { Colors } from "./colors";
import { useAppTheme } from "./theme-provider";

export function useThemeColors() {
  const { themeMode } = useAppTheme();
  return themeMode === "dark" ? Colors.dark : Colors.light;
}