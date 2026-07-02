import { router } from 'expo-router';
import { push, ref } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../firebase/firebase';

// initial state of the tic tac toe board
const initialBoard = Array(9).fill(null);

const TicTacToeGame = () => {
    const startTimeRef = useRef<Date | null>(null);
    const [board, setBoard] = useState(initialBoard);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true); // true for player X, false for player O
    const [winner, setWinner] = useState(null); // null for no winner, 'X' for player X, 'O' for player O

    useEffect(() => {
        startTimeRef.current = new Date();
        checkWinner();
    }, [board]);

    //check winner
    const checkWinner = () => {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];

            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                setWinner(board[a]);
                return;
            }
        }

        //check for draw
        if (board.every(square => square)) {
            setWinner('draw');
        }
    };

    const handleSquarePress = (index: number) => {
        //check if the square is empty and if there is no winner yet
        if (!board[index] && !winner) {
            const newBoard = [...board];
            newBoard[index] = isPlayerTurn ? 'X' : 'O';
            setBoard(newBoard);
            setIsPlayerTurn(!isPlayerTurn);
        }
    };

    const handleResetGame = () => {
        setBoard(initialBoard);
        setIsPlayerTurn(true);
        setWinner(null);
    };

    const home = async () => {
        if (!startTimeRef.current) {
            router.replace('/home');
            return;
        }

        const endTime = new Date();
        // calculate the duration in milliseconds
        const durationMs = endTime.getTime() - startTimeRef.current.getTime();
        // convert milliseconds to a more user-friendly format
        const totalSeconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const durationString = minutes > 0 ? `${minutes} mins ${seconds} secs` : `${seconds} secs`;

        const user = auth.currentUser;
        if (user) {
            try {
                // save history to Firebase Realtime Database
                const userHistoryRef = ref(database, `user_history/${user.uid}`);

                // push game data to Firebase
                await push(userHistoryRef, {
                    gameName: "Tic Tac Toe",
                    startTime: startTimeRef.current.toLocaleString(), // the time when the game was played (e.g., 2026/7/2 14:30:22)
                    duration: durationString,                         // game duration (e.g., 1 min 15 secs)
                    createdAt: endTime.getTime()                      // timestamp for sorting purposes
                });
                console.log("Game history saved successfully to the database!");
            } catch (error) {
                console.error("Game history saved failed:", error);
            }
        }

        router.replace("/home");
    };

    return (
        <View style={styles.container}>
            <View style={styles.board}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(index => (
                    <TouchableOpacity key={index} style={styles.square} onPress={() => handleSquarePress(index)}
                        disabled={!!(board[index] || winner)}>
                        <Text style={[styles.squareText, { color: board[index] === 'X' ? '#FF0000' : '#0000FF' }]}>
                            {board[index] ? board[index].toString() : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.result}>
                {
                    winner ? winner === 'draw' ? "It's a draw!" : `Player ${winner} wins!` : `Next player: ${isPlayerTurn ? 'X' : 'O'}'s turn`
                }
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleResetGame}>
                <Text style={styles.buttonText}>
                    Reset Game
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={home}>
                <Text style={styles.buttonText}>
                    Back to Home
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 30,
    },
    board: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    square: {
        width: 100,
        height: 100,
        borderWidth: 2,
        borderColor: '#363062',
        justifyContent: 'center',
        alignItems: 'center',
    },
    squareText: {
        fontSize: 36,
    },
    result: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        color: '#363062',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#363062',
        paddingHorizontal: 40,
        paddingVertical: 15,
        marginHorizontal: 60,
        borderRadius: 5,
        marginBottom: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        color: '#FFF',
    },
});

export default TicTacToeGame;