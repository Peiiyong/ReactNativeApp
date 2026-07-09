import AppHeader from '@/components/AppHeader';
import GamePauseModal from '@/components/GamePauseModal';
import GameResultModal, { GameResultData } from '@/components/GameResultModal';
import ProfileAvatar from '@/components/ProfileAvatar';
import ReadyScreen from '@/components/ReadyScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { get, push, ref, update } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../firebase/firebase';
import { useThemeColors } from '../theme/useThemeColors';

const initialBoard = Array(9).fill(null);
const TIMER_LIMIT = 8; // countdown timer limit in seconds

type ProfileState = {
    username: string;
    avatarUrl: string | null;
    level: number;
    exp: number;
};

const TicTacToeGame = () => {
    const colors = useThemeColors();
    const { gameConfigId } = useLocalSearchParams<{
        gameConfigId: string;
    }>();
    const configId = gameConfigId || '1';

    const [gamePoints, setGamePoints] = useState<number>(0);
    const [configDifficulty, setConfigDifficulty] = useState<string>('');
    const [configLoading, setConfigLoading] = useState(true);

    const [gameStarted, setGameStarted] = useState(false);

    const [profile, setProfile] = useState<ProfileState>({
        username: 'Player',
        avatarUrl: null,
        level: 1,
        exp: 0,
    });

    const startTimeRef = useRef<Date | null>(null);
    const [board, setBoard] = useState(initialBoard);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(TIMER_LIMIT);
    const [isSaving, setIsSaving] = useState(false);

    const hasSavedHistory = useRef(false);
    const [secondsLeft, setSecondsLeft] = useState<number>(60);
    const [isTimerActive, setIsTimerActive] = useState<boolean>(true);

    const [pauseModalVisible, setPauseModalVisible] = useState(false);

    const [endModalVisible, setEndModalVisible] = useState(false);
    const [endModalData, setEndModalData] = useState<GameResultData | null>(null);

    useEffect(() => {
        // Listen for auth changes instead of reading a one-time snapshot —
        // this fires again whenever the logged-in user actually changes.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace('/login');
                return;
            }
            console.log("AUTH USER:", user?.uid);
            console.log("EMAIL:", user?.email);

            const usersRef = ref(database, "users");
            get(usersRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const usersData = snapshot.val();
                    const foundKey = Object.keys(usersData).find(
                        (key) =>
                            usersData[key].authUid === user.uid ||
                            key === user.uid
                    );

                    if (foundKey) {
                        const data = usersData[foundKey];
                        setProfile({
                            username: data.userName ?? data.username ?? user.displayName ??  user.email?.split('@')[0] ?? 'Player',
                            avatarUrl: data.profilePicture || user.photoURL || null,
                            level: data.level ?? 1,
                            exp: data.exp ?? 0,
                        });
                        console.log("DATABASE USER:", data);
                    } else {
                        console.warn(
                            `No user data found for auth uid: ${user.uid}`
                        );
                    }
                }
            });
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const onBackPress = () => {
            if (!gameStarted || winner) {
                return false;
            }

            openPauseMenu();
            return true;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

        return () => subscription.remove();
    }, [winner, gameStarted]);

    useEffect(() => {
        if (!configId) return;

        const configRef = ref(database, `game_config/${configId}`);
        get(configRef).then((snapshot) => {
            if (snapshot.exists()) {
                const configData = snapshot.val();
                if (configData.point !== undefined) {
                    setGamePoints(Number(configData.point));
                }
                setSecondsLeft(configData.targetDuration);
                setConfigDifficulty(configData.difficulty ?? '');
            } else {
                console.warn(`❌ 未在数据库中找到 game_config/${configId} 的配置`);
            }
        }).catch((err) => {
            console.error('加载 Firebase 游戏配置失败:', err);
        }).finally(() => {
            setConfigLoading(false);
        });
    }, [configId]);

    const handleReadyToStart = () => {
        startTimeRef.current = new Date();
        setGameStarted(true);
    };

    const openPauseMenu = () => {
        if (winner) return;
        setIsTimerActive(false);
        setPauseModalVisible(true);
    };

    const handleResume = () => {
        setPauseModalVisible(false);
        setIsTimerActive(true);
    };

    const handleExitFromPause = async () => {
        setPauseModalVisible(false);
        setWinner('lose');
        await handleGameEndSettlement('lose', true);
    };

    useEffect(() => {
        if (!gameStarted) return;

        const gameWinner = checkWinner(board);

        if (gameWinner) {
            setWinner(gameWinner);
            handleGameEndSettlement(gameWinner, false);
            return;
        }

        if (!isPlayerTurn && !gameWinner && !pauseModalVisible) {
            const aiTimeout = setTimeout(() => {
                makeAiMove();
            }, 600);
            return () => clearTimeout(aiTimeout);
        }
    }, [board, isPlayerTurn, gameStarted, pauseModalVisible]);

    useEffect(() => {
        if (!winner && gameStarted) {
            setTimeLeft(TIMER_LIMIT);
        }
    }, [isPlayerTurn, gameStarted]);

    useEffect(() => {
        if (!gameStarted || winner || !isTimerActive) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    const timeoutWinner = isPlayerTurn ? 'forfeit_player' : 'forfeit_ai';
                    setWinner(timeoutWinner);
                    handleGameEndSettlement(timeoutWinner, false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlayerTurn, winner, isTimerActive, gameStarted]);

    const checkWinner = (currentBoard: any[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a];
            }
        }
        if (currentBoard.every(square => square)) return 'draw';
        return null;
    };

    const makeAiMove = () => {
        const emptySquares = board
            .map((square, index) => (square === null ? index : null))
            .filter((val) => val !== null) as number[];

        if (emptySquares.length > 0) {
            const randomIndex = emptySquares[Math.floor(Math.random() * emptySquares.length)];
            const newBoard = [...board];
            newBoard[randomIndex] = 'O';
            setBoard(newBoard);
            setIsPlayerTurn(true);
        }
    };

    const handleSquarePress = (index: number) => {
        if (gameStarted && isPlayerTurn && !board[index] && !winner && !pauseModalVisible) {
            const newBoard = [...board];
            newBoard[index] = 'X';
            setBoard(newBoard);
            setIsPlayerTurn(false);
        }
    };

    // core function to handle game end settlement and telemetry sync
    const handleGameEndSettlement = async (finalWinner: string, isForfeitQuit: boolean) => {
        if (hasSavedHistory.current) return;
        hasSavedHistory.current = true;
        setIsSaving(true);

        const user = auth.currentUser;
        if (!user) {
            setIsSaving(false);
            return;
        }

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
            console.error("Failed to map custom realUserId:", idError);
        }
        
        let gameStatus: 'win' | 'lose' | 'draw' = 'draw';
        let earnedPoints = 0;

        if (isForfeitQuit) {
            gameStatus = 'lose';
            earnedPoints = 0;
        } else {
            if (finalWinner === 'X' || finalWinner === 'forfeit_ai') {
                gameStatus = 'win';
                earnedPoints = gamePoints;
            } else if (finalWinner === 'O' || finalWinner === 'forfeit_player') {
                gameStatus = 'lose';
                earnedPoints = 0;
            } else {
                gameStatus = 'draw';
                earnedPoints = 0;
            }
        }

        const endTime = new Date();
        const durationMs = startTimeRef.current ? endTime.getTime() - startTimeRef.current.getTime() : 0;
        const totalSeconds = Math.floor(durationMs / 1000);
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

                const levelRef = ref(database, 'level_config');
                const levelSnapshot = await get(levelRef);
                let levelConfigs: { level: number; requiredPoint: number }[] = [];

                if (levelSnapshot.exists()) {
                    levelConfigs = Object.values(levelSnapshot.val()) as any[];
                    levelConfigs.sort((a, b) => a.level - b.level);
                }

                if (gameStatus === 'win' && earnedPoints > 0) {
                    newExp = currentExp + earnedPoints;

                    for (const config of levelConfigs) {
                        if (newExp >= config.requiredPoint) {
                            newLevel = config.level;
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
                gameStatus: gameStatus,
                point: earnedPoints,
                duration: durationString,
                createdAt: endTime.getTime()
            });

            if (!isForfeitQuit) {
                setEndModalData({
                    status: gameStatus,
                    earnedPoints,
                    leveledUp,
                    newLevel: resultLevel,
                    currentExp: resultExp,
                    nextLevelExp: nextLevelExpAbs,
                    expToNextLevel,
                });
                setEndModalVisible(true);
            } else {
                router.replace('/home');
            }

        } catch (error) {
            console.error('Telemetry sync failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetGame = () => {
        setEndModalVisible(false);
        setEndModalData(null);
        setBoard(initialBoard);
        setIsPlayerTurn(true);
        setWinner(null);
        setTimeLeft(TIMER_LIMIT);
        startTimeRef.current = new Date();
        hasSavedHistory.current = false;
    };

    const handleExitToHome = () => {
        setEndModalVisible(false);
        router.replace('/home');
    };

    const getResultText = () => {
        if (winner === 'X') return "Victory! You beat the AI!";
        if (winner === 'O') return "Defeat! The AI outsmarted you.";
        if (winner === 'draw') return "Draw! An evenly matched game.";
        if (winner === 'forfeit_player') return "Timeout! You ran out of time.";
        if (winner === 'forfeit_ai') return "AI Timeout! AI brain fried, you win!";
        return `${isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}`;
    };

    // --- Ready screen ---
    if (!gameStarted) {
        return (
            <ReadyScreen
                gameName="Tic Tac Toe"
                description={`You'll play against the AI. Each move has an ${TIMER_LIMIT}s time limit — run out and you forfeit the round.`}
                loading={configLoading}
                metaItems={[
                    ...(configDifficulty ? [{ label: configDifficulty.toUpperCase() }] : []),
                    { label: `Reward: ${gamePoints} pts` },
                ]}
                onStart={handleReadyToStart}
                onCancel={() => router.back()}
            />
        );
    }

    // --- Actual match screen ---
    return (
        <LinearGradient colors={colors.innerBackground} style={styles.container}>
            <AppHeader
                title="Tic Tac Toe"
                rightIcon="pause-circle-outline"
                onRightPress={winner ? undefined : openPauseMenu}
            />

            {/* TIMER */}
            <LinearGradient colors={colors.cardBackground} style={styles.statusCard}>
                <Text style={[styles.resultText, { color: colors.text }]}>{getResultText()}</Text>
                {!winner && (
                    <View style={[styles.timerContainer, { backgroundColor: colors.boxDefault }]}>
                        <Text style={[styles.timerText, timeLeft <= 3 ? styles.timerUrgent : null, { color: timeLeft <= 3 ? colors.errorMsg : colors.successMsg }]}>
                            {timeLeft}s
                        </Text>
                    </View>
                )}
            </LinearGradient>

            {/* USER VS AI */}
            <View style={styles.vsContainer}>                
                <View style={[styles.playerBox, isPlayerTurn && !winner ? styles.activeTurn : null]}>
                    <ProfileAvatar
                        imageUri={profile.avatarUrl}
                        username={profile.username}
                        size={56}
                    />
                    <Text numberOfLines={1} style={[styles.playerName, { color: colors.text }]}>
                        {profile.username}
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: colors.primary }]}>
                        <Text style={styles.levelPillText}>Lv. {profile.level}</Text>
                    </View>
                </View>

                <View style={styles.vsDivider}><Text style={[styles.vsDividerText, { color: colors.navDefaultIcon }]}>VS</Text></View>

                <View style={[styles.playerBox, !isPlayerTurn && !winner ? styles.activeTurn : null]}>
                    <ProfileAvatar
                        localImage={require("../../assets/images/robot.png")}
                        username="AI (O)"
                        size={56}
                    />
                    <Text style={[styles.roleTitle, { color: colors.navDefaultIcon }]}>AI (O)</Text>
                    <Text style={[styles.emojiText, { color: colors.text }]}>
                        {winner === 'O' || winner === 'forfeit_player' ? '└( 🤖 )┘' : (winner === 'X' || winner === 'forfeit_ai' ? '( 🤖 💢 )' : '[ 🤖 ]')}
                    </Text>
                </View>
            </View>

            {/* GAME */}
            <LinearGradient colors={colors.cardBackground} style={styles.boardCard}>
                <View style={styles.board}>
                    {board.map((value, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.square, { borderColor: colors.text }]}
                            onPress={() => handleSquarePress(index)}
                            disabled={!!(value || winner || !isPlayerTurn || pauseModalVisible)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.squareText, value === 'X' ? { color: colors.primary } : { color: colors.successMsg }]}>
                                {value}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

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
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding:5
    },
    statusCard: {
        width: 250,
        borderRadius: 20,
        padding: 10,
        alignSelf:"center",
        alignItems: 'center',
/*         marginBottom: 10, */
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
    },
    resultText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        fontFamily: 'Baloo2',
    },
    timerContainer: {
        marginTop: 2,
        paddingHorizontal: 20,
        paddingVertical: 2,
        borderRadius: 999,
    },
    timerText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Baloo2',
    },
    timerUrgent: {
        color: '#EF4444',
    },
    vsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
/*         marginBottom: 2, */
        padding: 8,
    },
    playerBox: {
        borderRadius: 16,
        padding: 14,
        width: '43%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 6,
    },
    activeTurn: {
        borderColor: '#6366F1',
        shadowColor: '#6366F1',
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    roleTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        fontFamily: 'Baloo2',
    },
    playerName: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Baloo2',
    },
    levelPill: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
    },
    levelPillText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        fontFamily: 'Baloo2',
    },
    emojiText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        fontFamily: 'Baloo2',
    },
    vsDivider: {
        width: '10%',
        alignItems: 'center',
    },
    vsDividerText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#9CA3AF',
        fontFamily: 'Baloo2',
    },
    boardCard: {
        borderRadius: 24,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        marginBottom: 24,
        borderColor: "#fff",
        borderWidth: 2,
    },
    board: {
        width: 300,
        height: 300,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    square: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    squareText: {
        fontSize: 46,
        fontWeight: '600',
        fontFamily: 'Baloo2',
    },
});

export default TicTacToeGame;