import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

interface HistoryItem {
  id: string;
  gameName: string;
  startTime: string;
  duration: string;
  createdAt?: number;
}

export default function History() {
  const colors = useThemeColors();
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const userHistoryRef = ref(database, `user_history/${user.uid}`);
    const unsubscribe = onValue(userHistoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyItems: HistoryItem[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          id,
          gameName: item.gameName,
          startTime: item.startTime,
          duration: item.duration,
          createdAt: item.createdAt
        }));
        const newestFirstData = historyItems.reverse();
        setHistoryList(newestFirstData);
      } else {
        setHistoryList([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>

      <Text style={[styles.title, { color: colors.text }]}>Game History</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : historyList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text, opacity: 0.6 }}>That is no record now</Text>
        </View>
      ) : (
        <FlatList
          data={historyList}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}> 
              <View style={styles.cardHeader}>
                <Text style={[styles.gameName, { color: colors.text }]}>{item.gameName}</Text>
                <Text style={[styles.durationBadge, { backgroundColor: colors.primary, color: colors.text2 }]}>
                  {item.duration}
                </Text>
              </View>

       
                  <Text style={[styles.timeText, { color: colors.navDefaultIcon }]}>Start time: {item.startTime}</Text>
    
            </View>
          )}
        />
      )}

      <BottomNavBar />
      
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
  list: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  gameName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  durationBadge: {
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 13,
    opacity: 0.8,
  },
  cardBody: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
});