'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { apiClient, AUTH_LOGOUT_EVENT } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  /** owner = dono da assinatura; member = usuário criado pelo dono. */
  role?: 'owner' | 'member';
  account_id?: string;
  /** Senha provisória ainda não trocada. Enquanto true, a API só aceita a troca. */
  must_change_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Falso para usuário de equipe: esconde cobrança, equipe e config da conta. */
  isOwner: boolean;
  mustChangePassword: boolean;
  /** Relê o usuário na API. Chamado depois da troca de senha para soltar o bloqueio. */
  refreshUser: () => Promise<void>;
  /** Devolve o usuário para a tela de login decidir o destino (painel ou troca de senha). */
  login: (email: string, password: string) => Promise<User>;
  signup: (
    email: string,
    password: string,
    password_confirmation: string,
    recruiterData: {
      name: string;
      company?: string;
      phone_number?: string;
      session_id?: string;
      turnstile_token?: string;
    }
  ) => Promise<{ requires_confirmation: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'hunter_access_token';
const REFRESH_TOKEN_KEY = 'hunter_refresh_token';
const USER_KEY = 'hunter_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          apiClient.setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token is still valid
          try {
            // A resposta manda no estado: o localStorage pode estar velho quanto a
            // papel e senha pendente, e é ele que decide se a pessoa é redirecionada
            // para a troca de senha.
            const fresh = await apiClient.getCurrentUser();
            setUser(fresh.user);
            localStorage.setItem(USER_KEY, JSON.stringify(fresh.user));
          } catch {
            // Token expired, try to refresh
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
              try {
                const data = await apiClient.refreshToken(refreshToken);
                localStorage.setItem(TOKEN_KEY, data.access_token);
                localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
                apiClient.setToken(data.access_token);
              } catch {
                // Refresh failed, logout
                logout();
              }
            } else {
              logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.login(email, password);

    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    apiClient.setToken(data.access_token);

    // Espelha o idioma da conta no cookie que o servidor lê. É o que faz a primeira
    // tela depois do login já sair renderizada na língua certa.
    const locale = (data as { locale?: string }).locale;
    if (locale === 'pt' || locale === 'en') {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    }

    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(
    async (
      email: string,
      password: string,
      password_confirmation: string,
      recruiterData: {
        name: string;
        company?: string;
        phone_number?: string;
        session_id?: string;
        turnstile_token?: string;
      }
    ) => {
      const data = await apiClient.signup(
        email,
        password,
        password_confirmation,
        recruiterData
      );

      if (!data.requires_confirmation && data.access_token) {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token!);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        apiClient.setToken(data.access_token);
        setUser(data.user);
      }

      return {
        requires_confirmation: data.requires_confirmation ?? false,
      };
    },
    []
  );

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await apiClient.getCurrentUser();
      setUser(fresh.user);
      localStorage.setItem(USER_KEY, JSON.stringify(fresh.user));
    } catch (error) {
      console.error('Falha ao recarregar o usuário:', error);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    apiClient.setToken(null);
    setUser(null);
  }, []);

  // Escuta evento quando o refresh token falha (ex: após 401 em requisição)
  useEffect(() => {
    const handleAuthLogout = () => logout();
    window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        // Sem papel definido (sessão antiga gravada antes desta feature) o padrão é
        // dono: é o que toda conta existente é, e evita esconder menu de quem paga.
        isOwner: user?.role !== 'member',
        mustChangePassword: user?.must_change_password === true,
        refreshUser,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
