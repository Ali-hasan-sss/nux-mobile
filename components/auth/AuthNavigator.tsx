import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';

export const AuthNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register'>(
    'login'
  );

  if (currentScreen === 'register') {
    return (
      <RegisterScreen onNavigateToLogin={() => setCurrentScreen('login')} />
    );
  }

  return (
    <LoginScreen onNavigateToRegister={() => setCurrentScreen('register')} />
  );
};
