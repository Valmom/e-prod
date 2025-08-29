// components/AuthLoader.tsx
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { setLoading, setUser } from '../store/auth/authSlice';
import { useAppDispatch } from '../store/hooks';

export function AuthLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await SecureStore.getItemAsync('mipi-user-data');
        if (stored) {
          const userData = JSON.parse(stored);
          dispatch(setUser(userData));
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    loadUser();
  }, [dispatch]);

  return <>{children}</>;
}