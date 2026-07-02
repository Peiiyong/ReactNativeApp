import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

export default function BottomNavBar() {
  const colors = useThemeColors();
  const pathname = usePathname();

  const tabs = [
    {
      name: "home",
      icon: "home",
      route: "/home",
    },
    {
      name: "history",
      icon: "time",
      route: "/history",
    },
    {
      name: "profile",
      icon: "person",
      route: "/profile",
    },
  ];

  return (
    <View
      style={[
        {
          backgroundColor: colors.navBackground,
          position: "absolute",
          bottom: 25,
          left: 20,
          right: 20,
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          height: 70,
          borderRadius: 35,
          elevation: 10,
          paddingHorizontal: 10,
        },
      ]}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.route;

        return (
          <Pressable
            key={tab.name}
            style={{ flex: 1, alignItems: "center" }}
            onPress={() => router.replace(tab.route as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={28}
              color={active ? colors.text : colors.navDefaultIcon}
            />
          </Pressable>
        );
      })}
    </View>
  );
}