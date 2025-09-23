import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  size?: number;
}

export function Checkbox({ checked, onPress, size = 20 }: CheckboxProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.checkbox,
        {
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : 'transparent',
          width: size,
          height: size,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {checked && (
        <Check size={size * 0.7} color="white" strokeWidth={3} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});