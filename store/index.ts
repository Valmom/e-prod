import { configureStore } from '@reduxjs/toolkit';
import alertaReducer from "./alertaSlice";
import authReducer from './auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alerta: alertaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;