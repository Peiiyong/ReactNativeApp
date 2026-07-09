import { Ionicons } from "@expo/vector-icons";
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../theme/useThemeColors";

type ProfileAvatarProps = {
  imageUri?: string | null;
  localImage?: ImageSourcePropType;
  username?: string;
  size?: number;
  onPress?: () => void;
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  badgeText?: string;
};

export default function ProfileAvatar({
  imageUri,
  localImage,
  username = "User",
  size = 104,
  onPress,
  badgeIcon,
  badgeText,
}: ProfileAvatarProps) {
  const colors = useThemeColors();
  const radius = size / 2;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View style={styles.container}>
        <View style={[styles.gradient ]}>
          {localImage ? (
            <Image
              source={localImage}
              style={[ styles.image,{ width:size, height:size, borderRadius:radius }]}
            />
          ) : imageUri ? (
            <Image
              source={{ uri:imageUri }}
              style={[ styles.image,{ width:size, height:size, borderRadius:radius }]}
            />
          ) : (
            <Text
                style={[
                styles.avatarText,
                {
                    width:size,
                    height:size,
                    borderRadius:radius,
                    backgroundColor: colors.primary,
                    color: colors.text2,
                    fontSize:size * 0.38,
                },
                ]}
            >
                { username.charAt(0).toUpperCase() }
                </Text>
            )
            }
        </View>

{/*         {showEditIcon && (
            <View style={[ styles.camera, { backgroundColor: colors.primary, borderColor: colors.text2 }]}>
            <Ionicons
                name="camera"
                size={18}
                color={colors.text2}
            />
            </View>
        )} */}

        {/* Badge */}
        { (badgeIcon || badgeText) && (
          <View style={[ styles.badge, { backgroundColor:colors.primary, borderColor:colors.text2, }]} >
            { badgeIcon && (
              <Ionicons
                name={badgeIcon}
                size={18}
                color={colors.text2}
              />
            )}
            { badgeText && (
              <Text style={[ styles.badgeText, { color:colors.text2 }]}>{badgeText}</Text>)
            }
            </View>
          )
        }
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:{
    position:"relative",
  },

  gradient:{
    alignItems:"center",
    justifyContent:"center",
    padding:3,
  },

  image:{
    resizeMode:"cover",
  },

  avatarText:{
    alignItems:"center",
    justifyContent:"center",
    textAlign:"center",
    fontFamily:"Baloo2",
    fontWeight:"600",
    textAlignVertical:"center",
  },

 badge:{
    position:"absolute",
    right:8,
    bottom:8,
    minWidth:34,
    height:34,
    paddingHorizontal:6,
    borderRadius:18,
    alignItems:"center",
    justifyContent:"center",
    flexDirection:"row",
    gap:3,
    borderWidth:2,
  },

  badgeText:{
    fontSize:14,
    fontWeight:"600",
    fontFamily:"Baloo2",
  },

/*   camera:{
    position:"absolute",
    right:0,
    bottom:0,
    width:34,
    height:34,
    borderRadius:17,
    alignItems:"center",
    justifyContent:"center",
    borderWidth: 1,
  }, */
});