import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { get, push, ref, update } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../firebase/firebase';
import { useThemeColors } from '../theme/useThemeColors';

const initialBoard = Array(9).fill(null);
const TIMER_LIMIT = 8; // countdown timer limit in seconds

const TicTacToeGame = () => {
    const colors = useThemeColors();
    const { gameConfigId } = useLocalSearchParams<{
        gameConfigId: string;
    }>();
    const configId = gameConfigId || '1';

    const [gamePoints, setGamePoints] = useState<number>(0);

    const startTimeRef = useRef<Date | null>(null);
    const [board, setBoard] = useState(initialBoard);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [winner, setWinner] = useState<string | null>(null); // 'X', 'O', 'draw', 'forfeit_player', 'forfeit_ai'
    const [timeLeft, setTimeLeft] = useState(TIMER_LIMIT);
    const [isSaving, setIsSaving] = useState(false);

    const hasSavedHistory = useRef(false);
    const [secondsLeft, setSecondsLeft] = useState<number>(60);
    const [isTimerActive, setIsTimerActive] = useState<boolean>(true);

    useEffect(() => {
        startTimeRef.current = new Date();
    }, []);

    // phone back button handling for mid-game exit
    // phone back button handling for mid-game exit
    useEffect(() => {
        const onBackPress = () => {
            if (!winner) {
                // stop countdown
                setIsTimerActive(false);

                // alert to confirm mid-game exit
                Alert.alert(
                    "Exit Match?",
                    "Are you sure you want to quit this match? It will be recorded as a Loss, and no points will be rewarded.",
                    [
                        {
                            text: "Stay & Play",
                            style: "cancel",
                            onPress: () => setIsTimerActive(true)
                        },
                        { text: "Quit Game", style: "destructive", onPress: () => handleMidGameQuit() }
                    ],
                    { cancelable: false }
                );
                return true; // successfully handled the back button press
            }
            return false; // enable default back button behavior if the game has ended
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

        return () => subscription.remove();
    }, [winner, board, isPlayerTurn]);

    useEffect(() => {
        if (!configId) return;

        const configRef = ref(database, `game_config/${configId}`);
        get(configRef).then((snapshot) => {
            if (snapshot.exists()) {
                const configData = snapshot.val();
                console.log("成功从 Firebase 实时加载游戏配置:", configData);

                if (configData.point !== undefined) {
                    setGamePoints(Number(configData.point));
                }
                setSecondsLeft(configData.targetDuration);
            } else {
                console.warn(`❌ 未在数据库中找到 game_config/${configId} 的配置`);
            }
        }).catch((err) => {
            console.error("加载 Firebase 游戏配置失败:", err);
        });
    }, [configId]);

    // quick mid-game quit handler
    const handleMidGameQuit = async () => {
        setWinner('lose');
        await handleGameEndSettlement('lose', true);
        router.replace('/home');
    };

    // gameWinner logic
    useEffect(() => {
        const gameWinner = checkWinner(board);

        if (gameWinner) {
            setWinner(gameWinner);
            handleGameEndSettlement(gameWinner, false);
            return;
        }

        if (!isPlayerTurn && !gameWinner) {
            const aiTimeout = setTimeout(() => {
                makeAiMove();
            }, 600);
            return () => clearTimeout(aiTimeout);
        }
    }, [board, isPlayerTurn]);

    // countdown timer logic
    useEffect(() => {
        if (!winner) {
            setTimeLeft(TIMER_LIMIT);
        }
    }, [isPlayerTurn]);

    useEffect(() => {
        // if the game has ended or the timer is paused, do not start a new interval
        if (winner || !isTimerActive) return;

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
    }, [isPlayerTurn, winner, isTimerActive]);

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
        if (isPlayerTurn && !board[index] && !winner) {
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

        try {
            if (gameStatus === 'win' && earnedPoints > 0) {
                const userRef = ref(database, `users/${realUserId}`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const userData = snapshot.val();

                    const currentExp = userData.exp || 0;
                    const currentLevel = userData.level || 1;
                    const currentPoints = userData.currentPoints || 0;

                    const newExp = currentExp + earnedPoints;
                    const levelRef = ref(database, "level_config");
                    const levelSnapshot = await get(levelRef);

                    let newLevel = currentLevel;

                    if (levelSnapshot.exists()) {
                        const levelConfigs = Object.values(levelSnapshot.val()) as any[];
                        levelConfigs.sort((a: any, b: any) => a.level - b.level);

                        for (const config of levelConfigs) {
                            if (newExp >= config.requiredPoint) {
                                newLevel = config.level;
                            }
                        }
                    }

                    // update user level in firebase
                    await update(userRef, {
                        exp: newExp,
                        currentPoints: currentPoints + earnedPoints,
                        level: newLevel,
                    });

/*                     if (newLevel > currentLevel) {
                        Alert.alert(
                            "🎉 Level Up!",
                            `Congratulations!\nYou reached Level ${newLevel}!`
                        );
                    } */
                }
            }

            const historyRef = ref(database, `user_history/${realUserId}`);
            await push(historyRef, {
                gameConfigId: configId,
                gameStatus: gameStatus,
                point: earnedPoints,
                duration: durationString,
                createdAt: endTime.getTime()
            });

            console.log(`Match telemetry reported with points: ${earnedPoints}`);

            if (!isForfeitQuit) {
                setTimeout(() => {
                    Alert.alert(
                        gameStatus === 'win' ? "Victory!!" : (gameStatus === 'lose' ? "Defeat" : "Draw Match"),
                        `Points Gained: +${earnedPoints}\n\nWould you like to play another match?`,
                        [
                            { text: "No, Back Home", style: "cancel", onPress: () => router.replace('/home') },
                            { text: "Play Again", onPress: () => handleResetGame() }
                        ],
                        { cancelable: false }
                    );
                }, 500);
            }

        } catch (error) {
            console.error("Telemetry sync failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetGame = () => {
        setBoard(initialBoard);
        setIsPlayerTurn(true);
        setWinner(null);
        setTimeLeft(TIMER_LIMIT);
        startTimeRef.current = new Date();
        hasSavedHistory.current = false;
    };

    const getResultText = () => {
        if (winner === 'X') return "Victory! You beat the AI!";
        if (winner === 'O') return "Defeat! The AI outsmarted you.";
        if (winner === 'draw') return "Draw! An evenly matched game.";
        if (winner === 'forfeit_player') return "Timeout! You ran out of time.";
        if (winner === 'forfeit_ai') return "AI Timeout! AI brain fried, you win!";
        return `${isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}`;
    };

    return (
        <LinearGradient colors={colors.innerBackground} style={styles.container}>
            <View style={[styles.statusCard, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.resultText, { color: colors.text }]}>{getResultText()}</Text>
                {!winner && (
                    <View style={[styles.timerContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.timerText, timeLeft <= 3 ? styles.timerUrgent : null, { color: timeLeft <= 3 ? '#EF4444' : colors.successMsg }]}>
                            {timeLeft}s
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.vsContainer}>
                <View style={[styles.playerBox, { backgroundColor: colors.cardBackground }, isPlayerTurn && !winner ? styles.activeTurn : null]}>
                    <Text style={[styles.roleTitle, { color: colors.navDefaultIcon }]}>Player (X)</Text>
                    <Text style={[styles.emojiText, { color: colors.text }]}>
                        {winner === 'X' || winner === 'forfeit_ai' ? '＼(￣▽￣)／' : (winner === 'O' || winner === 'forfeit_player' ? '(╯^╰)' : '( ＇ω＇ )')}
                    </Text>
                </View>

                <View style={styles.vsDivider}><Text style={[styles.vsDividerText, { color: colors.navDefaultIcon }]}>VS</Text></View>

                <View style={[styles.playerBox, { backgroundColor: colors.cardBackground }, !isPlayerTurn && !winner ? styles.activeTurn : null]}>
                    <Text style={[styles.roleTitle, { color: colors.navDefaultIcon }]}>AI (O)</Text>
                    <Text style={[styles.emojiText, { color: colors.text }]}>
                        {winner === 'O' || winner === 'forfeit_player' ? '└( 🤖 )┘' : (winner === 'X' || winner === 'forfeit_ai' ? '( 🤖 💢 )' : '[ 🤖 ]')}
                    </Text>
                </View>
            </View>

            <View style={[styles.boardCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.board}>
                    {board.map((value, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.square, { borderColor: colors.navDefaultIcon }]}
                            onPress={() => handleSquarePress(index)}
                            disabled={!!(value || winner || !isPlayerTurn)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.squareText, value === 'X' ? { color: colors.primary } : { color: colors.successMsg }]}>
                                {value}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.actionArea}>
                <TouchableOpacity
                    style={[styles.secondaryBtn, { backgroundColor: colors.cardBackground, borderColor: colors.navDefaultIcon }]}
                    onPress={() => {
                        if (!winner) {
                            setIsTimerActive(false);

                            Alert.alert(
                                "Exit Match?",
                                "Quit now? It will be recorded as a Lose.",
                                [
                                    {
                                        text: "Stay",
                                        style: "cancel",
                                        // continue countdown if user decides to stay
                                        onPress: () => setIsTimerActive(true)
                                    },
                                    { text: "Quit", style: "destructive", onPress: () => handleMidGameQuit() }
                                ],
                                { cancelable: false } // to prevent dismissing the alert by tapping outside
                            );
                        } else {
                            router.replace('/home');
                        }
                    }}
                    disabled={isSaving}
                >
                    {isSaving ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Back to Lobby</Text>}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    statusCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    resultText: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    timerContainer: {
        marginTop: 10,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 999,
    },
    timerText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#10B981',
    },
    timerUrgent: {
        color: '#EF4444',
    },
    vsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    playerBox: {
        borderRadius: 16,
        padding: 14,
        width: '43%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
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
    },
    emojiText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    vsDivider: {
        width: '10%',
        alignItems: 'center',
    },
    vsDividerText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#9CA3AF',
        fontStyle: 'italic',
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
        fontWeight: 'bold',
    },
    colorX: {
        color: '#EF4444',
    },
    colorO: {
        color: '#3B82F6',
    },
    actionArea: {
        gap: 12,
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
    },
    secondaryBtnText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TicTacToeGame;