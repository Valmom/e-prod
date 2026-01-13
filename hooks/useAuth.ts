// hooks/useAuth.ts
import { selectIsLoading, selectUser } from '../store/auth/authSelectors';
import { login as loginAction, logout as logoutAction } from '../store/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { UserData } from '../types/UserData';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectIsLoading);

  const login = async (userData: UserData) => {
    dispatch(loginAction(userData));
  };

  const logout = async () => {
    dispatch(logoutAction());
  };

  return {
    user,
    login,
    logout,
    isLoading,
  };
}