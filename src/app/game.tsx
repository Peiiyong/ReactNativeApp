import AppHeader from "@/components/AppHeader";
import AppLoading from "@/components/AppLoading";
import GameModal from "@/components/GameModal";
import Toast from "@/components/Toast";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

type GameItem = {
  id: string;
  gameName: string;
  gamePicture?: string;
  requiredLevel?: number;
  status?: string;
};

type GameConfigItem = {
  id: string;
  gameId: string;
  difficulty: string;
  point: number;
  targetDuration: number;
};

// 2 columns, accounting for screen padding (20 each side) and gaps between cards
const { width } = Dimensions.get("window");
const COLUMN_GAP = 12;
const CARD_WIDTH = (width - 40 - COLUMN_GAP * 2) / 2;

export default function Game() {
  const colors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState(1);

  const [games, setGames] = useState<GameItem[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [gameModalVisible, setGameModalVisible] = useState(false);
  const [gameConfigs, setGameConfigs] = useState<GameConfigItem[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const loadUserLevel = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    try {
      const directRef = ref(database, `users/${user.uid}`);
      onValue(directRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUserLevel(userData.level ?? 1);
        }
        setLoading(false);
      });
    } catch (error) {
      console.warn("Failed to load user level:", error);
      showToast("Failed to load user info.", "error");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      loadUserLevel();
    });

    return unsubscribe;
  }, [loadUserLevel]);

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

  // Level check happens before the modal is ever shown
  const startSelectedGame = (game: GameItem) => {
    const required = game.requiredLevel ?? 1;

    if (userLevel < required) {
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
      <AppHeader 
        title="🕹️ Games" 
        leftIcon="arrow-back-outline"
        onLeftPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <AppLoading />
        ) : (
          <View style={styles.grid}>
            {games.map((game) => {
              const required = game.requiredLevel ?? 1;
              const locked = userLevel < required;

              return (
                <Pressable
                  key={game.id}
                  onPress={() => startSelectedGame(game)}
                  style={{ width: CARD_WIDTH }}
                >
                  <LinearGradient colors={colors.cardBackground} style={styles.card}>
                    <View style={styles.imageWrap}>
                      {game.gamePicture ? (
                        <Image source={{ uri: game.gamePicture }} style={styles.gameImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.gameImage, styles.gameImagePlaceholder, { backgroundColor: colors.primary }]} />
                      )}

                      {locked && (
                        <View style={styles.lockOverlay}>
                          <Ionicons name="lock-closed" size={22} color={colors.textWhite} />
                        </View>
                      )}
                    </View>

                    <Text
                      numberOfLines={1}
                      style={[styles.gameName, { color: colors.text }]}
                    >
                      {game.gameName}
                    </Text>

                    <Text
                      style={[
                        styles.gameMeta,
                        { color: locked ? colors.errorMsg : colors.navDefaultIcon },
                      ]}
                    >
                      {locked ? `🔒 Lv.${required}` : `Lv.${required}+`}
                    </Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() =>
          setToast((prev) => ({
            ...prev,
            visible: false,
          }))
        }
      />

      <GameModal
        visible={gameModalVisible}
        configs={gameConfigs.filter((config) => config.gameId === selectedGame?.id)}
        loading={configsLoading}
        onClose={() => setGameModalVisible(false)}
        onSelect={handleStartGameConfig}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  card: {
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: "#fff",
    gap: 6,
  },

  cardLocked: {
    opacity: 0.7,
  },

  imageWrap: {
    position: "relative",
  },

  gameImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
  },

  gameImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  gameName: {
    fontSize: 13,
    fontFamily: "Baloo2",
    fontWeight: "600",
  },

  gameMeta: {
    fontSize: 11,
    fontFamily: "Baloo2",
  },
});