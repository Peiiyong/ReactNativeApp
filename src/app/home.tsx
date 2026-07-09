import AppHeader from "@/components/AppHeader";
import AppLoading from "@/components/AppLoading";
import BannerCarousel, { BannerCarouselRef } from "@/components/BannerCarousel";
import BottomNavBar from "@/components/BottomNavBar";
import GameCarousel from "@/components/GameCarousel";
import GameModal from "@/components/GameModal";
import Leaderboard from "@/components/Leaderboard";
import LevelProgressBar from "@/components/LevelProgressBar";
import ProfileAvatar from "@/components/ProfileAvatar";
import SectionHeader from "@/components/SectionHeader";
import Toast from "@/components/Toast";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

type GameItem = {
  id: string;
  gameName: string;
  gamePicture?: string;
  requiredLevel?: number;
  status?: string;
};

type LeaderboardItem = {
  id: string;
  name: string;
  level: number;
  exp: number;
};

type GameConfigItem = {
  id: string;
  gameId: string;
  difficulty: string;
  point: number;
  targetDuration: number;
};

const bannerImages = [
  require("../../assets/images/banner1.png"),
  require("../../assets/images/banner2.png"),
  require("../../assets/images/banner3.jpg"),
];

export default function Home() {
  const colors = useThemeColors();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);

  const { width } = Dimensions.get("window");
  const bannerWidth = width - 40;
  const bannerRef = useRef<BannerCarouselRef>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const [games, setGames] = useState<GameItem[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [gameModalVisible, setGameModalVisible] = useState(false);
  const [gameConfigs, setGameConfigs] = useState<GameConfigItem[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  
  const [loading, setLoading] = useState(true);

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

  // Function to slide banner
  const goToNextBanner = () => {
    bannerRef.current?.next();
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

  // Get the user info from users
  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    try {
      setEmail(user.email ?? "No email available");
      setUsername(user.displayName ?? user.email?.split("@")[0] ?? "User");

      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        const matchingKey = Object.keys(users).find((key) => users[key]?.authUid === user.uid);

        if (matchingKey) {
          const userData = users[matchingKey];
          setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
          setLevel(userData.level ?? 1);
          setExp(userData.exp ?? 0);
          setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
          setEmail(userData.email ?? user.email ?? "No email available");
        } else {
          const directRef = ref(database, `users/${user.uid}`);
          const directSnapshot = await get(directRef);
          if (directSnapshot.exists()) {
            const userData = directSnapshot.val();

            setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
            setLevel(userData.level ?? 1);
            setExp(userData.exp ?? 0);
            setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
            setEmail(userData.email ?? user.email ?? "No email available");
          } else {
            setProfilePictureUrl(user.photoURL || user.photoURL || null);
          }
        }
      } else {
        const directRef = ref(database, `users/${user.uid}`);
        const directSnapshot = await get(directRef);
        if (directSnapshot.exists()) {
          const userData = directSnapshot.val();

          setUsername(userData.userName ?? userData.username ?? user.displayName ?? user.email?.split("@")[0] ?? "User");
          setLevel(userData.level ?? 1);
          setExp(userData.exp ?? 0);
          setProfilePictureUrl(userData.profilePicture || user.photoURL || null);
          setEmail(userData.email ?? user.email ?? "No email available");
        } else {
          setProfilePictureUrl(user.photoURL || user.photoURL || null);
        }
      }
    } catch (error) {
      console.warn("Failed to load user data:", error);
      showToast("Failed to load user info.", "error");
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

    return unsubscribe;
  }, [loadUserProfile]);

  useEffect(() => {
    const gamesRef = ref(database, "game");
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setGames([]);
        return;
      }

      const nextGames: GameItem[] = Object.entries(data).map(([id, value]: [string, any]) => ({
        id,
        gameName: value.gameName ?? "Unnamed game",
        gamePicture: value.gamePicture,
        requiredLevel: value.requiredLevel,
        status: value.status,
      }));

      setGames(nextGames.filter((game) => game.status !== "inactive"));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const configRef = ref(database, "game_config");
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setGameConfigs([]);
        setConfigsLoading(false);
        return;
      }

      const nextConfigs: GameConfigItem[] = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setGameConfigs(nextConfigs);
      setConfigsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setLeaderboardData([]);
        return;
      }

      const nextLeaderboard: LeaderboardItem[] = Object.keys(data)
        .map((key) => {
          const user = data[key] as any;
          return {
            id: key,
            photo: user.profilePicture ?? user.photoURL ?? null,
            name: user.userName ?? user.username ?? user.email?.split("@")[0] ?? "User",
            level: user.level ?? 0,
            exp: user.exp ?? 0,
          };
        })
        .sort((a, b) => {
          if (b.level !== a.level) {
            return b.level - a.level;
          }
          return b.exp - a.exp;
        });

      setLeaderboardData(nextLeaderboard);
    });

    return () => unsubscribe();
  }, []);

  const startSelectedGame = (game: GameItem) => {
    const required = game.requiredLevel ?? 1;

    if (level < required) {
      showToast(`Reach level ${required} to unlock ${game.gameName}!`, "error");
      return;
    }

    setSelectedGame(game);
    setGameModalVisible(true);
  };

  // Converts a game name into its route slug, e.g. "Tic Tac Toe" → "tictactoe"
  const toRouteSlug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, "");

  const handleStartGameConfig = (configId: string) => {
    if (!selectedGame) {
      console.warn("No game selected");
      return;
    }

    const targetPath = `/${toRouteSlug(selectedGame.gameName)}`;

    setGameModalVisible(false);
    setSelectedGame(null);

    router.push({
      pathname: targetPath as any,
      params:{
        gameConfigId: configId,
      },
    });
  };

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <AppHeader title={`Hello, ${username}`} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <AppLoading />
        ) : (
          <View style={styles.content}>

          <View style={styles.avatarSection}>
            <ProfileAvatar
              imageUri={profilePictureUrl}
              username={username}
              size={85}
            />
            <View style={styles.profileTextWrap}>
              <Text 
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.username, { color:colors.text }]}> 
                {username} 
              </Text>
              <LevelProgressBar width={175} level={level} currentExp={exp} nextLevelExp={nextLevelExp}/>
            </View>
          </View>

          <SectionHeader title="📢 Banner" buttonText="Next" icon="chevron-forward" onPress={goToNextBanner}/>
          <BannerCarousel ref={bannerRef} images={bannerImages}/>

          <SectionHeader title="🕹️ Game" buttonText="Explore" icon="game-controller-outline" onPress={()=>router.push("/game")}/>
          <GameCarousel games={games} onGamePress={(game)=>startSelectedGame(game)} onMorePress={()=>router.push("/game")}/>

          <SectionHeader title="🏆 Leaderboard" />
          <LinearGradient colors={colors.cardBackground}style={styles.cardBorder}>
            <View style={styles.cardInner}>
              <Leaderboard data={leaderboardData}/>
            </View>
          </LinearGradient>
          </View>
        )}
      </ScrollView>

      <BottomNavBar />
      
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

      <GameModal
          visible={gameModalVisible}
          configs={gameConfigs.filter(config=>config.gameId===selectedGame?.id)}
          loading={configsLoading}
          onClose={()=>{setGameModalVisible(false)}}
          onSelect={handleStartGameConfig}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    gap: 16,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },

  avatarSection:{
    flexDirection: "row",
    alignItems: "center",
/*     paddingLeft: 40, */ 
    gap: 5,
  },

  profileTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  username:{
    fontSize: 20,
    fontFamily: "Baloo2",
    fontWeight: "600",
  },

  cardBorder:{
    borderRadius:20,
    padding:2,  
  },

  cardInner:{
    borderRadius:18,
    padding:5,
    borderWidth: 1,
    borderColor: "#fff",
  },
});