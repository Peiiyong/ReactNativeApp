import { useRef, useState } from "react";
import { Dimensions, FlatList, Image, ImageSourcePropType, StyleSheet, Text, View, } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type BannerCarouselProps = {
  images: ImageSourcePropType[];
  height?: number;
};

export default function BannerCarousel({
  images,
  height = 170,
}: BannerCarouselProps) {
  const colors = useThemeColors();
  const bannerRef = useRef<FlatList<ImageSourcePropType>>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = Dimensions.get("window");
  const bannerWidth = width - 40;

  return (
    <View style={[ styles.bannerCard, { backgroundColor: colors.text2}]}>
      <FlatList
        ref={bannerRef}
        data={images}
        keyExtractor={(_, index)=>`banner-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}

        getItemLayout={(_, index)=>({
          length:bannerWidth,
          offset:bannerWidth * index,
          index,
        })}

        onMomentumScrollEnd={(event)=>{
          const index = Math.round(
            event.nativeEvent.contentOffset.x / bannerWidth
          );

          setCurrentIndex(index);
        }}

        renderItem={({item,index})=>(
          <View style={[ styles.bannerSlide,{ width:bannerWidth, height}]}>
            <Image
              source={item}
              style={styles.bannerImage}
              resizeMode="cover"
            />

            <View style={styles.bannerOverlay}>
              <Text style={[styles.bannerText, {color:colors.text2}]}>
                Banner {index + 1}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.paginationRow}>
        {images.map((_,index)=>(
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor:
                  index === currentIndex
                  ? colors.primary
                  : colors.navDefaultIcon
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  bannerCard:{
    borderRadius:24,
    overflow:"hidden",
  },

  bannerSlide:{
    position:"relative",
    height: 170,
  },

  bannerImage:{
    width:"100%",
    height:"100%",
  },

  bannerOverlay:{
    position:"absolute",
    left:16,
    bottom:16,
    paddingHorizontal:12,
    paddingVertical:8,
    borderRadius:16,
    backgroundColor:"rgba(0,0,0,0.35)",
  },

  bannerText:{
    fontSize:16,
    fontWeight:"600",
    fontFamily:"Baloo2",
  },

  paginationRow:{
    flexDirection:"row",
    justifyContent:"center",
    gap:8,
    paddingVertical:14,
  },

  paginationDot:{
    width:8,
    height:8,
    borderRadius:999,
  },
});