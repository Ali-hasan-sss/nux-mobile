export const Colors = {
  light: {
    primary: "#00D9FF", // Cyan - glowing buttons
    secondary: "#FB923C",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    gradient: ["#8B5CF6", "#FB923C"] as const,
    gradientAccent: ["#8B5CF6", "#FB923C"] as const,
    gradientButton: ["#00D9FF", "#00B8E6"] as const,
  },
  dark: {
    primary: "#00D9FF", // Cyan - glowing buttons and accents
    secondary: "#FF6B9D", // Pink accent
    background: "#0A0E27", // Dark blue-purple base
    surface: "#1A1F3A", // Dark blue-purple surface
    text: "#FFFFFF",
    textSecondary: "#B8BCC8",
    border: "#2A2F4A",
    success: "#00FFA3", // Cyan-green
    error: "#FF6B6B",
    warning: "#FFD93D",
    info: "#00D9FF",
    gradient: ["#1A1F3A", "#2D1B4E"] as const, // Dark blue to purple
    gradientAccent: ["#FF6B9D", "#C471ED", "#00D9FF"] as const, // Pink to purple to cyan
    gradientButton: ["#00D9FF", "#00B8E6"] as const, // Cyan gradient for buttons
  },
};
