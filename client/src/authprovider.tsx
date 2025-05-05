import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, loginUser, logoutUser } from "@/lib/api";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { throw new Error("Not implemented"); },
  logout: async () => {},
  loading: true,
  error: null
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the current user on mount
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Auth error:", err);
        setError(err instanceof Error ? err.message : "Authentication error");
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const user = await loginUser(username, password);
      setUser(user);
      setError(null);
      return user;
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
