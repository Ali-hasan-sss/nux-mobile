import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text } from "@/components/AppText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";

interface BouncingLogoLoaderProps {
  size?: number;
  message?: string;
}

export function BouncingLogoLoader({
  size = 120,
  message,
}: BouncingLogoLoaderProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.3);
  const shadowRadius = useSharedValue(8);
  const rotateY = useSharedValue(0);
  const rotateX = useSharedValue(0);

  useEffect(() => {
    // Animation sequence: multiple bounces with decreasing height
    const bounceSequence = () => {
      const bounces = [
        { height: -80, duration: 400 }, // First bounce - highest
        { height: -60, duration: 350 }, // Second bounce
        { height: -45, duration: 300 }, // Third bounce
        { height: -35, duration: 280 }, // Fourth bounce
        { height: -25, duration: 260 }, // Fifth bounce
        { height: -18, duration: 240 }, // Sixth bounce
        { height: -12, duration: 220 }, // Seventh bounce
        { height: -8, duration: 200 }, // Eighth bounce
        { height: -5, duration: 180 }, // Ninth bounce
        { height: -3, duration: 160 }, // Tenth bounce
      ];

      const sequence = bounces.flatMap((bounce) => {
        return [
          // Going up
          withTiming(
            bounce.height,
            {
              duration: bounce.duration,
              easing: Easing.out(Easing.quad),
            },
            () => {
              // Scale down when going up (ball compresses)
              scale.value = withTiming(0.9, { duration: bounce.duration / 2 });
              // Shadow becomes smaller and less opaque when ball is up
              shadowOpacity.value = withTiming(0.1, {
                duration: bounce.duration / 2,
              });
              shadowRadius.value = withTiming(4, {
                duration: bounce.duration / 2,
              });
            }
          ),
          // Coming down
          withTiming(
            0,
            {
              duration: bounce.duration,
              easing: Easing.in(Easing.quad),
            },
            () => {
              // Scale up when hitting ground (ball expands)
              scale.value = withTiming(1.1, { duration: bounce.duration / 3 });
              // Shadow becomes larger and more opaque when ball hits ground
              shadowOpacity.value = withTiming(0.5, {
                duration: bounce.duration / 3,
              });
              shadowRadius.value = withTiming(15, {
                duration: bounce.duration / 3,
              });
              // Then return to normal
              scale.value = withTiming(1, { duration: bounce.duration / 3 });
              shadowOpacity.value = withTiming(0.3, {
                duration: bounce.duration / 3,
              });
              shadowRadius.value = withTiming(8, {
                duration: bounce.duration / 3,
              });
            }
          ),
        ];
      });

      return withSequence(...sequence);
    };

    // Start the bouncing animation
    translateY.value = withRepeat(
      bounceSequence(),
      -1, // Infinite repeat
      false // Don't reverse
    );

    // 3D rotation animation - subtle rotation for depth effect
    rotateY.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Subtle X rotation for 3D effect
    rotateX.value = withRepeat(
      withSequence(
        withTiming(15, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-15, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, []);

  // Animated style for the logo with 3D effect
  const logoAnimatedStyle = useAnimatedStyle(() => {
    // Calculate 3D rotation with perspective effect
    const perspective = 1000;
    const rotateYRad = (rotateY.value * Math.PI) / 180;
    const rotateXRad = (rotateX.value * Math.PI) / 180;

    // Apply perspective transform
    const scaleZ = interpolate(rotateY.value, [0, 360], [1, 0.95], "clamp");

    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value * scaleZ },
        { rotateY: `${rotateY.value}deg` },
        { rotateX: `${rotateX.value}deg` },
      ],
    };
  });

  // Animated style for the shadow
  const shadowAnimatedStyle = useAnimatedStyle(() => {
    const shadowScale = interpolate(
      translateY.value,
      [-80, 0],
      [0.3, 1.2], // Shadow smaller when ball is up, larger when down
      "clamp"
    );

    return {
      opacity: shadowOpacity.value,
      transform: [{ scale: shadowScale }],
      shadowRadius: shadowRadius.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Shadow */}
      <Animated.View
        style={[
          styles.shadow,
          shadowAnimatedStyle,
          {
            width: size * 0.8,
            height: size * 0.15,
            borderRadius: size * 0.4,
          },
        ]}
      />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View
          style={[
            styles.logoWrapper,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          {/* Outer glow/shadow for 3D depth */}
          <View style={styles.logoGlow} />

          {/* Main logo container with gradient background */}
          <LinearGradient
            colors={["rgba(168, 85, 247, 0.2)", "rgba(0, 217, 255, 0.2)"]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* 3D highlight effect - top-left shine */}
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.4)",
                "rgba(255, 255, 255, 0.1)",
                "transparent",
              ]}
              style={styles.logoHighlight}
              start={{ x: 0.2, y: 0.2 }}
              end={{ x: 0.8, y: 0.8 }}
            />
            {/* Additional bottom shadow for depth */}
            <LinearGradient
              colors={["transparent", "rgba(0, 0, 0, 0.2)"]}
              style={styles.logoShadow}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 0.5, y: 1 }}
            />

            {/* Logo image */}
            <View style={styles.logoContent}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={[
                  styles.logoImage,
                  {
                    width: size * 0.7,
                    height: size * 0.7,
                  },
                ]}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Message */}
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    overflow: "visible",
    elevation: 25,
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  logoGlow: {
    position: "absolute",
    width: "130%",
    height: "130%",
    borderRadius: 1000,
    backgroundColor: "rgba(168, 85, 247, 0.4)",
    top: "-15%",
    left: "-15%",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 35,
  },
  logoGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 1000,
    overflow: "hidden",
  },
  logoHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 1000,
    zIndex: 2,
  },
  logoShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 1000,
    zIndex: 1,
  },
  logoContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  logoImage: {
    tintColor: undefined, // Keep original logo colors
  },
  shadow: {
    position: "absolute",
    backgroundColor: "#000000",
    bottom: "40%", // Position shadow below the logo
    alignSelf: "center",
  },
  message: {
    marginTop: 40,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
