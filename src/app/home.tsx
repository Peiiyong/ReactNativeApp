import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
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
  score: number;
};

const bannerImages = [
  require("../../assets/images/banner.jpg"),
  require("../../assets/images/banner.jpg"),
  require("../../assets/images/banner.jpg"),
];

const leaderboardData: LeaderboardItem[] = [
  { id: "1", name: "Avery", level: 12, score: 980 },
  { id: "2", name: "Mina", level: 10, score: 860 },
  { id: "3", name: "Jemin", level: 8, score: 740 },
];

export default function Home() {
  const colors = useThemeColors();
  const bannerRef = useRef<FlatList<number>>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("User");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [level] = useState(1);
  const [authReady, setAuthReady] = useState(false);
  const [games, setGames] = useState<GameItem[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [gameModalVisible, setGameModalVisible] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const { width } = Dimensions.get("window");
  const bannerWidth = width - 40;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "No email available");
      setDisplayName(user.displayName ?? user.email?.split("@")[0] ?? "User");
      setPhotoURL(user.photoURL ?? null);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

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

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const openGameDialog = (game: GameItem) => {
    setSelectedGame(game);
    setGameModalVisible(true);
  };

  const startSelectedGame = () => {
    if (selectedGame) {
      const gameId = selectedGame.id; 
      setGameModalVisible(false);
      setSelectedGame(null);
      
      router.push({
        pathname: "/difficulty" as any,
        params: { gameId: gameId }
      });
    } else {
      setGameModalVisible(false);
    }
  };

  const goToNextBanner = () => {
    const nextIndex = (currentBannerIndex + 1) % bannerImages.length;
    setCurrentBannerIndex(nextIndex);
    bannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || "U";

  if (!authReady) {
    return (
      <LinearGradient colors={colors.innerBackground} style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading home...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Home</Text>

        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.text2 }]}>{avatarLetter}</Text>
              )}
            </View>

            <View style={styles.profileTextWrap}>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.profileEmail, { color: colors.navDefaultIcon }]}>{email}</Text>

              <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.levelBadgeText, { color: colors.text2 }]}>Level {level}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Banner</Text>
          <Pressable onPress={goToNextBanner} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.nextButtonText, { color: colors.text2 }]}>Next</Text>
          </Pressable>
        </View>

        <View style={[styles.bannerCard, { backgroundColor: colors.cardBackground }]}>
          <FlatList
            ref={bannerRef}
            data={bannerImages}
            keyExtractor={(_, index) => `banner-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: bannerWidth,
              offset: bannerWidth * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
              setCurrentBannerIndex(nextIndex);
            }}
            renderItem={({ item, index }) => (
              <View style={[styles.bannerSlide, { width: bannerWidth }]}>
                <Image source={item} style={styles.bannerImage} resizeMode="cover" />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerText}>Banner {index + 1}</Text>
                </View>
              </View>
            )}
          />

          <View style={styles.paginationRow}>
            {bannerImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { backgroundColor: index === currentBannerIndex ? colors.primary : colors.navDefaultIcon },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Game</Text>
        </View>

        <View style={styles.listBlock}>
          {games.map((game) => (
            <Pressable key={game.id} onPress={() => openGameDialog(game)}>
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
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

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Leaderboard</Text>
        </View>

        <View style={styles.listBlock}>
          {leaderboardData.map((item, index) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.leaderboardRow}>
                <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.rankBadgeText, { color: colors.text2 }]}>{index + 1}</Text>
                </View>

                <View style={styles.leaderboardTextWrap}>
                  <Text style={[styles.leaderboardName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.leaderboardMeta, { color: colors.navDefaultIcon }]}>Level {item.level}</Text>
                </View>

                <Text style={[styles.scoreText, { color: colors.text }]}>{item.score}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNavBar />

      <Modal visible={gameModalVisible} transparent animationType="fade" onRequestClose={() => setGameModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setGameModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.cardBackground }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Start Game</Text>

            <Text style={[styles.modalGameName, { color: colors.text }]}>{selectedGame?.gameName ?? "Game"}</Text>
            <Text style={[styles.modalMeta, { color: colors.navDefaultIcon }]}>Required level {selectedGame?.requiredLevel ?? 1}</Text>

            {selectedGame?.gamePicture ? (
              <Image source={{ uri: selectedGame.gamePicture }} style={styles.modalImage} resizeMode="cover" />
            ) : null}

            <Text style={[styles.modalDescription, { color: colors.navDefaultIcon }]}>Press start to enter the game.</Text>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalSecondaryButton, { borderColor: colors.navDefaultIcon }]} onPress={() => setGameModalVisible(false)}>
                <Text style={[styles.modalSecondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable style={[styles.modalPrimaryButton, { backgroundColor: colors.primary }]} onPress={startSelectedGame}>
                <Text style={[styles.modalPrimaryButtonText, { color: colors.text2 }]}>Start</Text>
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
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 60,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "bold",
  },
  profileTextWrap: {
    flex: 1,
    gap: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileEmail: {
    fontSize: 14,
  },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  nextButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  nextButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bannerCard: {
    borderRadius: 24,
    overflow: "hidden",
  },
  bannerSlide: {
    height: 170,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    left: 16,
    bottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
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
    justify: "center",
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
    backgroundColor: "rgba(0,0,0,0.45)",
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
  modalGameName: {
    fontSize: 26,
    fontWeight: "bold",
  },
  modalMeta: {
    fontSize: 13,
  },
  modalImage: {
    width: "100%",
    height: 180,
    borderRadius: 20,
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
  modalPrimaryButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});