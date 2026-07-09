import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type GameItem = {
  id:string;
  gameName:string;
  gamePicture?:string;
  requiredLevel?:number;
};

type GameCarouselProps = {
  games:GameItem[];
  onGamePress:(game:GameItem)=>void;
  onMorePress:()=>void;
};

export default function GameCarousel({
  games,
  onGamePress,
  onMorePress,
}:GameCarouselProps){
  const colors = useThemeColors();
  const {width} = Dimensions.get("window");
  // screen show 2 cards
  const cardWidth = (width - 60) / 2;

  // limit 5
  const displayGames = [
    ...games.slice(0,5),
    {
      id:"more",
      gameName:"More",
    }
  ];

  return (
    <FlatList
      data={displayGames}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item)=>item.id}
      contentContainerStyle={{ gap:12 }}
      renderItem={({item})=>{
        const isMore = item.id==="more";

        if(isMore){
          return (
            <Pressable  onPress={onMorePress} style={{ width: cardWidth }}>
              <LinearGradient colors={colors.cardBackground} style={styles.card}>
                <View style={[ styles.moreContainer,{ backgroundColor: colors.primary }]}>
                  <Ionicons
                    name="add"
                    size={35}
                    color={colors.text2}
                  />
                </View>

                <Text style={[ styles.moreGame,{ color:colors.text }]}>More Games</Text>
              </LinearGradient>
            </Pressable>
          );
        }

        return (
          <Pressable
            onPress={()=>onGamePress(item)}
            style={[ styles.card, { width:cardWidth, backgroundColor: colors.cardBackground[0]}]} >
            {
              item.gamePicture ? (
                <Image source={{  uri:item.gamePicture}}
                  style={styles.image}
                  resizeMode="cover"
                />
              ):(
                <View style={[ styles.imagePlaceholder, { backgroundColor: colors.navDefaultIcon}]}/>
            )}

            <View style={styles.info}>
              <Text numberOfLines={1} style={[ styles.gameName,{ color:colors.text}]}>
                {item.gameName}
              </Text>

              <Text style={[ styles.level,{ color: colors.navDefaultIcon }]}>
                Lv.{item.requiredLevel ?? 1}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card:{
    borderRadius:20,
    padding:10,
    overflow:"hidden",
  },

  image:{
    width:"100%",
    height:100,
    borderRadius:16,
  },

  imagePlaceholder:{
    width:"100%",
    height:100,
    borderRadius:16,
  },

  info:{
    marginTop:10,
    gap:4,
  },

  gameName:{
    fontSize:15,
    fontWeight:"600",
    fontFamily:"Baloo2",
  },

  level:{
    fontSize:12,
    fontFamily:"Baloo2",
  },

  moreContainer:{
    height:100,
    borderRadius:16,
    justifyContent:"center",
    alignItems:"center",
  },

  moreGame: {
    fontSize:15,
    fontWeight:"600",
    fontFamily:"Baloo2",
    textAlign:"center",
  }
});