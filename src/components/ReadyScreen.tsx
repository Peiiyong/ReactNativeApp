import AppButton from '@/components/AppButton';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../theme/useThemeColors';
import AppLoading from './AppLoading';

type MetaItem = {
  label: string;
};

type ReadyScreenProps = {
  gameName: string;
  description: string;
  metaItems?: MetaItem[];
  loading?: boolean;
  onStart: () => void;
  onCancel: () => void;
};

export default function ReadyScreen({
  gameName,
  description,
  metaItems = [],
  loading = false,
  onStart,
  onCancel,
}: ReadyScreenProps) {
  const colors = useThemeColors();

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <View style={[styles.readyCard, { backgroundColor: colors.cardBackground[0] }]}>
        <Text style={[styles.readyTitle, { color: colors.text }]}>{gameName}</Text>
        <Text style={[styles.readySubtitle, { color: colors.navDefaultIcon }]}>
          {description}
        </Text>

        {loading ? (
          <AppLoading />
        ) : metaItems.length > 0 ? (
          <View style={styles.readyMetaRow}>
            {metaItems.map((item, index) => (
              <View
                key={index}
                style={[styles.readyMetaPill, { backgroundColor: colors.background }]}
              >
                <Text style={[styles.readyMetaText, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.readyBtnWrap}>
          <AppButton title="I'm Ready — Start Game" onPress={onStart} icon="play" />
          <AppButton title="Not Now" onPress={onCancel} icon="log-out" />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  readyCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  readyTitle: {
    fontSize: 40,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Baloo2',
  },

  readySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Baloo2',
  },

  readyMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  readyMetaPill: {
    borderColor: "#fff",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  readyMetaText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Baloo2',
  },
  
  readyBtnWrap: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
});