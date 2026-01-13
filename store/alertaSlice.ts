import { Alerta } from "@/models/Alerta";
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AlertaState {
  alertaSelecionado: Alerta | null;
}

const initialState: AlertaState = {
  alertaSelecionado: null,
};

const alertaSlice = createSlice({
  name: 'alerta',
  initialState,
  reducers: {
    setAlerta: (state, action: PayloadAction<Alerta>) => {
      state.alertaSelecionado = action.payload;
    },
    clearAlerta: (state) => {
      state.alertaSelecionado = null;
    },
  },
});

export const { setAlerta, clearAlerta } = alertaSlice.actions;
export default alertaSlice.reducer;