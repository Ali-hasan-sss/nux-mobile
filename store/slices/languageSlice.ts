import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageState {
  currentLanguage: string;
}

const initialState: LanguageState = {
  currentLanguage: 'en',
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.currentLanguage = action.payload;
      // Save to AsyncStorage for persistence
      AsyncStorage.setItem('user-language', action.payload).catch((error) => {
        console.error('Error saving language:', error);
      });
    },
    initializeLanguage: (state, action: PayloadAction<string>) => {
      state.currentLanguage = action.payload;
    },
  },
});

export const { setLanguage, initializeLanguage } = languageSlice.actions;
export default languageSlice;