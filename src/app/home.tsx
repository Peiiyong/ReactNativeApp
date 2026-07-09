import AppHeader from "@/components/AppHeader";
import AppLoading from "@/components/AppLoading";
import BannerCarousel, { BannerCarouselRef } from "@/components/BannerCarousel";
import BottomNavBar from "@/components/BottomNavBar";
import GameCarousel from "@/components/GameCarousel";
import LevelProgressBar from "@/components/LevelProgressBar";
import ProfileAvatar from "@/components/ProfileAvatar";
import SectionHeader from "@/components/SectionHeader";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    setSelectedGame(game);
    setGameModalVisible(true);
  };

  const handleStartGameConfig = (configId: string) => {
    const currentGameId = selectedGame?.id;

    setGameModalVisible(false);
    setSelectedGame(null);

    const gameRoutes: { [key: string]: string } = {
      "1": "/tictactoe",
      "2": "/foodcatching",
    };

    const targetPath = gameRoutes[String(currentGameId)] || "/tictactoe";

    router.push({
      pathname: targetPath as any,
      params: {
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
              <Text style={[styles.username, { color:colors.text }]}> {username} </Text>
              <LevelProgressBar width={175} level={level} currentExp={exp} nextLevelExp={nextLevelExp}/>
            </View>
          </View>

          <SectionHeader title="📢 Banner" buttonText="Next" icon="chevron-forward" onPress={goToNextBanner}/>
          <BannerCarousel ref={bannerRef} images={bannerImages}/>

          <SectionHeader title="🕹️ Game" buttonText="Explore" icon="game-controller-outline" onPress={()=>router.push("/profile")}/>
          <GameCarousel games={games} onGamePress={(game)=>startSelectedGame(game)} onMorePress={()=>router.push("/profile")}/>

          <SectionHeader title="🏆 Leaderboard" />



            <View style={styles.listBlock}>
              {games.map((game) => (
                <Pressable key={game.id} onPress={() => startSelectedGame(game)}>
                  <View style={[styles.card, { backgroundColor: colors.cardBackground[0] }]}>
                    <View style={styles.gameCardRow}>
                      <View style={styles.gameTextWrap}>
                        <Text style={[styles.gameName, { color: colors.text }]}>{game.gameName}</Text>
                        <Text style={[styles.gameMeta, { color: colors.navDefaultIcon }]}>
                          Required level {game.requiredLevel ?? 1}
                        </Text>
                      </View>

                      <View style={[styles.playBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.playBadgeText, { color: colors.text2 }]}>Start</Text>
                      </View>
                    </View>

                    {game.gamePicture ? (
                      <Image source={{ uri: game.gamePicture }} style={styles.gameImage} resizeMode="cover" />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>


            <View style={styles.listBlock}>
              {leaderboardData.slice(0, 10).map((item, index) => (
                <View key={item.id} style={[styles.card, { backgroundColor: colors.cardBackground[0] }]}>
                  <View style={styles.leaderboardRow}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.rankBadgeText, { color: colors.text2 }]}>{index + 1}</Text>
                    </View>

                    <View style={styles.leaderboardTextWrap}>
                      <Text style={[styles.leaderboardName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.leaderboardMeta, { color: colors.navDefaultIcon }]}>Level {item.level} · Exp {item.exp}</Text>
                    </View>

                    <Text style={[styles.scoreText, { color: colors.text }]}>{item.exp}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <BottomNavBar />

      <Modal visible={gameModalVisible} transparent animationType="fade" onRequestClose={() => setGameModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setGameModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.cardBackground[0] }]} onPress={() => { }}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Difficulty</Text>
            <Text style={{ fontSize: 14, color: colors.text, opacity: 0.7 }}>
              Choose your challenge level
            </Text>

            {configsLoading ? (
              <ActivityIndicator size="large" color={colors.text} style={{ marginVertical: 20 }} />
            ) : (
              gameConfigs.filter((config) => config.gameId === selectedGame?.id).map((config) => (
                <TouchableOpacity
                  key={config.id}
                  style={[styles.configButton, { borderColor: colors.navDefaultIcon, backgroundColor: colors.cardBackground[0] }]}
                  onPress={() => handleStartGameConfig(config.id)}
                >
                  <Text style={[styles.configTitle, { color: colors.text }]}>{config.difficulty.toUpperCase()}</Text>
                  <Text style={[styles.configMeta, { color: colors.navDefaultIcon }]}>Reward: {config.point} | Target: {config.targetDuration}s</Text>
                </TouchableOpacity>
              ))
            )}

            {!configsLoading && selectedGame && gameConfigs.filter((config) => config.gameId === selectedGame.id).length === 0 ? (
              <Text style={[styles.modalDescription, { color: colors.text }]}>No difficulty options available for this game.</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalSecondaryButton, { borderColor: colors.navDefaultIcon }]} onPress={() => {
                setGameModalVisible(false);
                setSelectedGame(null);
              }}>
                <Text style={[styles.modalSecondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  },

  username:{
    fontSize: 20,
    fontFamily: "Baloo2",
    fontWeight: "600",
  },



  card: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },

  listBlock: {
    gap: 14,
  },
  gameCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  gameTextWrap: {
    flex: 1,
    gap: 6,
  },
  gameName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  gameMeta: {
    fontSize: 13,
  },
  playBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  playBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  gameImage: {
    width: "100%",
    height: 150,
    borderRadius: 18,
    marginTop: 6,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeText: {
    fontSize: 16,
    fontWeight: "800",
  },
  leaderboardTextWrap: {
    flex: 1,
    gap: 4,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  leaderboardMeta: {
    fontSize: 13,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  configButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  configMeta: {
    fontSize: 13,
    marginTop: 6,
  },
});