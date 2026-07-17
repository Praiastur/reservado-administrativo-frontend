import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authService } from "../services/authService";
import {
  clearAuthSession,
  getStoredAuthSession,
  saveAuthSession,
} from "../services/authStorage";

const AuthContext = createContext(null);

function getValidStoredSession() {
  const storedSession = getStoredAuthSession();

  if (!storedSession) {
    return null;
  }

  if (
    storedSession.expiresAt &&
    storedSession.expiresAt <= Date.now()
  ) {
    clearAuthSession();

    return null;
  }

  return storedSession;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(
    getValidStoredSession,
  );

  useEffect(() => {
    function handleUnauthorized() {
      setSession(null);
    }

    window.addEventListener(
      "reservado:unauthorized",
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        "reservado:unauthorized",
        handleUnauthorized,
      );
    };
  }, []);

  useEffect(() => {
    if (!session?.expiresAt) {
      return undefined;
    }

    const remainingTime =
      session.expiresAt - Date.now();

    if (remainingTime <= 0) {
      clearAuthSession();
      setSession(null);

      return undefined;
    }

    const maximumTimeout = 2_147_483_647;

    const expirationTimer = window.setTimeout(() => {
      clearAuthSession();
      setSession(null);
    }, Math.min(remainingTime, maximumTimeout));

    return () => {
      window.clearTimeout(expirationTimer);
    };
  }, [session]);

  async function login({
    email,
    senha,
    remember = false,
  }) {
    const loginSession = await authService.login({
      email,
      senha,
    });

    saveAuthSession(loginSession, remember);
    setSession(loginSession);

    return loginSession;
  }

  function logout() {
    clearAuthSession();
    setSession(null);
  }

  function hasPermission(permission) {
    if (!permission) {
      return true;
    }

    return session?.permissions?.includes(permission) === true;
  }

  const contextValue = useMemo(
    () => ({
      session,
      user: session?.usuario ?? null,
      permissions: session?.permissions ?? [],
      isAuthenticated: Boolean(session?.usuario),
      isMockMode: session?.mode === "mock",
      login,
      logout,
      hasPermission,
    }),
    [session],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro de AuthProvider.",
    );
  }

  return context;
}