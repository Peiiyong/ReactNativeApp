import AppButton from '@/components/AppButton';
import AppModal from '@/components/AppModal';
import LevelProgressBar from '@/components/LevelProgressBar';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../theme/useThemeColors';

export type GameResultData = {
  status: 'win' | 'lose' | 'draw';
  earnedPoints: number;
  leveledUp: boolean;
  newLevel: number;
  currentExp: number;
  nextLevelExp: number | null;
  expToNextLevel: number | null;
};

type GameResultModalProps = {
  visible: boolean;
  data: GameResultData | null;
  username: string;
  avatarUrl: string | null;
  onExit: () => void;
  onPlayAgain: () => void;
};

export default function GameResultModal({
  visible,
  data,
  username,
  avatarUrl,
  onExit,
  onPlayAgain,
}: GameResultModalProps) {
  const colors = useThemeColors();

  if (!data) return null;

  return (
    <AppModal
      visible={visible}
      title={
        data.status === 'win' ? '🏆 Victory!' :
        data.status === 'lose' ? '💔 Defeat' :
        '🤝 Draw'
      }
      onClose={onExit}
    >
      <View style={styles.content}>
        <ProfileAvatar
          imageUri={avatarUrl}
          username={username}
          size={64}
        />

        <Text numberOfLines={1} style={[styles.username, { color: colors.text }]}>
          {username}
        </Text>

        <View style={[styles.rewardPill, { backgroundColor: colors.background }]}>
          <Ionicons name="star" size={16} color="#F5B301" />
          <Text style={[styles.rewardText, { color: colors.text }]}>
            {data.earnedPoints > 0 ? `+${data.earnedPoints} points` : '+0 points'}
          </Text>
        </View>

        {data.status === 'win' ? (
          data.leveledUp ? (
            <Text style={[styles.levelUpText, { color: colors.primary }]}>
              🎉 Level Up! You're now Level {data.newLevel}!
            </Text>
          ) : data.nextLevelExp !== null ? (
            <View style={styles.progressWrap}>
              <LevelProgressBar
                level={data.newLevel}
                currentExp={data.currentExp}
                nextLevelExp={data.nextLevelExp}
                width="90%"
              />
              <Text style={[styles.expText, { color: colors.navDefaultIcon }]}>
                {data.expToNextLevel} EXP to reach Level {data.newLevel + 1}
              </Text>
            </View>
          ) : (
            <Text style={[styles.expText, { color: colors.navDefaultIcon }]}>
              You've reached the max level!
            </Text>
          )
        ) : (
          <Text style={[styles.expText, { color: colors.navDefaultIcon }]}>
            No points this round — give it another shot!
          </Text>
        )}

        <View style={styles.btnRow}>
          <AppButton title="Exit" onPress={onExit} icon="exit-outline" />
          <AppButton title="Play Again" onPress={onPlayAgain} icon="refresh" />
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 48,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Baloo2',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  rewardText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Baloo2',
  },
  levelUpText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Baloo2',
  },
  progressWrap: {
    width: '100%',
    gap: 6,
    marginTop: 4,
    alignItems:'center'
  },
  expText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Baloo2',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});