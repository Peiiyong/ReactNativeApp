import AppHeader from '@/components/AppHeader';
import GamePauseModal from '@/components/GamePauseModal';
import GameResultModal, { GameResultData } from '@/components/GameResultModal';
import ProfileAvatar from '@/components/ProfileAvatar';
import ReadyScreen from '@/components/ReadyScreen';
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Accelerometer } from "expo-sensors";
import { onAuthStateChanged } from 'firebase/auth';
import { get, push, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
    BackHandler,
    Dimensions,
    StyleSheet,
    Text,
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

type FloatingText = {
    id: number;
    x: number;
    y: number;
    text: string;
    color: string;
};

type ProfileState = {
    username: string;
    avatarUrl: string | null;
    level: number;
    exp: number;
};

export default function FoodCatchingGame() {
    const colors = useThemeColors();
    const { gameConfigId } = useLocalSearchParams<{ gameConfigId: string }>();
    const configId = gameConfigId || "2";

    const [config, setConfig] = useState<any>(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [gamePoints, setGamePoints] = useState<number>(0);

    // Ready gate — matches TicTacToe: nothing runs until the player taps Start
    const [gameStarted, setGameStarted] = useState(false);

    const [profile, setProfile] = useState<ProfileState>({
        username: 'Player',
        avatarUrl: null,
        level: 1,
        exp: 0,
    });

    const [gameActive, setGameActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [basketX, setBasketX] = useState(SCREEN_WIDTH / 2 - 45);
    const [items, setItems] = useState<FallingItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [isGoldenFlash, setIsGoldenFlash] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

    const [pauseModalVisible, setPauseModalVisible] = useState(false);
    const [endModalVisible, setEndModalVisible] = useState(false);
    const [endModalData, setEndModalData] = useState<GameResultData | null>(null);

    const startTimeRef = useRef<Date | null>(null);
    const hasSavedHistory = useRef(false);

    const BASKET_WIDTH = 90;
    const BASKET_HEIGHT = 20;
    const ITEM_SIZE = 35;

    const [gameHeight, setGameHeight] = useState(0);

    const scoreRef = useRef(score);
    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    // Load current player's profile — same pattern as TicTacToe
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace('/login');
                return;
            }

            const usersRef = ref(database, "users");
            get(usersRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const usersData = snapshot.val();
                    const foundKey = Object.keys(usersData).find(
                        (key) => usersData[key].authUid === user.uid || key === user.uid
                    );

                    if (foundKey) {
                        const data = usersData[foundKey];
                        setProfile({
                            username: data.userName ?? data.username ?? user.displayName ?? user.email?.split('@')[0] ?? 'Player',
                            avatarUrl: data.profilePicture || user.photoURL || null,
                            level: data.level ?? 1,
                            exp: data.exp ?? 0,
                        });
                    } else {
                        console.warn(`No user data found for auth uid: ${user.uid}`);
                    }
                }
            });
        });

        return unsubscribe;
    }, []);

    const triggerFloatingText = (x: number, y: number, text: string, color: string) => {
        const id = Date.now() + Math.random();
        setFloatingTexts((prev) => [...prev, { id, x, y, text, color }]);
        setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        }, 500);
    };

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
            setConfigLoading(false);
        });
    }, [configId]);

    // phone back button — opens the pause menu instead of leaving abruptly
    useEffect(() => {
        const onBackPress = () => {
            if (!gameStarted || !gameActive) {
                return false;
            }

            openPauseMenu();
            return true;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [gameStarted, gameActive]);

    // accelerometer listener — pauses along with the rest of the game
    useEffect(() => {
        if (!gameActive || isPaused) return;

        Accelerometer.setUpdateInterval(20);

        const subscription = Accelerometer.addListener((accelerometerData) => {
            const { x } = accelerometerData;

            setBasketX((prevX) => {
                const nextX = prevX - x * 24;
                return Math.min(Math.max(0, nextX), SCREEN_WIDTH - BASKET_WIDTH);
            });
        });

        return () => subscription.remove();
    }, [gameActive, isPaused]);

    const basketXRef = useRef(basketX);
    useEffect(() => {
        basketXRef.current = basketX;
    }, [basketX]);

    // game loop
    useEffect(() => {
        if (!gameActive || isPaused) return;

        let animationFrameId: number;
        let lastSpawnTime = Date.now();

        const gameLoop = () => {
            setItems((prevItems) => {
                let isGameOverFromBomb = false;
                let scoreDelta = 0;

                const movedItems = prevItems.map((item) => ({
                    ...item,
                    y: item.y + item.speed,
                }));

                const basketY = gameHeight - 50;
                const currentBasketX = basketXRef.current;

                const remainingItems = movedItems.filter((item) => {
                    const hitBasket =
                        item.y + ITEM_SIZE >= basketY &&
                        item.y <= basketY + BASKET_HEIGHT &&
                        item.x + ITEM_SIZE >= currentBasketX &&
                        item.x <= currentBasketX + BASKET_WIDTH;

                    if (hitBasket) {
                        if (item.type === "food") {
                            scoreDelta += 5;
                            triggerFloatingText(item.x, basketY, "+5", "#10B981");
                        } else if (item.type === "golden_food") {
                            scoreDelta += 20;
                            triggerFloatingText(item.x, basketY - 15, "💥 +20 ✨", "#FFD700");
                            setIsGoldenFlash(true);
                            setTimeout(() => setIsGoldenFlash(false), 350);
                        } else if (item.type === "bomb") {
                            scoreDelta -= 15;
                            triggerFloatingText(item.x, basketY, "-15 💣", "#EF4444");
                        }
                        return false;
                    }
                    return item.y < SCREEN_HEIGHT;
                });

                if (scoreDelta !== 0) {
                    const nextScore = scoreRef.current + scoreDelta;
                    // Negative score ends the game immediately — no clamping to 0 first
                    if (nextScore < 0) {
                        isGameOverFromBomb = true;
                    }
                    setTimeout(() => {
                        setScore(nextScore);
                    }, 0);
                }

                if (isGameOverFromBomb) {
                    cancelAnimationFrame(animationFrameId);
                    setGameActive(false);
                    setTimeout(() => handleGameEndSettlement("lose"), 10);
                    return [];
                }

                const now = Date.now();
                if (now - lastSpawnTime > 350) {
                    lastSpawnTime = now;

                    if (Math.random() < 0.7) {
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
                }

                return remainingItems;
            });

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameActive, isPaused, config, gameHeight]);

    // Countdown timer
    useEffect(() => {
        if (!gameActive || isPaused) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setGameActive(false);
                    handleGameEndSettlement("win");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameActive, isPaused]);

    const handleReadyToStart = () => {
        setGameStarted(true);
        handleStartGame();
    };

    const handleStartGame = () => {
        setScore(0);
        setTimeLeft(config?.targetDuration || 30);
        setItems([]);
        setBasketX(SCREEN_WIDTH / 2 - 45);
        hasSavedHistory.current = false;
        startTimeRef.current = new Date();
        setGameActive(true);
    };

    const openPauseMenu = () => {
        if (!gameActive) return;
        setIsPaused(true);
        setPauseModalVisible(true);
    };

    const handleResume = () => {
        setPauseModalVisible(false);
        setIsPaused(false);
    };

    const handleExitFromPause = async () => {
        setPauseModalVisible(false);
        setGameActive(false);
        await handleGameEndSettlement('lose');
    };

    const handleGameEndSettlement = async (finalStatus: "win" | "lose") => {
        if (hasSavedHistory.current) return;
        hasSavedHistory.current = true;
        setIsSaving(true);

        const user = auth.currentUser;
        if (!user) {
            setIsSaving(false);
            return;
        }

        const finalScore = Math.max(0, scoreRef.current);
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

        let earnedPoints = finalStatus === "win" ? finalScore : 0;

        const endTime = new Date();
        const durationMs = startTimeRef.current ? endTime.getTime() - startTimeRef.current.getTime() : 0;
        const totalSeconds = Math.max(1, Math.floor(durationMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const durationString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        let leveledUp = false;
        let resultLevel = profile.level;
        let resultExp = profile.exp;
        let expToNextLevel: number | null = null;
        let nextLevelExpAbs: number | null = null;

        try {
            const userRef = ref(database, `users/${realUserId}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const currentExp = userData.exp || 0;
                const currentLevel = userData.level || 1;
                const currentPoints = userData.currentPoints || 0;

                let newExp = currentExp;
                let newLevel = currentLevel;

                const levelRef = ref(database, "level_config");
                const levelSnapshot = await get(levelRef);
                let levelConfigs: { level: number; requiredPoint: number }[] = [];

                if (levelSnapshot.exists()) {
                    levelConfigs = Object.values(levelSnapshot.val()) as any[];
                    levelConfigs.sort((a, b) => a.level - b.level);
                }

                if (finalStatus === "win" && earnedPoints > 0) {
                    newExp = currentExp + earnedPoints;

                    for (const lvlCfg of levelConfigs) {
                        if (newExp >= lvlCfg.requiredPoint) {
                            newLevel = lvlCfg.level;
                        }
                    }

                    await update(userRef, {
                        exp: newExp,
                        currentPoints: currentPoints + earnedPoints,
                        level: newLevel,
                    });

                    leveledUp = newLevel > currentLevel;
                }

                resultLevel = newLevel;
                resultExp = newExp;

                const nextLevelConfig = levelConfigs.find((c) => c.level === newLevel + 1);
                nextLevelExpAbs = nextLevelConfig ? nextLevelConfig.requiredPoint : null;
                expToNextLevel = nextLevelConfig ? Math.max(nextLevelConfig.requiredPoint - newExp, 0) : null;
            }

            const historyRef = ref(database, `user_history/${realUserId}`);
            await push(historyRef, {
                gameConfigId: configId,
                gameStatus: finalStatus,
                point: earnedPoints,
                duration: durationString,
                createdAt: endTime.getTime()
            });

            setEndModalData({
                status: finalStatus,
                earnedPoints,
                leveledUp,
                newLevel: resultLevel,
                currentExp: resultExp,
                nextLevelExp: nextLevelExpAbs,
                expToNextLevel,
            });
            setEndModalVisible(true);

        } catch (error) {
            console.error("结算存档发生错误:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetGame = () => {
        setEndModalVisible(false);
        setEndModalData(null);
        setItems([]);
        setBasketX(SCREEN_WIDTH / 2 - 45);
        setScore(0);
        setTimeLeft(config?.targetDuration || 30);
        setIsPaused(false);
        handleStartGame();
    };

    const handleExitToHome = () => {
        setEndModalVisible(false);
        router.replace('/home');
    };

    // --- Ready screen — shared component, same as TicTacToe ---
    if (!gameStarted) {
        return (
            <ReadyScreen
                gameName="Food Catching"
                description={
                    "📱 Tilt your phone to move the basket and catch falling food. " +
                    "Bombs cost you points — if your score ever drops below zero, the game ends immediately.\n\n" +
                    "🍎 +5 points  💣 -15 points  ✨ +20 points"
                }                
                loading={configLoading}
                metaItems={[
                    ...(config?.difficulty ? [{ label: String(config.difficulty).toUpperCase() }] : []),
                    { label: `Duration: ${config?.targetDuration ?? 30}s` },
                    { label: `Reward: up to ${gamePoints || 'your score'} pts` },
                ]}
                onStart={handleReadyToStart}
                onCancel={() => router.back()}
            />
        );
    }

    return (
        <LinearGradient colors={colors.innerBackground} style={styles.container}>
            <AppHeader
                title="Food Catch"
                rightIcon="pause-circle-outline"
                onRightPress={gameActive ? openPauseMenu : undefined}
            />

            {/* Player identity (left) + live game stats (right) */}
            <View style={styles.infoRow}>
                <LinearGradient colors={colors.cardBackground} style={styles.infoBlock}>
                    <ProfileAvatar
                        imageUri={profile.avatarUrl}
                        username={profile.username}
                        size={48}
                    />
                    <Text numberOfLines={1} style={[styles.playerName, { color: colors.text }]}>
                        {profile.username}
                    </Text>
                </LinearGradient>

                <LinearGradient colors={colors.cardBackground} style={styles.infoBlock}>
                    <Text style={[styles.statsLabel, { color: colors.navDefaultIcon }]}>⏱️ Time</Text>
                    <Text style={[styles.statsValue, { color: timeLeft <= 5 ? colors.errorMsg : colors.text }]}>
                        {timeLeft}s
                    </Text>
                </LinearGradient>

                <LinearGradient colors={colors.cardBackground} style={styles.infoBlock}>
                    <Text style={[styles.statsLabel, { color: colors.navDefaultIcon }]}>⭐ Score</Text>
                    <Text style={[styles.statsValue, { color: score < 15 ? colors.errorMsg : colors.successMsg }]}>
                        {score}
                    </Text>
                </LinearGradient>
            </View>

            <Text style={[styles.tipText, { color: colors.navDefaultIcon }]}>
                📱 Shake phone left or right to move the basket
            </Text>

            <Text style={[styles.tipText, { color: colors.navDefaultIcon }]}>
                🍎 +5 points    💣 -15 points   ✨ +20 points
            </Text>

            <View
                style={styles.gameArea}
                onLayout={(e) => setGameHeight(e.nativeEvent.layout.height)}
            >
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

                {floatingTexts.map((t) => (
                    <View key={t.id} style={[styles.floatingTextContainer, { left: t.x, top: t.y }]}>
                        <Text style={[styles.floatingText, { color: t.color }]}>{t.text}</Text>
                    </View>
                ))}

                {gameHeight > 0 && (
                    <View
                        style={[
                            styles.basket,
                            {
                                left: basketX,
                                top: gameHeight - 50,
                                width: BASKET_WIDTH,
                                height: BASKET_HEIGHT,
                                backgroundColor: isGoldenFlash ? "#FFDF00" : colors.primary,
                                shadowColor: isGoldenFlash ? "#FFD700" : "#000",
                                shadowRadius: isGoldenFlash ? 20 : 3,
                                shadowOpacity: isGoldenFlash ? 0.9 : 0.2,
                                elevation: isGoldenFlash ? 10 : 4,
                                borderWidth: isGoldenFlash ? 1.5 : 0,
                                borderColor: "#FFF",
                            }
                        ]}
                    />
                )}
            </View>

            {/* Pause menu — Resume / Exit */}
            <GamePauseModal
                visible={pauseModalVisible}
                onResume={handleResume}
                onExit={handleExitFromPause}
            />

            {/* End of match results */}
            <GameResultModal
                visible={endModalVisible}
                data={endModalData}
                username={profile.username}
                avatarUrl={profile.avatarUrl}
                onExit={handleExitToHome}
                onPlayAgain={handleResetGame}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
/*         alignItems: 'center',
        marginTop: 2,
        marginBottom: 8, 
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16, */
    },
    infoBlock: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 4,
        gap: 4,
    },
    playerName: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Baloo2',
    },
    statsLabel: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Baloo2',
    },
    statsValue: {
        fontSize: 28,
        fontWeight: '600',
        fontFamily: 'Baloo2',
    },
    tipText: {
        textAlign: "center",
        fontSize: 12,
        marginBottom: 5,
        marginTop: 5,
        fontWeight: "600",
        fontFamily: 'Baloo2',
    },
    gameArea: {
        flex: 1,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#fff',
        position: "relative",
        overflow: "hidden",
        marginBottom: 16,
        minHeight: 380,
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
    },
    basket: {
        position: "absolute",
        borderRadius: 6,
        padding: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    floatingTextContainer: {
        position: "absolute",
        zIndex: 5,
        width: 80,
        alignItems: "center",
    },
    floatingText: {
        fontSize: 18,
        fontWeight: "600",
        textShadowColor: "rgba(0,0,0,0.4)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});