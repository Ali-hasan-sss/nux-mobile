import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export const AuthExample: React.FC = () => {
  const {
    user,
    restaurant,
    isLoggedIn,
    isLoading,
    logout,
    isRestaurantOwner,
    isUser,
  } = useAuth();

  const handleLogout = async () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>غير مسجل الدخول</Text>
        <Text style={styles.subtitle}>يرجى تسجيل الدخول للمتابعة</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          مرحباً {user?.fullName || user?.email}
        </Text>
        <Text style={styles.role}>
          {isRestaurantOwner ? '👨‍💼 صاحب مطعم' : '👤 مستخدم عادي'}
        </Text>
      </View>

      {/* User Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>معلومات الحساب:</Text>
        <Text style={styles.infoText}>📧 {user?.email}</Text>
        {user?.fullName && (
          <Text style={styles.infoText}>👤 {user.fullName}</Text>
        )}
        <Text style={styles.infoText}>🏷️ {user?.role}</Text>
      </View>

      {/* Restaurant Info (if applicable) */}
      {restaurant && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>معلومات المطعم:</Text>
          <Text style={styles.infoText}>🏪 {restaurant.name}</Text>
          <Text style={styles.infoText}>📍 {restaurant.address}</Text>
          <Text style={styles.infoText}>
            🟢 {restaurant.isActive ? 'نشط' : 'غير نشط'}
          </Text>
          <Text style={styles.infoText}>
            💳 {restaurant.isSubscriptionActive ? 'مشترك' : 'غير مشترك'}
          </Text>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoading}
      >
        <Text style={styles.logoutButtonText}>
          {isLoading ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  role: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    textAlign: 'right',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
