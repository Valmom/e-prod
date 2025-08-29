// store/auth/authSelectors.ts
import { RootState } from '../index';

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;