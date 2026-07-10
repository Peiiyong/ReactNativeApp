import AppHeader from "@/components/AppHeader";
import AppLoading from "@/components/AppLoading";
import BottomNavBar from "@/components/BottomNavBar";
import Toast from "@/components/Toast";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { equalTo, onValue, orderByChild, push, query, ref, update } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, database } from "../firebase/firebase";
import { useThemeColors } from "../theme/useThemeColors";

type RewardItem = {
  id: string;
  rewardName: string;
  rewardType: number; // 1: EXCHANGE, 2: LEVEL_GIFT
  targetValue: number; // currentPoints for EXCHANGE, level for LEVEL_GIFT
  limitCount: number;
  expiredDuration: number;
  createdAt: number;
};

type UserRewardItem = {
  userRewardId: string;
  userId: string;
  rewardId: string;
  status: number;
};

const { width } = Dimensions.get("window");
const COLUMN_GAP = 12;
const CARD_WIDTH = (width - 40 - COLUMN_GAP * 2) / 2;

export default function Rewards() {
  const colors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [customUserId, setCustomUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState({ currentPoints: 0, level: 1 });
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [userRewards, setUserRewards] = useState<UserRewardItem[]>([]);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ visible: true, message, type });
  };

  // get user data
  const loadUserData = useCallback(() => {
    const user = auth.currentUser;
    if (!user) return;

    const usersRef = ref(database, "users");
    const userQuery = query(usersRef, orderByChild("authUid"), equalTo(user.uid));

    return onValue(userQuery, (snapshot) => {
      if (snapshot.exists()) {
        const dataMap = snapshot.val();
        const uId = Object.keys(dataMap)[0]; 
        const data = dataMap[uId];
        
        setCustomUserId(uId);
        setUserData({
          currentPoints: data.currentPoints ?? 0,
          level: data.level ?? 1,
        });
      } else {
        setCustomUserId(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const unsubUser = loadUserData();
      return () => unsubUser?.();
    });
    return unsubscribeAuth;
  }, [loadUserData]);

  // 2. 监听奖励基础配置 (reward)
  useEffect(() => {
    const rewardsRef = ref(database, "reward");
    const unsubscribe = onValue(rewardsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setRewards([]);
        return;
      }
      const nextRewards: RewardItem[] = Object.entries(data).map(([id, value]: [string, any]) => ({
        id,
        rewardName: value.rewardName ?? "Unknown Reward",
        rewardType: value.rewardType ?? 1,
        targetValue: value.targetValue ?? 0,
        limitCount: value.limitCount ?? 1,
        expiredDuration: value.expiredDuration ?? 30,
        createdAt: value.createdAt ?? Date.now(),
      }));
      setRewards(nextRewards);
    });
    return () => unsubscribe();
  }, []);

  // 3. 监听所有已兑换记录 (users_reward) 用于限购计算
  useEffect(() => {
    // 提示：如果你数据库里叫 userReward，请将此处对应的字符串改为 "userReward"
    const userRewardsRef = ref(database, "users_reward");
    const unsubscribe = onValue(userRewardsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUserRewards([]);
        return;
      }
      const nextUserRewards: UserRewardItem[] = Object.entries(data).map(([id, value]: [string, any]) => ({
        userRewardId: id,
        userId: value.userId,
        rewardId: value.rewardId,
        status: value.status,
      }));
      setUserRewards(nextUserRewards);
    });
    return () => unsubscribe();
  }, []);

  // 4. 处理购买/兑换逻辑
  const handleClaimReward = async (reward: RewardItem) => {
    const user = auth.currentUser;
    if (!user || !customUserId) {
      showToast("User data is not fully loaded yet.", "error");
      return;
    }

    // 核心改动：计算当前用户拥有的数量时，使用 customUserId (如 U00001) 比对
    const claimedCount = userRewards.filter(
      (ur) => ur.userId === customUserId && ur.rewardId === reward.id
    ).length;

    if (claimedCount >= reward.limitCount) {
      showToast("You have reached the purchase limit for this reward!", "error");
      return;
    }

    if (reward.rewardType === 1) {
      // 积分兑换检查
      if (userData.currentPoints < reward.targetValue) {
        showToast("Insufficient points!", "error");
        return;
      }
    } else if (reward.rewardType === 2) {
      // 等级礼包检查
      if (userData.level < reward.targetValue) {
        showToast(`Requires Level ${reward.targetValue} to unlock!`, "error");
        return;
      }
    }

    try {
      setLoading(true);

      // 计算过期时间
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() + reward.expiredDuration);

      // a. 准备更新的数据载荷
      const newUserRewardRef = push(ref(database, "users_reward"));
      const userRewardId = newUserRewardRef.key;

      const userRewardPayload = {
        userRewardId: userRewardId,
        userId: customUserId, // 核心改动：将真实的 customUserId (如 U00001) 存入背包记录
        rewardId: reward.id,
        status: 2, // IN STORE
        expiredDate: expiredDate.toISOString(),
        createdAt: new Date().toISOString(),
      };

      // 建立多路径原子事务
      const updates: any = {};
      updates[`users_reward/${userRewardId}`] = userRewardPayload;

      // b. 如果是积分购买，扣除对应路径上的用户积分
      if (reward.rewardType === 1) {
        // 核心改动：扣减积分路径修正为以 customUserId 为节点
        updates[`users/${customUserId}/currentPoints`] = userData.currentPoints - reward.targetValue;
      }

      // 统一提交事务，防止积分扣了背包没塞进去的卡单情况
      await update(ref(database), updates);

      showToast("Successfully claimed! Checked in My Bag.", "success");
    } catch (error) {
      console.error(error);
      showToast("Transaction failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={colors.innerBackground} style={styles.container}>
      <AppHeader
        title="Rewards"
        rightIcon="bag-handle-outline"
        onRightPress={() => router.push("/mybag" as any)}
      />

      <View style={[styles.pointsBar, { backgroundColor: colors.cardBackground[0] }]}>
        <Text style={[styles.pointsText, { color: colors.text }]}>
          🪙 Points: <Text style={{ color: "#FFD700" }}>{userData.currentPoints}</Text> | ⭐ Level: {userData.level}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <AppLoading />
        ) : (
          <View style={styles.grid}>
            {rewards.map((reward) => {
              // 核心改动：渲染列表和限购文字时，实时比对过滤也用 customUserId 
              const claimedCount = userRewards.filter(
                (ur) => ur.userId === customUserId && ur.rewardId === reward.id
              ).length;
              const isSoldOut = claimedCount >= reward.limitCount;
              const isLevelLocked = reward.rewardType === 2 && userData.level < reward.targetValue;

              return (
                <Pressable
                  key={reward.id}
                  onPress={() => !isSoldOut && handleClaimReward(reward)}
                  style={{ width: CARD_WIDTH }}
                  disabled={isSoldOut}
                >
                  <LinearGradient
                    colors={colors.cardBackground}
                    style={[styles.card, isSoldOut && styles.cardDisabled]}
                  >
                    <View style={[styles.imageWrap, { backgroundColor: colors.primary }]}>
                      <Ionicons
                        name={reward.rewardType === 1 ? "gift-outline" : "ribbon-outline"}
                        size={40}
                        color={colors.textWhite}
                      />
                      {isSoldOut && (
                        <View style={styles.overlay}>
                          <Text style={styles.overlayText}>LIMIT OUT</Text>
                        </View>
                      )}
                    </View>

                    <Text numberOfLines={1} style={[styles.rewardName, { color: colors.text }]}>
                      {reward.rewardName}
                    </Text>

                    <Text style={[styles.rewardMeta, { color: colors.navDefaultIcon }]}>
                      {reward.rewardType === 1 ? `🪙 ${reward.targetValue} Pts` : `⭐ Lv.${reward.targetValue} Gift`}
                    </Text>

                    <Text style={[styles.limitText, { color: isSoldOut ? colors.errorMsg : colors.text }]}>
                      Limit: {claimedCount}/{reward.limitCount}
                    </Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNavBar />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pointsBar: { padding: 12, marginHorizontal: 20, borderRadius: 12, marginVertical: 10, alignItems: "center" },
  pointsText: { fontSize: 15, fontWeight: "600", fontFamily: "Baloo2" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { borderRadius: 16, padding: 10, borderWidth: 2, borderColor: "#fff", gap: 4 },
  cardDisabled: { opacity: 0.6 },
  imageWrap: { width: "100%", aspectRatio: 1.2, borderRadius: 12, alignItems: "center", justifyContent: "center", position: "relative" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  overlayText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  rewardName: { fontSize: 13, fontFamily: "Baloo2", fontWeight: "600", marginTop: 4 },
  rewardMeta: { fontSize: 12, fontFamily: "Baloo2", fontWeight: "bold" },
  limitText: { fontSize: 11, fontFamily: "Baloo2" },
});