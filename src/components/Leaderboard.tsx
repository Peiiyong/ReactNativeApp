import { FlatList, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";
import ProfileAvatar from "./ProfileAvatar";

type LeaderboardItem = {
  id: string;
  name: string;
  photo?: string | null;
  level: number;
  exp: number;
};

type LeaderboardProps = {
  data: LeaderboardItem[];
  limit?: number;
};

export default function Leaderboard({
  data,
  limit = 10
}: LeaderboardProps) {
  const colors = useThemeColors();
  const leaderboard = data.slice(0, limit);
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const others = leaderboard.slice(3);

  const rankColors = {
    1: "#FFD700",
    2: "#C0C0C0",
    3: "#CD7F32"
  };

  const PlayerAvatar = ({
    item,
    size
  }: {
    item: LeaderboardItem;
    size: number;
  }) => (
    <ProfileAvatar
      imageUri={item.photo ?? null}
      username={item.name}
      size={size}
    />
  );

  const TopPlayer = ({
    item,
    rank
  }: {
    item: LeaderboardItem;
    rank: 1 | 2 | 3;
  }) => {
    const color = rankColors[rank];

    return (
      <View
        style={[
          styles.topCard,
          { borderColor: color },
          rank === 1 && styles.firstCard,
          rank === 2 && styles.secondCard,
          rank === 3 && styles.thirdCard,
        ]}
      >
        <View style={[ styles.rankBadge, { backgroundColor: color }]}>
          <Text style={styles.rankText}> {`#${rank}`}</Text>
        </View>

        <PlayerAvatar item={item} size={rank === 1 ? 80 : 60}/>

        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.level, { color: colors.navDefaultIcon }]}>Level {item.level}</Text>
        <Text numberOfLines={1} style={[styles.exp, { color }]}>{item.exp} EXP</Text>
      </View>
    )
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topSection}>
        {second && <TopPlayer item={second} rank={2} />}
        {first && <TopPlayer item={first} rank={1} />}
        {third && <TopPlayer item={third} rank={3} />}
      </View>

      <FlatList
        data={others}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={[styles.row, { backgroundColor: colors.cardBackground[0] }]}>
            <Text style={[styles.number, { color: colors.primary }]}>#{index + 4}</Text>
            <PlayerAvatar item={item} size={50} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.level, { color: colors.navDefaultIcon }]}>Level {item.level}</Text>
            </View>

            <Text style={[styles.otherExp, { color: colors.primary }]}> {item.exp}</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },

  topSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 22, 
    paddingBottom: 10,
    paddingHorizontal: 4,
  },

  topCard: {
    width: 92,
    height: 165,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingTop: 16, 
    paddingBottom: 14, 
    gap: 0,
  },

  firstCard: {
    width: 104,
    height: 220,
  },

  secondCard: {
    width: 96,
    height: 195,
  },

  thirdCard: {
    width: 96,
    height: 188,
  },

  rankBadge: {
    position: "absolute",
    top: -18, 
    alignSelf: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    zIndex: 1,
  },

  rankText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    fontFamily: "Baloo2",
  },

  name: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Baloo2",
  },

  level: {
    fontSize: 14,
    fontFamily: "Baloo2",
  },

  exp: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Baloo2",
  },

  listContent: {
    gap: 12,
  },

  row: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
  },

  number: {
    width: 40,
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Baloo2",
  },

  otherExp: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Baloo2",
  }

});