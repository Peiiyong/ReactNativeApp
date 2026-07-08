import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { Pressable, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

export default function BottomNavBar() {
  const colors = useThemeColors();
  const pathname = usePathname();

  const tabs = [
    {
      name: "home",
      icon: "game-controller",
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
    <LinearGradient
      colors={colors.activeIconBorder}
      style={{
        position: "absolute",
        bottom: 25,
        left: 20,
        right: 20,
        height: 74,
        borderRadius: 37,
        padding: 2, 
        elevation: 10,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.navBackground,
          borderRadius: 35,
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingHorizontal: 10,
        }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.route;

          return (
            <Pressable
              key={tab.name}
              style={{ flex: 1, alignItems: "center" }}
              onPress={() => router.replace(tab.route as any)}
            >
              {active ? (
                <LinearGradient
                  colors={colors.activeIconBorder}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width:48,
                      height:48,
                      borderRadius:24,
                      backgroundColor:colors.activeIconBackground,
                      alignItems:"center",
                      justifyContent:"center",
                    }}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={28}
                      color={colors.activeIcon}
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View
                  style={{
                    width:50,
                    height:50,
                    borderRadius:25,
                    alignItems:"center",
                    justifyContent:"center",
                  }}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={28}
                    color={colors.navDefaultIcon}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}