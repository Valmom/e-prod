import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function Splash() {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const showSecondLogo = useSharedValue(0);

  const { user } = useAuth();

  const firstLogoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const secondLogoStyle = useAnimatedStyle(() => ({
    opacity: showSecondLogo.value }
  ));

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 800 })
    );

    scale.value = withSequence(
      withTiming(1, { duration: 1500 }),
      withTiming(0.8, { duration: 800 })
    );

    setTimeout(() => {
      showSecondLogo.value = withTiming(1, { duration: 800 });
    }, 1800);

    setTimeout(() => {
      if (user) {
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/login");
      }
    }, 3000);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, firstLogoStyle]}>
        <Image
          source={require("../assets/eprod-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.logoContainer, secondLogoStyle]}>
        <Image
          source={require("../assets/equatorial-blue.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 250,
    height: 250,
  },
});