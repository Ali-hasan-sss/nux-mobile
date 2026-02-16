import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity } from "react-native";
import { Text } from "@/components/AppText";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  onHide: () => void;
}

const { width } = Dimensions.get("window");

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  duration = 3000,
  onHide,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          gradient: [colors.success, "#10B981"],
          iconColor: "#FFFFFF",
        };
      case "error":
        return {
          icon: XCircle,
          gradient: [colors.error, "#EF4444"],
          iconColor: "#FFFFFF",
        };
      case "warning":
        return {
          icon: AlertCircle,
          gradient: [colors.warning, "#F59E0B"],
          iconColor: "#FFFFFF",
        };
      case "info":
        return {
          icon: Info,
          gradient: [colors.info, "#3B82F6"],
          iconColor: "#FFFFFF",
        };
      default:
        return {
          icon: Info,
          gradient: ["#6B7280", "#4B5563"],
          iconColor: "#FFFFFF",
        };
    }
  };

  const config = getToastConfig();
  const IconComponent = config.icon;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          top: Math.max(insets.top + 10, 50),
        },
      ]}
    >
      <LinearGradient
        colors={config.gradient}
        style={styles.toast}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <IconComponent size={20} color={config.iconColor} />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 12,
  },
  closeButton: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
