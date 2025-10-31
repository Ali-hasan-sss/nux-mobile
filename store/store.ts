import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import balanceSlice from "./slices/balanceSlice";
import themeSlice from "./slices/themeSlice";
import languageSlice from "./slices/languageSlice";
import userSlice from "./slices/userSlice";
import restaurantSlice from "./slices/restaurantSlice";
import profileSlice from "./slices/profileSlice";
import notificationReducer from "./slices/notificationSlice";
import adsReducer from "./slices/adsSlice";
import restaurantQRReducer from "./slices/restaurantQRSlice";
import restaurantActivityReducer from "./slices/restaurantActivitySlice";
import restaurantInfoReducer from "./slices/restaurantInfoSlice";
import plansReducer from "./slices/plansSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    balance: balanceSlice.reducer,
    theme: themeSlice.reducer,
    language: languageSlice.reducer,
    user: userSlice.reducer,
    restaurant: restaurantSlice.reducer,
    profile: profileSlice.reducer,
    notifications: notificationReducer,
    ads: adsReducer,
    restaurantQR: restaurantQRReducer,
    restaurantActivity: restaurantActivityReducer,
    restaurantInfo: restaurantInfoReducer,
    plans: plansReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
