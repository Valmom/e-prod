// store/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { UserData } from '../../types/UserData';

interface AuthState {
  user: UserData | null;
  isLoading: boolean;
}

const STORAGE_KEY = 'mipi-user-data';

const initialState: AuthState = {
  user: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserData | null>) => {
      state.user = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    login: (state, action: PayloadAction<UserData>) => {
      state.user = action.payload;
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      SecureStore.deleteItemAsync(STORAGE_KEY);
    },
  },
});

export const { setUser, setLoading, login, logout } = authSlice.actions;
export default authSlice.reducer;