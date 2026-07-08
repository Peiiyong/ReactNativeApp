import AppBox from "@/components/AppBox";
import AppCard from "@/components/AppCard";
import AppHeader from "@/components/AppHeader";
import BottomNavBar from "@/components/BottomNavBar";
import LevelProgressBar from "@/components/LevelProgressBar";
import ProfileAvatar from "@/components/ProfileAvatar";
import Toast from "@/components/Toast";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useAppTheme } from "../theme/theme-provider";
import { useThemeColors } from "../theme/useThemeColors";

// Function to change Date format 
function formatJoinedDate(timestamp?: number | string) {
  if (!timestamp) return "";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function Profile() {
  const colors = useThemeColors();
  const { themeMode, toggleThemeMode } = useAppTheme();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);

  const MAX_BADGE_LEVEL = 5;
  const [loading, setLoading] = useState(true);
  const [userKey, setUserKey] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState({
    visible:false,
    message:"",
    type:"success" as "success" | "error",
  });

  // Function to show toast message
  const showToast = (
    message:string,
    type:"success"|"error"="success"
  )=>{
    setToast({ visible:true, message, type, });
  };

  // Get the data from level_config
  const [nextLevelExp, setNextLevelExp] = useState(0);
  useEffect(() => {
    const loadLevelConfig = async () => {
      const levelConfigRef = ref(database, "level_config");
      const levelSnapshot = await get(levelConfigRef);

      if(levelSnapshot.exists()){
        type LevelConfigItem = {
          level: number;
          requiredPoint: number;
        };

        const configs = levelSnapshot.val() as Record<string, LevelConfigItem>;
        const nextLevel = Object.values(configs).find(
          (item) => item.level === level + 1
        );

        if(nextLevel){
          setNextLevelExp(nextLevel.requiredPoint);
        } else {
          setNextLevelExp(0);
        }
      }
    };
    loadLevelConfig();
  }, [level]);

  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    try {
      setEmail(user.email ?? "No email available");
      setRegisteredAt(formatJoinedDate(user.metadata.creationTime));
      setUsername(user.displayName ?? user.email?.split("@")[0] ?? "User");

      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        const matchingKey = Object.keys(users).find((key) => users[key]?.authUid === user.uid);

        if (matchingKey) {
          const userData = users[matchingKey];
          setUserKey(matchingKey);
          setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
          setLevel(userData.level ?? 1);
          setCurrentPoints(userData.currentPoints ?? 0);
          setExp(userData.exp ?? 0);
          setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
          setEmail(userData.email ?? user.email ?? "No email available");
          if (userData.createdAt) {
            setRegisteredAt(formatJoinedDate(userData.createdAt));
/*             console.log("Created At:", userData); */
          }
        } else {
          const directRef = ref(database, `users/${user.uid}`);
          const directSnapshot = await get(directRef);
          if (directSnapshot.exists()) {
            const userData = directSnapshot.val();

            setUserKey(user.uid);
            setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
            setLevel(userData.level ?? 1);
            setCurrentPoints(userData.currentPoints ?? 0);
            setExp(userData.exp ?? 0);
            setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
            setEmail(userData.email ?? user.email ?? "No email available");
            if (userData.createdAt) {
              setRegisteredAt(formatJoinedDate(userData.createdAt));
            }
          } else {
            setProfilePictureUrl(user.photoURL ?? null);
          }
        }
      } else {
        const directRef = ref(database, `users/${user.uid}`);
        const directSnapshot = await get(directRef);
        if (directSnapshot.exists()) {
          const userData = directSnapshot.val();

          setUserKey(user.uid);
          setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
          setLevel(userData.level ?? 1);
          setCurrentPoints(userData.currentPoints ?? 0);
          setExp(userData.exp ?? 0);
          setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
          setEmail(userData.email ?? user.email ?? "No email available");
          if (userData.createdAt) {
            setRegisteredAt(formatJoinedDate(userData.createdAt));
          }
        } else {
          setProfilePictureUrl(user.photoURL ?? null);
        }
      }
    } catch (error) {
      console.warn("Failed to load profile data:", error);
      showToast("Failed to load profile info.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      loadUserProfile();
    });

    return () => {
      unsubscribe();
    };
  }, [loadUserProfile]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile])
  );

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const confirmLogout = () => {
    Alert.alert("Log out?", "Are you sure you want to log out from this account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <AppHeader 
        title="Profile"
        leftIcon="information-circle-outline"
        onLeftPress={() => { showToast("This feature is coming soon!", "error");}}
        rightIcon="log-out-outline"
        onRightPress={confirmLogout}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
            <ActivityIndicator color={colors.text} size="large" />
          </View>
        ) : (
          <View style={styles.content}> 

          <View style={styles.avatarSection}>
            {/* Avatar */}
            <ProfileAvatar
              imageUri={profilePictureUrl}
              username={username}
              size={180}
              badgeIcon={level > MAX_BADGE_LEVEL ? "trophy" : "star"}
              badgeText={`Lv.${level}`}
            />
            {/* Username */}
            <Text style={[styles.username, { color:colors.text }]}> {username} </Text>

            {/* Level Progress */}
            <LevelProgressBar level={level} currentExp={exp} nextLevelExp={nextLevelExp}/>

            {/* Box */}
            <View style={styles.statsRow}>
              <AppBox label="Point" value={currentPoints} backgroundColor= {colors.boxYellow} borderColor={colors.boxYellowBorder} />
              <AppBox label="Rank" value={level >= MAX_BADGE_LEVEL ? "🏆" : "⭐"} backgroundColor={colors.boxGreen} borderColor={colors.boxGreenBorder}/>
            </View>
          </View>

          <AppCard title="Account Info" rightIcon="create-outline" onIconPress={() => router.push("/profile-edit")}>
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Username</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{username}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Registered</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{registeredAt}</Text>
              </View>
            </View>
          </AppCard>

          <AppCard title="Settings">
            <View style={styles.infoRow}>
              <View style={styles.infoTextWrap}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Theme mode</Text>
                <Text style={[styles.infoValueLeft, { color: colors.navDefaultIcon }]}> 
                  {themeMode === "dark" ? "Dark mode enabled" : "Light mode enabled"}
                </Text>
              </View>

              <Switch
                value={themeMode === "dark"}
                onValueChange={toggleThemeMode}
                trackColor={{ false: "#94A3B8", true: colors.primary }}
                thumbColor={themeMode === "dark" ? "#FFFFFF" : "#F8FAFC"}
              />
            </View>
          </AppCard>

          <AppCard title="Security">
            <Pressable style={styles.infoRow} onPress={() => router.push("/change-password")}>
              <View style={styles.infoTextWrap}>
                <Text style={[styles.infoLabel, { color: colors.text }]}> Reset password</Text>
                <Text style={[styles.infoValueLeft, { color: colors.navDefaultIcon }]}>
                  Change your account password
                </Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={22}
                color={colors.primary}
              />
            </Pressable>
          </AppCard>
          </View>
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() =>
          setToast(prev=>({
            ...prev,
            visible:false
          }))
        }
      />
      <BottomNavBar />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    gap:16
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },

  loadingContainer: {
    flex: 1,
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "Baloo2",
  },

  avatarSection:{
   alignItems: "center",
   gap: 5,
  },

  username:{
    fontSize: 28,
    fontFamily: "Baloo2",
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },

  infoList: {
    gap: 12,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },

  infoLabel: {
    fontSize: 14,
    fontFamily: "Baloo2",
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Baloo2",
    textAlign: "right",
  },

  infoTextWrap: {
    flex: 1,
    paddingRight: 16,
  },

  infoValueLeft: {
    fontFamily: "Baloo2",
    fontSize: 13,
  },
});