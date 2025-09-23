import { useSelector } from 'react-redux';
import { useColorScheme } from 'react-native';
import { RootState } from '@/store/store';
import { Colors } from '@/constants/Colors';

export const useTheme = () => {
  const { mode } = useSelector((state: RootState) => state.theme);
  const systemColorScheme = useColorScheme();

  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? systemColorScheme ?? 'light' : mode;

  return {
    colors: Colors[resolvedMode],
    isDark: resolvedMode === 'dark',
    mode,
  };
};
