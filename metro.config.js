const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver alias for web platform
config.resolver.alias = {
  ...config.resolver.alias,
};

config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure platform-specific extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.js',
  'web.ts',
  'web.tsx',
];

// Add platform-specific resolver for react-native-maps
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Platform-specific module resolution
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: require.resolve('./src/mocks/react-native-maps.web.js'),
      type: 'sourceFile',
    };
  }

  // Fix PlatformConstants error in Expo Go
  if (moduleName === 'PlatformConstants') {
    return {
      filePath: require.resolve('./src/mocks/PlatformConstants.js'),
      type: 'sourceFile',
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
