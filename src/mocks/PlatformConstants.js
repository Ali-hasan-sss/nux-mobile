// PlatformConstants polyfill for Expo Go compatibility
import { Platform } from 'react-native';

const PlatformConstants = {
  get: (key) => {
    if (Platform.OS === 'web') {
      return null;
    }
    return Platform.select({
      ios: () => {
        // iOS specific constants
        return null;
      },
      android: () => {
        // Android specific constants
        return null;
      },
      default: () => null,
    })();
  },
  getConstants: () => {
    if (Platform.OS === 'web') {
      return {};
    }
    return Platform.select({
      ios: () => ({}),
      android: () => ({}),
      default: () => ({}),
    })();
  },
};

export default PlatformConstants;
