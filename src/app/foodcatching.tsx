import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Accelerometer } from "expo-sensors";
import { get, push, ref, update } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type FallingItem = {
    id: number;
    x: number;
    y: number;
    type: "food" | "bomb" | "golden_food";
    speed: number;
};

export default function FoodCatchingGame() {
    const colors = useThemeColors();
    const { gameConfigId } = useLocalSearchParams<{ gameConfigId: string }>();
    const configId = gameConfigId || "2";

    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [gamePoints, setGamePoints] = useState<number>(0);

    const [gameActive, setGameActive] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [basketX, setBasketX] = useState(SCREEN_WIDTH / 2 - 45);
    const [items, setItems] = useState<FallingItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const startTimeRef = useRef<Date | null>(null);
    const hasSavedHistory = useRef(false);

    // basket and item dimensions
    const BASKET_WIDTH = 90;
    const BASKET_HEIGHT = 20;
    const BASKET_Y = SCREEN_HEIGHT - 220;
    const ITEM_SIZE = 35;

    const [gameHeight, setGameHeight] = useState(0);

    const scoreRef = useRef(score);
    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    // get game config
    useEffect(() => {
        if (!configId) return;

        const configRef = ref(database, `game_config/${configId}`);
        get(configRef).then((snapshot) => {
            if (snapshot.exists()) {
                const configData = snapshot.val();
                setConfig(configData);
                if (configData.point !== undefined) {
                    setGamePoints(Number(configData.point));
                }
                setTimeLeft(configData.targetDuration || 30);
            }
        }).catch((err) => {
            console.error("加载游戏配置失败:", err);
        }).finally(() => {
            setLoading(false);
        });
    }, [configId]);

    // accelerometer listener
    useEffect(() => {
        if (!gameActive) return;

        Accelerometer.setUpdateInterval(20); // make it 50Hz for smoother basket movement

        const subscription = Accelerometer.addListener((accelerometerData) => {
            const { x } = accelerometerData;

            setBasketX((prevX) => {
                // use a multiplier to make the basket move faster with tilt
                const nextX = prevX - x * 24;
                return Math.min(Math.max(0, nextX), SCREEN_WIDTH - BASKET_WIDTH);
            });
        });

        return () => subscription.remove();
    }, [gameActive]);

    // 45 FPS game loop for falling items
    useEffect(() => {
        if (!gameActive) return;

        const gameInterval = setInterval(() => {
            setItems((prevItems) => {
                let isGameOverFromBomb = false;

                const movedItems = prevItems.map((item) => ({
                    ...item,
                    y: item.y + item.speed,
                }));

                const basketY = gameHeight - 50;

                const remainingItems = movedItems.filter((item) => {
                    const hitBasket =
                        item.y + ITEM_SIZE >= basketY &&
                        item.y <= basketY + BASKET_HEIGHT &&
                        item.x + ITEM_SIZE >= basketX &&
                        item.x <= basketX + BASKET_WIDTH;

                    if (hitBasket) {
                        if (item.type === "food") {
                            setScore((prev) => prev + 5);
                        } else if (item.type === "golden_food") {
                            setScore((prev) => prev + 20);
                        } else if (item.type === "bomb") {
                            setScore((prev) => {
                                const nextScore = prev - 15;
                                if (nextScore <= 0) {
                                    isGameOverFromBomb = true; // game over if score drops to 0 or below
                                    return 0;
                                }
                                return nextScore;
                            });
                        }
                        return false;
                    }
                    return item.y < SCREEN_HEIGHT;
                });

                if (isGameOverFromBomb) {
                    clearInterval(gameInterval);
                    setGameActive(false);
                    setTimeout(() => handleGameEndSettlement("lose"), 10);
                    return [];
                }

                // randomly spawn new items based on difficulty
                if (Math.random() < 0.08) {
                    const rand = Math.random();
                    let type: "food" | "bomb" | "golden_food" = "food";
                    let speed = config?.difficulty === "hard" ? 11 : config?.difficulty === "medium" ? 8 : 5;

                    if (rand < 0.26) {
                        type = "bomb";
                        speed += Math.random() * 2;
                    } else if (rand < 0.38) {
                        type = "golden_food";
                        speed = speed * 2.3;
                    } else {
                        type = "food";
                        speed += Math.random() * 2;
                    }

                    remainingItems.push({
                        id: Date.now() + Math.random(),
                        x: Math.random() * (SCREEN_WIDTH - ITEM_SIZE),
                        y: 0,
                        type,
                        speed,
                    });
                }

                return remainingItems;
            });
        }, 1000 / 45);

        return () => clearInterval(gameInterval);
    }, [gameActive, basketX, config]);

    // Countdown timer
    useEffect(() => {
        if (!gameActive) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setGameActive(false);
                    handleGameEndSettlement("win"); // win if time runs out
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameActive]);

    // start
    const handleStartGame = () => {
        setScore(0);
        setTimeLeft(config?.targetDuration || 30);
        setItems([]);
        setBasketX(SCREEN_WIDTH / 2 - 45);
        hasSavedHistory.current = false;
        startTimeRef.current = new Date(); // record the start time for duration calculation
        setGameActive(true);
    };

    // save game history to Firebase Realtime Database
    const handleGameEndSettlement = async (finalStatus: "win" | "lose") => {
        if (hasSavedHistory.current) return;
        hasSavedHistory.current = true;
        setIsSaving(true);

        const user = auth.currentUser;
        if (!user) {
            setIsSaving(false);
            return;
        }

        const finalScore = scoreRef.current;

        // get the real user ID from Realtime Database mapping
        let realUserId = user.uid;
        try {
            const usersRef = ref(database, "users");
            const usersSnapshot = await get(usersRef);
            if (usersSnapshot.exists()) {
                const usersData = usersSnapshot.val();
                const foundKey = Object.keys(usersData).find(
                    (key) => usersData[key].authUid === user.uid || key === user.uid
                );
                if (foundKey) realUserId = foundKey;
            }
        } catch (idError) {
            console.error("映射用户 ID 失败:", idError);
        }

        // calculate earned points based on game result
        let earnedPoints = finalStatus === "win" ? finalScore : 0;

        // calculate game duration
        const endTime = new Date();
        const durationMs = startTimeRef.current ? endTime.getTime() - startTimeRef.current.getTime() : 0;
        const totalSeconds = Math.max(1, Math.floor(durationMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const durationString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        try {
            // only update user points and level if the game was won
            if (finalStatus === "win" && earnedPoints > 0) {
                const userRef = ref(database, `users/${realUserId}`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const currentExp = userData.exp || 0;
                    const currentLevel = userData.level || 1;
                    const currentPoints = userData.currentPoints || 0;

                    const newExp = currentExp + earnedPoints;

                    // get the level config to determine if the user levels up
                    const levelRef = ref(database, "level_config");
                    const levelSnapshot = await get(levelRef);
                    let newLevel = currentLevel;

                    if (levelSnapshot.exists()) {
                        const levelConfigs = Object.values(levelSnapshot.val()) as any[];
                        levelConfigs.sort((a: any, b: any) => a.level - b.level);

                        for (const lvlCfg of levelConfigs) {
                            if (newExp >= lvlCfg.requiredPoint) {
                                newLevel = lvlCfg.level;
                            }
                        }
                    }

                    // sync the updated exp, points, and level back to the database
                    await update(userRef, {
                        exp: newExp,
                        currentPoints: currentPoints + earnedPoints,
                        level: newLevel,
                    });
                }
            }

            // save the game history to user_history
            const historyRef = ref(database, `user_history/${realUserId}`);
            await push(historyRef, {
                gameConfigId: configId,
                gameStatus: finalStatus, // 'win' or 'lose'
                point: earnedPoints,
                duration: durationString,
                createdAt: endTime.getTime()
            });

            console.log(`🎮 战绩已成功同步至 user_history! 结果为: ${finalStatus}, 分数: ${earnedPoints}`);

            // show an alert to the user with the game result and options to play again or go home
            setTimeout(() => {
                Alert.alert(
                    finalStatus === "win" ? "Victory!!" : "You Lose!",
                    finalStatus === "win"
                        ? `Time's up! Perfect catch!\nPoints Gained: +${earnedPoints}\n\nWould you like to play another match?`
                        : "Your points have been cleared by the bomb! Challenge failed.\n\nWould you like to try again?",
                    [
                        { text: "No, Back Home", style: "cancel", onPress: () => router.replace('/home') },
                        { text: "Play Again", onPress: () => handleResetGame() }
                    ],
                    { cancelable: false }
                );
            }, 400);

        } catch (error) {
            console.error("结算存档发生错误:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // reset game state for a new match
    const handleResetGame = () => {
        setItems([]);
        setBasketX(SCREEN_WIDTH / 2 - 45);
        setScore(0);
        setTimeLeft(config?.targetDuration || 30);
        setGameActive(false);
        hasSavedHistory.current = false;
    };

    if (loading) {
        return (
            <View style={[styles.centerWrap, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading Neon Engine...</Text>
            </View>
        );
    }

    return (
        // same ui
        <LinearGradient colors={colors.innerBackground} style={styles.container}>

            <View style={[styles.statusCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.resultText, { color: colors.text }]}>
                    {gameActive ? "Catching Fruit Mode" : "Ready to Tilt?"}
                </Text>

                <View style={styles.metricsRow}>
                    <Text style={[styles.metricText, { color: colors.text }]}>⏱️ Time: {timeLeft}s</Text>
                    <Text style={[styles.metricText, { color: score <= 15 ? '#EF4444' : colors.successMsg, fontWeight: '800' }]}>
                        ⭐ Score: {score}
                    </Text>
                </View>
            </View>

            <Text style={[styles.tipText, { color: colors.navDefaultIcon }]}>
                📱 Shake phone left or right to move the basket
            </Text>

            <View
                style={styles.gameArea}
                onLayout={(e) => setGameHeight(e.nativeEvent.layout.height)}
            >
                {!gameActive && (
                    <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: colors.primary }]}
                        onPress={handleStartGame}
                        disabled={isSaving}
                    >
                        <Text style={styles.startBtnText}>🚀 Start Gyro Challenge</Text>
                    </TouchableOpacity>
                )}

                {/* render falling items */}
                {items.map((item) => {
                    const isBomb = item.type === "bomb";
                    const isGolden = item.type === "golden_food";

                    return (
                        <View
                            key={item.id}
                            style={[
                                styles.fallingItem,
                                {
                                    left: item.x,
                                    top: item.y,
                                    // if it's a bomb, make it white with a black border; if golden food, make it gold; else red for normal food
                                    backgroundColor: isBomb
                                        ? "#FFFFFF"
                                        : isGolden
                                            ? "#FFD700"
                                            : "#EF4444",
                                    borderWidth: isBomb ? 1.5 : 0,
                                    borderColor: "#000000",
                                },
                            ]}
                        >
                            <Text style={{ fontSize: 18 }}>
                                {isBomb ? "💣" : isGolden ? "✨" : "🍎"}
                            </Text>
                        </View>
                    );
                })}

                {gameHeight > 0 && (
                    <View
                        style={[
                            styles.basket,
                            {
                                left: basketX,
                                top: gameHeight - 50,
                                width: BASKET_WIDTH,
                                height: BASKET_HEIGHT,
                                backgroundColor: colors.primary,
                            }
                        ]}
                    />
                )}
            </View>

            <View style={styles.actionArea}>
                <TouchableOpacity
                    style={[styles.secondaryBtn, { backgroundColor: colors.cardBackground, borderColor: colors.navDefaultIcon }]}
                    onPress={() => router.replace('/home')}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                        <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Back to Lobby</Text>
                    )}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
    },
    centerWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: "600"
    },
    statusCard: {
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    resultText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 4,
    },
    metricText: {
        fontSize: 15,
        fontWeight: '700',
    },
    tipText: {
        textAlign: "center",
        fontSize: 12,
        marginBottom: 16,
        fontWeight: "600"
    },
    gameArea: {
        flex: 1,
        borderRadius: 30,
        borderWidth: 1,
        position: "relative",
        overflow: "hidden",
        marginBottom: 24,
        marginVertical: 15,
        minHeight: 380,
        elevation: 4,
    },
    startBtn: {
        position: "absolute",
        alignSelf: "center",
        top: "42%",
        paddingHorizontal: 26,
        paddingVertical: 14,
        borderRadius: 99,
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6
    },
    startBtnText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "bold"
    },
    fallingItem: {
        position: "absolute",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3
    },
    basket: {
        position: "absolute",
        borderRadius: 6,
        padding: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4
    },
    basketInner: {
        flex: 1,
        borderRadius: 4
    },
    actionArea: {
        gap: 12,
        marginBottom: 20,
    },
    secondaryBtn: {
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    secondaryBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});