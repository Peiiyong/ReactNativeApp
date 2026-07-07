import BottomNavBar from "@/components/BottomNavBar";
import { LinearGradient } from "expo-linear-gradient";
import { get, onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

interface HistoryItem {
    id: string;
    gameConfigId: string;
    gameName: string;
    gameStatus: 'win' | 'lose' | 'draw';
    point: number;
    duration: string;
    createdAt: number;
}

export default function History() {
    const colors = useThemeColors();
    const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | null = null;

        const fetchAllData = async () => {
            try {
                const gameRef = ref(database, "game");
                const configRef = ref(database, "game_config");

                const [gameSnapshot, configSnapshot] = await Promise.all([
                    get(gameRef),
                    get(configRef)
                ]);

                const gameData = gameSnapshot.exists() ? gameSnapshot.val() : {};
                const configData = configSnapshot.exists() ? configSnapshot.val() : {};

                const usersRef = ref(database, "users");
                const usersSnapshot = await get(usersRef);
                let realUserId = user.uid;

                if (usersSnapshot.exists()) {
                    const usersData = usersSnapshot.val();
                    const foundKey = Object.keys(usersData).find(
                        (key) => usersData[key].authUid === user.uid || key === user.uid
                    );
                    if (foundKey) realUserId = foundKey;
                }

                // get user history data
                const userHistoryRef = ref(database, `user_history/${realUserId}`);
                unsubscribe = onValue(userHistoryRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const historyItems: HistoryItem[] = Object.entries(data).map(([id, item]: [string, any]) => {
                            // get game name dynamically based on gameConfigId
                            const currentConfigId = item.gameConfigId || "";
                            const targetConfig = configData[currentConfigId]; 
                            const targetGameId = targetConfig?.gameId || "";  
                            const targetGame = gameData[targetGameId];        

                            const dynamicGameName = targetGame?.gameName || "Unknown Game";

                            return {
                                id,
                                gameConfigId: currentConfigId,
                                gameName: dynamicGameName,
                                gameStatus: item.gameStatus || "draw",
                                point: item.point !== undefined ? item.point : 0,
                                duration: item.duration || "0s",
                                createdAt: item.createdAt || Date.now(),
                            };
                        });

                        // descending order by createdAt
                        historyItems.sort((a, b) => b.createdAt - a.createdAt);
                        setHistoryList(historyItems);
                    } else {
                        setHistoryList([]);
                    }
                    setLoading(false);
                });
            } catch (error) {
                console.error("Error loading history topology:", error);
                setLoading(false);
            }
        };

        fetchAllData();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "win": return colors.successMsg || "#4CD964";
            case "lose": return colors.errorMsg || "#FF3B30";
            default: return colors.navDefaultIcon || "#8E8E93";
        };
    };

    const formatMatchDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <LinearGradient colors={colors.innerBackground} style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Game History</Text>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            ) : historyList.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={{ color: colors.text, opacity: 0.6 }}>There are no records yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={historyList}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const isExpanded = expandedId === item.id;
                        const statusColor = getStatusColor(item.gameStatus);

                        return (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                                style={[styles.card, { backgroundColor: colors.cardBackground }]}
                            >
                                {/* ─── simple info ─── */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.headerLeft}>
                                        <Text style={[styles.gameName, { color: colors.text }]}>{item.gameName}</Text>
                                        <Text style={[styles.timeText, { color: colors.navDefaultIcon }]}>
                                            {formatMatchDate(item.createdAt)}
                                        </Text>
                                    </View>
                                    <View style={styles.headerRight}>
                                        <Text style={[styles.statusBadge, { backgroundColor: statusColor, color: "#FFFFFF" }]}>
                                            {item.gameStatus.toUpperCase()}
                                        </Text>
                                        {/* 箭头旋转指示器 */}
                                        <Text style={[styles.arrowIcon, { color: colors.navDefaultIcon }]}>
                                            {isExpanded ? "▲" : "▼"}
                                        </Text>
                                    </View>
                                </View>

                                {/* ─── expanded info ─── */}
                                {isExpanded && (
                                    <View style={styles.cardBody}>
                                        <View style={[styles.divider, { backgroundColor: colors.navDefaultIcon }]} />

                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Game Name</Text>
                                            <Text style={[styles.infoValue, { color: colors.text }]}>{item.gameName}</Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Match Result</Text>
                                            <Text style={[styles.infoValue, { color: statusColor, fontWeight: "700" }]}>
                                                {item.gameStatus.toUpperCase()}
                                            </Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Score Reward</Text>
                                            <Text style={[
                                                styles.infoValue, 
                                                item.gameStatus === 'win' 
                                                    ? { color: colors.successMsg || "#4CD964", fontWeight: "700" } 
                                                    : { color: colors.text }
                                            ]}>
                                                {item.gameStatus === 'win' ? `+${item.point} pts` : `0 pts`}
                                            </Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Match Duration</Text>
                                            <Text style={[styles.infoValue, { color: colors.text }]}>{item.duration}</Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: colors.navDefaultIcon }]}>Completed At</Text>
                                            <Text style={[styles.infoValue, { color: colors.text }]}>{formatMatchDate(item.createdAt)}</Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            <BottomNavBar />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginTop: 60, marginBottom: 20 },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    list: { flex: 1, width: "100%" },
    listContent: { paddingHorizontal: 20, paddingBottom: 120 },
    card: { borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerLeft: { gap: 4, flex: 1 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
    gameName: { fontSize: 17, fontWeight: "700" },
    statusBadge: { overflow: "hidden", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: "700", textAlign: "center", minWidth: 60 },
    arrowIcon: { fontSize: 10, opacity: 0.5 },
    timeText: { fontSize: 12, opacity: 0.6 },
    cardBody: { gap: 12, marginTop: 12 },
    divider: { height: 1, opacity: 0.1, marginBottom: 4 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16 },
    infoLabel: { fontSize: 14 },
    infoValue: { flex: 1, fontSize: 14, fontWeight: "500", textAlign: "right" },
});