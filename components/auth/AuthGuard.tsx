import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { AuthNavigator } from './AuthNavigator';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  // Show auth screens if not authenticated
  if (!isAuthenticated && !isLoading) {
    return <AuthNavigator />;
  }

  // Show main app if authenticated
  return <>{children}</>;
};
