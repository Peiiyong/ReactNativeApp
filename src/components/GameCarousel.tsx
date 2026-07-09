import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
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
  const listRef = useRef<FlatList>(null);
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

  const scrollNext = () => {
    listRef.current?.scrollToOffset({
      offset: cardWidth + 12,
      animated:true
    });
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={displayGames}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item)=>item.id}
        contentContainerStyle={{
          gap:12,
          paddingRight:50
        }}
        renderItem={({item})=>{
          const isMore = item.id==="more";

          if(isMore){
            return (
              <Pressable  onPress={onMorePress} style={{ width: cardWidth }}>
                <LinearGradient colors={colors.cardBackground} style={styles.card}>
                  <Image
                  source={require("../../assets/images/moreGame.png")}
                  style={styles.image}
                  resizeMode="cover"
                  />
                  <View style={styles.info}>
                    <Text style={[ styles.gameName,{ color:colors.text }]}>🎮 More Games</Text>
                    <Text style={[ styles.level,{ color: colors.navDefaultIcon }]}>Explore more games</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          }

          return (
            <Pressable onPress={()=>onGamePress(item)} style={{ width: cardWidth }}>
              <LinearGradient colors={colors.cardBackground} style={styles.card}>
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
              </LinearGradient>
            </Pressable>
          );
        }}
      />

      { displayGames.length > 2 &&
        (
          <Pressable
            onPress={scrollNext}
            style={[ styles.nextButton, { backgroundColor:colors.primary}]}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={colors.text2}
            />
          </Pressable>
        )
      }
    </View>
  )
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


  nextButton:{
    position:"absolute",
    right:4,
    top:"40%",
    width:35,
    height:35,
    borderRadius:20,
    alignItems:"center",
    justifyContent:"center",
    elevation:5,
  },
});