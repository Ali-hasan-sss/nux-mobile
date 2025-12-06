import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Bubble component - فقاعات
const Bubble = ({
  size,
  initialX,
  initialY,
  duration,
  delay,
  driftAmount = 20,
}: {
  size: number;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
  driftAmount?: number;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating upward animation with slight horizontal drift
    const animate = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -SCREEN_HEIGHT - size,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: driftAmount,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.2,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );

    const timer = setTimeout(() => {
      animate.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animate.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      {/* Main bubble */}
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: opacity,
            overflow: "hidden",
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(168, 85, 247, 0.4)",
            "rgba(0, 217, 255, 0.3)",
            "rgba(255, 107, 157, 0.25)",
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 0.7, y: 0.7 }}
        />
        {/* Highlight - لمعة ثلاثية الأبعاد مع حواف مشوشة */}
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.6)",
            "rgba(255, 255, 255, 0.4)",
            "rgba(255, 255, 255, 0.2)",
            "transparent",
          ]}
          style={{
            position: "absolute",
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: (size * 0.5) / 2,
            top: size * 0.12,
            left: size * 0.15,
          }}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 0.8, y: 0.8 }}
        />
      </Animated.View>
    </Animated.View>
  );
};

export function AnimatedBackground({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate full height including safe area insets
  const fullHeight = SCREEN_HEIGHT + insets.bottom + insets.top;

  // If children provided, use flex layout, otherwise use absolute positioning
  const containerStyle = children
    ? { flex: 1, position: "relative" as const, zIndex: 0 }
    : [
        styles.container,
        {
          height: fullHeight,
          width: SCREEN_WIDTH,
          bottom: -insets.bottom,
          paddingBottom: insets.bottom,
        },
      ];

  return (
    <View style={containerStyle}>
      {/* Base gradient background */}
      <LinearGradient
        colors={colors.backgroundGradient || ["#0A0E27", "#1A1F3A", "#2D1B4E"]}
        style={[
          StyleSheet.absoluteFill,
          {
            height: fullHeight,
            bottom: -insets.bottom,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Bubbles - فقاعات (تبدأ من خارج الشاشة من الأسفل) */}
      <Bubble
        size={80}
        initialX={SCREEN_WIDTH * 0.2}
        initialY={fullHeight + 80}
        duration={25000}
        delay={0}
        driftAmount={25}
      />
      <Bubble
        size={70}
        initialX={SCREEN_WIDTH * 0.5}
        initialY={fullHeight + 70}
        duration={30000}
        delay={5000}
        driftAmount={-20}
      />
      <Bubble
        size={90}
        initialX={SCREEN_WIDTH * 0.75}
        initialY={fullHeight + 90}
        duration={28000}
        delay={10000}
        driftAmount={30}
      />
      <Bubble
        size={60}
        initialX={SCREEN_WIDTH * 0.4}
        initialY={fullHeight + 60}
        duration={32000}
        delay={15000}
        driftAmount={-15}
      />

      {/* Render children if provided */}
      {children && (
        <View style={{ flex: 1, position: "relative", zIndex: 10 }}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 0,
    pointerEvents: "none",
  },
});
