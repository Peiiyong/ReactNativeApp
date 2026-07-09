import AppButton from '@/components/AppButton';
import AppModal from '@/components/AppModal';
import { StyleSheet, View } from 'react-native';

type GamePauseModalProps = {
  visible: boolean;
  onResume: () => void;
  onExit: () => void;
};

export default function GamePauseModal({ visible, onResume, onExit }: GamePauseModalProps) {
  return (
    <AppModal
      visible={visible}
      title="Game Paused"
      description="Take a breather. Resume when you're ready, or exit — this match will be recorded as a Loss."
      onClose={onResume}
    >
      <View style={styles.btnRow}>
        <AppButton title="Resume" onPress={onResume} icon="play" />
        <AppButton title="Exit" onPress={onExit} icon="exit-outline" />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
});