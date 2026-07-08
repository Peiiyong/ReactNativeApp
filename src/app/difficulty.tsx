import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

interface ConfigItem {
  id: string;
  gameId: string;
  difficulty: string;
  point: number;
  targetDuration: number;
}

export default function DifficultyScreen() {
  const colors = useThemeColors();
  const { gameId } = useLocalSearchParams(); // get gameId from the route params
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = ref(database, "game_config");
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // filter the configurations based on the selected gameId
        const filteredConfigs = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((config) => config.gameId === gameId);

        setConfigs(filteredConfigs);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  const handleStartGame = (gameConfigId: string) => {
    const gameRoutes: { [key: string]: string } = {
      "1": "/tictactoe",       
      "2": "/foodcatching",
    };

    const targetPath = gameRoutes[String(gameId)] || "/tictactoe";

    console.log(`关卡匹配成功!当前游戏ID: ${gameId}, 去往页面: ${targetPath}, 配置ID: ${gameConfigId}`);

    router.push({
      pathname: targetPath as any,
      params: {
        gameConfigId: gameConfigId,
      }
    });
  };

  return (
    <LinearGradient
      colors={colors.innerBackground}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}
    >
      <Text style={{ fontSize: 26, fontWeight: "bold", color: colors.text, marginBottom: 10 }}>
        Select Difficulty
      </Text>
      <Text style={{ fontSize: 14, color: colors.text, opacity: 0.7, marginBottom: 30 }}>
        Choose your challenge level
      </Text>

      <View style={{ width: "100%", paddingHorizontal: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.text} />
        ) : configs.length === 0 ? (
          <Text style={{ color: colors.text, textAlign: "center" }}>No configuration found.</Text>
        ) : (
          configs.map((config) => (
            <TouchableOpacity
              key={config.id}
              onPress={() => handleStartGame(config.id)}
              style={{
                backgroundColor: "#363062",
                borderRadius: 12,
                padding: 20,
                marginBottom: 15,
                alignItems: "center",
                elevation: 3,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: "bold", color: "#FFF", textTransform: "uppercase" }}>
                {config.difficulty}
              </Text>
              <Text style={{ fontSize: 14, color: "#E9D5CA", marginTop: 5 }}>
                Reward: {config.point} Points | Target: {config.targetDuration}s
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 20 }} />

      <TouchableOpacity
        onPress={() => router.replace("/home")}
        style={{ padding: 10 }}
      >
        <Text style={{ color: colors.text, opacity: 0.6, fontSize: 16 }}>Back to Home</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}