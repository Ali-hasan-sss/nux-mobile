import React from 'react';
import { View, Text } from 'react-native';

// Mock MapView component for web platform
export const MapView = ({ children, style, ...props }) => {
  return (
    <View style={[{ backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text style={{ color: '#666', fontSize: 16 }}>Map View (Web)</Text>
      {children}
    </View>
  );
};

// Mock Marker component
export const Marker = ({ children, ...props }) => {
  return (
    <View style={{ position: 'absolute', top: '50%', left: '50%' }}>
      <Text style={{ color: '#333', fontSize: 12 }}>📍</Text>
      {children}
    </View>
  );
};

// Default export
export default MapView;