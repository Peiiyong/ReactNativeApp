import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
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
      name: "rewards",
      icon: "gift",
      route: "/rewards",
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
    <LinearGradient colors={colors.activeIconBorder} style={styles.gradientContainer}>
      <View style={[ styles.navContainer, { backgroundColor: colors.navBackground, }]} >
        {tabs.map((tab) => {
          const active = pathname === tab.route;

          return (
            <Pressable
              key={tab.name}
              style={styles.tab}
              onPress={() => router.replace(tab.route as any)}
            >
              {active ? (
                <LinearGradient colors={colors.activeIconBorder} style={styles.activeCircle} >
                  <View style={[ styles.iconCircle, { backgroundColor: colors.activeIconBackground }]}>
                    <Ionicons
                      name={tab.icon as any}
                      size={28}
                      color={colors.activeIconWhite}
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveCircle}>
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

const styles = StyleSheet.create({
  gradientContainer:{
    position:"absolute",
    bottom:25,
    left:20,
    right:20,
    height:74,
    borderRadius:37,
    padding:2,
    elevation:10,
  },

  navContainer:{
    flex:1,
    borderRadius:35,
    flexDirection:"row",
    justifyContent:"space-around",
    alignItems:"center",
    paddingHorizontal:10,
  },

  tab:{
    flex:1,
    alignItems:"center",
  },

  activeCircle:{
    width:54,
    height:54,
    borderRadius:27,
    alignItems:"center",
    justifyContent:"center",
  },

  iconCircle:{
    width:48,
    height:48,
    borderRadius:24,
    alignItems:"center",
    justifyContent:"center",
  },

  inactiveCircle:{
    width:50,
    height:50,
    borderRadius:25,
    alignItems:"center",
    justifyContent:"center",
  },
});