import { router } from 'expo-router';
import { push, ref } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../firebase/firebase';

const initialBoard = Array(9).fill(null);
const TIMER_LIMIT = 8;

const TicTacToeGame = () => {
    const startTimeRef = useRef<Date | null>(null);
    const [board, setBoard] = useState(initialBoard);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true); // true = 玩家 (X), false = AI (O)
    const [winner, setWinner] = useState<string | null>(null); // 'X', 'O', 'draw', 'forfeit_player', 'forfeit_ai'
    const [timeLeft, setTimeLeft] = useState(TIMER_LIMIT);

    // Initialize the start time when the component mounts
    useEffect(() => {
        startTimeRef.current = new Date();
    }, []);

    // AI move and winner check effect
    useEffect(() => {
        const gameWinner = checkWinner(board);
        
        if (gameWinner) {
            setWinner(gameWinner);
            return;
        }

        // AI move but game is not over yet
        if (!isPlayerTurn && !gameWinner) {
            // AI will make a move after a short delay to simulate thinking time
            const aiTimeout = setTimeout(() => {
                makeAiMove();
            }, 500);
            return () => clearTimeout(aiTimeout);
        }
    }, [board, isPlayerTurn]);

    // Countdown
    useEffect(() => {
        // If the game is over, stop the countdown
        if (winner) return;

        setTimeLeft(TIMER_LIMIT); // Reset timer each turn

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // Time's up, determine who forfeits
                    if (isPlayerTurn) {
                        setWinner('forfeit_player');
                    } else {
                        setWinner('forfeit_ai');
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [board, isPlayerTurn, winner]);

    const checkWinner = (currentBoard: any[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], 
            [0, 3, 6], [1, 4, 7], [2, 5, 8], 
            [0, 4, 8], [2, 4, 6]             
        ];

        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a]; // return 'X' or 'O'
            }
        }

        if (currentBoard.every(square => square)) {
            return 'draw';
        }
        return null;
    };

    // AI logic
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

    // Player's move
    const handleSquarePress = (index: number) => {
        // 只有是玩家回合、格子为空、且没有胜负时才可以点
        if (isPlayerTurn && !board[index] && !winner) {
            const newBoard = [...board];
            newBoard[index] = 'X';
            setBoard(newBoard);
            setIsPlayerTurn(false);
        }
    };

    const handleResetGame = () => {
        setBoard(initialBoard);
        setIsPlayerTurn(true);
        setWinner(null);
        setTimeLeft(TIMER_LIMIT);
        startTimeRef.current = new Date();
    };

    const home = async () => {
        if (!startTimeRef.current) {
            router.replace('/home');
            return;
        }

        const endTime = new Date();
        const durationMs = endTime.getTime() - startTimeRef.current.getTime();
        const totalSeconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const durationString = minutes > 0 ? `${minutes} mins ${seconds} secs` : `${seconds} secs`;

        const user = auth.currentUser;
        if (user) {
            try {
                const userHistoryRef = ref(database, `user_history/${user.uid}`);
                await push(userHistoryRef, {
                    gameName: "Tic Tac Toe (AI)",
                    startTime: startTimeRef.current.toLocaleString(),
                    duration: durationString,
                    createdAt: endTime.getTime()
                });
                console.log("Game history saved successfully!");
            } catch (error) {
                console.error("Game history saved failed:", error);
            }
        }
        router.replace("/home");
    };

    // get dynamic result text based on the game state
    const getResultText = () => {
        if (winner === 'X') return "🎉 Congratulations! You beat the AI!";
        if (winner === 'O') return "🤖 Oops, the AI won this round!";
        if (winner === 'draw') return "🤝 It's a tie!";
        if (winner === 'forfeit_player') return "⏰ Time's up and you didn't make a move, you lose!";
        if (winner === 'forfeit_ai') return "🤖 The AI took too long to think, you win!";
        return `Time left: ${timeLeft} seconds (${isPlayerTurn ? 'Your turn' : 'AI is thinking'})`;
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.result, winner?.includes('player') || winner === 'O' ? { color: '#FF0000' } : null]}>
                {getResultText()}
            </Text>

            <View style={styles.animationContainer}>
                <View style={styles.characterBox}>
                    <Text style={styles.characterRole}>Player (X)</Text>
                    {winner === 'X' || winner === 'forfeit_ai' ? (
                        <Text style={[styles.emoji, styles.bounceAnimation]}>＼(￣▽￣)／ {"\n"}Jump for joy!</Text>
                    ) : winner === 'O' || winner === 'forfeit_player' ? (
                        <Text style={styles.emoji}>(╯😭╰) {"\n"}Sad...</Text>
                    ) : (
                        <Text style={styles.emoji}>(  'ω' ) {"\n"}Preparing...</Text>
                    )}
                </View>

                <View style={styles.characterBox}>
                    <Text style={styles.characterRole}>AI Enemy (O)</Text>
                    {winner === 'O' || winner === 'forfeit_player' ? (
                        <Text style={[styles.emoji, styles.bounceAnimation]}>└( 🤖 )┘ {"\n"}Jump for joy!</Text>
                    ) : winner === 'X' || winner === 'forfeit_ai' ? (
                        <Text style={styles.emoji}>( 🤖 💢 ) {"\n"}Sad...</Text>
                    ) : (
                        <Text style={styles.emoji}>[ 🤖 ] {"\n"}Calculating...</Text>
                    )}
                </View>
            </View>

            <View style={styles.board}>
                {board.map((value, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.square} 
                        onPress={() => handleSquarePress(index)}
                        disabled={!!(value || winner || !isPlayerTurn)}
                    >
                        <Text style={[styles.squareText, { color: value === 'X' ? '#FF0000' : '#0000FF' }]}>
                            {value ? value.toString() : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleResetGame}>
                <Text style={styles.buttonText}>Reset Game</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={home}>
                <Text style={styles.buttonText}>Back to Lobby</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 30,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
    },
    board: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    square: {
        width: 100,
        height: 100,
        borderWidth: 3,
        borderColor: '#363062',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    squareText: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    result: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: '#363062',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    animationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    characterBox: {
        alignItems: 'center',
        backgroundColor: '#E9D5CA',
        padding: 12,
        borderRadius: 10,
        width: '42%',
        minHeight: 100,
        justifyContent: 'center',
    },
    characterRole: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#363062',
        marginBottom: 5,
    },
    emoji: {
        fontSize: 15,
        textAlign: 'center',
        color: '#435585',
        lineHeight: 22,
    },
    bounceAnimation: {
        fontWeight: 'bold',
        color: '#2d6a4f',
    },
    button: {
        backgroundColor: '#363062',
        paddingHorizontal: 40,
        paddingVertical: 14,
        marginHorizontal: 60,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        color: '#FFF',
    },
});

export default TicTacToeGame;