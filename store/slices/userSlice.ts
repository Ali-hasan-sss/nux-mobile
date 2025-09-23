import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  walletBalance: number;
  drinkPoints: number;
  mealPoints: number;
  phoneNumber: string;
  qrCode: string;
}

const initialState: UserState = {
  walletBalance: 150.75,
  drinkPoints: 25,
  mealPoints: 12,
  phoneNumber: '',
  qrCode: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateBalance: (state, action: PayloadAction<number>) => {
      state.walletBalance = action.payload;
    },
    updateDrinkPoints: (state, action: PayloadAction<number>) => {
      state.drinkPoints = action.payload;
    },
    updateMealPoints: (state, action: PayloadAction<number>) => {
      state.mealPoints = action.payload;
    },
    updatePhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    generateQRCode: (state, action: PayloadAction<string>) => {
      state.qrCode = action.payload;
    },
  },
});

export const { updateBalance, updateDrinkPoints, updateMealPoints, updatePhoneNumber, generateQRCode } = userSlice.actions;
export default userSlice;