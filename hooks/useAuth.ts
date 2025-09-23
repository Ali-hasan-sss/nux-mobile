import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  loginUser,
  loginAdmin,
  registerUser,
  registerRestaurant,
  logout,
  clearError,
  initializeAuth,
} from '../store/slices/authSlice';
import {
  LoginRequest,
  RegisterUserRequest,
  RegisterRestaurantRequest,
} from '../store/types/authTypes';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);

  return {
    // State
    ...authState,

    // Actions
    login: (credentials: LoginRequest) => dispatch(loginUser(credentials)),
    adminLogin: (credentials: LoginRequest) =>
      dispatch(loginAdmin(credentials)),
    register: (userData: RegisterUserRequest) =>
      dispatch(registerUser(userData)),
    registerRestaurant: (restaurantData: RegisterRestaurantRequest) =>
      dispatch(registerRestaurant(restaurantData)),
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
    initialize: () => dispatch(initializeAuth()),

    // Computed properties
    isLoggedIn: authState.isAuthenticated && !!authState.user,
    isRestaurantOwner: authState.user?.role === 'RESTAURANT_OWNER',
    isAdmin: authState.user?.role === 'ADMIN',
    isUser: authState.user?.role === 'USER',
  };
};
