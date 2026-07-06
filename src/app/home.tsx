import AppButton from "@/components/AppButton";
import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

interface GameItem {
  id: string;
  gameName: string;
  gamePicture: string;
  status: string;
}

export default function Home() {
  const colors = useThemeColors();
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);

  // listen to Firebase Realtime Database for game list updates
  useEffect(() => {
    const gameRef = ref(database, "game");
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // transform the data into an array of game items
        const gameList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setGames(gameList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  // click on a game, navigate to the difficulty selection page, and pass the gameId
  const handleGameSelect = (gameId: string) => {
    router.push({
      pathname: "/difficulty",
      params: { gameId: gameId }
    });
  };

  return (
    <LinearGradient
      colors={colors.innerBackground}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 20, textAlign: "center" }}>
        Home Page
      </Text>

      {/* Game List Area */}
      <View style={{ flex: 1, width: "100%", justifyContent: "center" }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.text} />
        ) : (
          games.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleGameSelect(item.id)}
              disabled={item.status !== "active"}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                borderRadius: 15,
                padding: 15,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 15,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.2)",
                opacity: item.status === "active" ? 1 : 0.5,
              }}
            >
              {/* Game Icon */}
              <Image
                source={{ uri: item.gamePicture }}
                style={{ width: 70, height: 70, borderRadius: 10, marginRight: 15, backgroundColor: "#ccc" }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
                  {item.gameName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text, opacity: 0.6, marginTop: 4 }}>
                  {item.status === "active" ? "Available to Play" : "Maintenance"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 15 }} />

      <AppButton
        title="L O G O U T"
        icon="log-out-outline"
        onPress={logout}
      />
      
      <BottomNavBar />
    </LinearGradient>
  );
}