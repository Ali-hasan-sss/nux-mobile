// Theme colors with animated background support
// Dark theme: gradient background with animated bubbles
// Light theme: light background (white/gray) with same animated bubbles
export const Colors = {
  light: {
    primary: "#00D9FF", // Bright cyan/blue
    secondary: "#FF6B9D", // Pink
    accent: "#A855F7", // Purple
    background: "#F2EAD8", // Warm beige background (brand identity in light mode)
    // Light gradient background: warm beige tones
    backgroundGradient: ["#FBF6EA", "#F4ECDA", "#EFE5CF", "#E8DBC2"] as const,
    surface: "rgba(251, 246, 234, 0.9)", // Semi-transparent cream surface
    surfaceSolid: "#FBF7EE", // Solid cream surface (slightly lighter than background so cards pop)
    text: "#1A1A1A", // Dark text for light background
    textSecondary: "rgba(26, 26, 26, 0.7)", // Semi-transparent dark for secondary text
    border: "rgba(0, 0, 0, 0.1)", // Subtle border for visibility
    success: "#34D399", // Green
    error: "#F87171", // Red
    warning: "#FBBF24", // Yellow
    info: "#60A5FA", // Blue
    // Vibrant gradients for buttons and accents (same as dark for consistency)
    gradient: ["#FF6B9D", "#A855F7", "#00D9FF"] as const, // Pink to purple to cyan
    gradientAccent: ["#FF6B9D", "#A855F7", "#00D9FF"] as const, // Pink to purple to cyan
    gradientButton: ["#00D9FF", "#A855F7"] as const, // Cyan to purple for buttons
    buttonGradient: ["#00D9FF", "#A855F7"] as const, // Cyan to purple for buttons
    buttonGradientSecondary: ["#FF6B9D", "#A855F7"] as const, // Pink to purple
    inputBackground: "#F2EAD8", // Same as background: no white box inside inputs in light mode
  },
  dark: {
    primary: "#00D9FF", // Bright cyan/blue
    secondary: "#FF6B9D", // Pink
    accent: "#A855F7", // Purple
    background: "#0A0E27", // Dark blue base
    // Animated gradient background: magenta/purple to deep blue (like image)
    backgroundGradient: ["#1A0B2E", "#2D1B4E", "#16213E", "#0A0E27"] as const,
    surface: "rgba(26, 31, 58, 0.85)", // Semi-transparent dark surface with blur effect
    surfaceSolid: "#1A1F3A", // Solid dark surface
    text: "#FFFFFF", // White text for dark background (ensures readability)
    textSecondary: "rgba(255, 255, 255, 0.75)", // Semi-transparent white for secondary text
    border: "rgba(255, 255, 255, 0.15)", // Subtle border for visibility
    success: "#34D399", // Green
    error: "#F87171", // Red
    warning: "#FBBF24", // Yellow
    info: "#60A5FA", // Blue
    // Vibrant gradients for buttons and accents
    gradient: ["#FF6B9D", "#A855F7", "#00D9FF"] as const, // Pink to purple to cyan
    gradientAccent: ["#FF6B9D", "#A855F7", "#00D9FF"] as const, // Pink to purple to cyan
    gradientButton: ["#00D9FF", "#A855F7"] as const, // Cyan to purple for buttons
    buttonGradient: ["#00D9FF", "#A855F7"] as const, // Cyan to purple for buttons
    buttonGradientSecondary: ["#FF6B9D", "#A855F7"] as const, // Pink to purple
    inputBackground: "rgba(26, 31, 58, 0.95)", // Dark input/card in dark mode
  },
};
