import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";

type Props = {
  targetX: number;
  targetY: number;
  color: string;
  count?: number;
  onDone?: () => void;
};

export function LoyaltyPointsBurst({
  targetX,
  targetY,
  color,
  count = 8,
  onDone,
}: Props) {
  const { width, height } = Dimensions.get("window");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        startX: width * (0.18 + (i / Math.max(count - 1, 1)) * 0.64),
        startY: Math.max(80, height * 0.12) + (i % 3) * 28,
        progress: new Animated.Value(0),
        spin: new Animated.Value(0),
      })),
    [count, height, width],
  );

  useEffect(() => {
    const animations = stars.map((star, index) =>
      Animated.parallel([
        Animated.timing(star.progress, {
          toValue: 1,
          duration: 720,
          delay: index * 45,
          useNativeDriver: true,
        }),
        Animated.timing(star.spin, {
          toValue: 1,
          duration: 720,
          delay: index * 45,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(40, animations).start(({ finished }) => {
      if (finished) onDoneRef.current?.();
    });
  }, [stars]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((star) => {
        const translateX = star.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [star.startX - 10, targetX - 10],
        });
        const translateY = star.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [star.startY - 10, targetY - 10],
        });
        const scale = star.progress.interpolate({
          inputRange: [0, 0.2, 0.75, 1],
          outputRange: [0.35, 1.2, 1, 0.25],
        });
        const opacity = star.progress.interpolate({
          inputRange: [0, 0.12, 0.82, 1],
          outputRange: [0, 1, 1, 0],
        });
        const rotate = star.spin.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "220deg"],
        });
        return (
          <Animated.View
            key={star.id}
            style={[
              styles.star,
              {
                opacity,
                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
              },
            ]}
          >
            <Star size={20} color={color} fill={color} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
