import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import balanceSlice from "./slices/balanceSlice";
import themeSlice from "./slices/themeSlice";
import languageSlice from "./slices/languageSlice";
import userSlice from "./slices/userSlice";
import restaurantSlice from "./slices/restaurantSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    balance: balanceSlice.reducer,
    theme: themeSlice.reducer,
    language: languageSlice.reducer,
    user: userSlice.reducer,
    restaurant: restaurantSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
