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
import { useAudit } from "./AuditContext";

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

function getSessionActor(session) {
  return {
    nome: session?.usuario?.nome || "Usuário não identificado",
    email: session?.usuario?.email || "Não informado",
  };
}

export function AuthProvider({ children }) {
  const { recordAudit } = useAudit();
  const [session, setSession] = useState(
    getValidStoredSession,
  );

  useEffect(() => {
    function handleUnauthorized() {
      if (session?.usuario) {
        recordAudit({
          actor: getSessionActor(session),
          acao: "SESSAO_ENCERRADA",
          acaoLabel: "Sessão encerrada",
          modulo: "Autenticação",
          descricao:
            "A sessão foi encerrada porque a autorização deixou de ser válida.",
          nivel: "ATENCAO",
        });
      }

      clearAuthSession();
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
  }, [recordAudit, session]);

  useEffect(() => {
    function handleSessionRefreshed(event) {
      if (event.detail) {
        setSession(event.detail);
      }
    }

    window.addEventListener(
      "reservado:session-refreshed",
      handleSessionRefreshed,
    );

    return () => {
      window.removeEventListener(
        "reservado:session-refreshed",
        handleSessionRefreshed,
      );
    };
  }, []);

  useEffect(() => {
    if (!session?.expiresAt) {
      return undefined;
    }

    const remainingTime = session.expiresAt - Date.now();

    if (remainingTime <= 0) {
      recordAudit({
        actor: getSessionActor(session),
        acao: "SESSAO_EXPIRADA",
        acaoLabel: "Sessão expirada",
        modulo: "Autenticação",
        descricao:
          "A sessão do usuário expirou e foi encerrada automaticamente.",
        nivel: "ATENCAO",
      });

      clearAuthSession();
      setSession(null);

      return undefined;
    }

    const maximumTimeout = 2_147_483_647;

    const expirationTimer = window.setTimeout(() => {
      recordAudit({
        actor: getSessionActor(session),
        acao: "SESSAO_EXPIRADA",
        acaoLabel: "Sessão expirada",
        modulo: "Autenticação",
        descricao:
          "A sessão do usuário expirou e foi encerrada automaticamente.",
        nivel: "ATENCAO",
      });

      clearAuthSession();
      setSession(null);
    }, Math.min(remainingTime, maximumTimeout));

    return () => {
      window.clearTimeout(expirationTimer);
    };
  }, [recordAudit, session]);

  async function login({
    email,
    senha,
    remember = false,
  }) {
    try {
      const loginSession = await authService.login({
        email,
        senha,
      });

      saveAuthSession(loginSession, remember);
      setSession(loginSession);

      recordAudit({
        actor: getSessionActor(loginSession),
        acao: "LOGIN_SUCESSO",
        acaoLabel: "Login realizado",
        modulo: "Autenticação",
        descricao:
          "O usuário entrou no Reservado Administrativo.",
        nivel: "INFORMACAO",
      });

      return loginSession;
    } catch (error) {
      recordAudit({
        actor: {
          nome: "Usuário não identificado",
          email: email.trim().toLowerCase() || "Não informado",
        },
        acao: "LOGIN_FALHA",
        acaoLabel: "Falha no login",
        modulo: "Autenticação",
        descricao:
          "Foi realizada uma tentativa de login sem sucesso.",
        nivel: "ATENCAO",
      });

      throw error;
    }
  }

  function logout() {
    if (session?.usuario) {
      recordAudit({
        actor: getSessionActor(session),
        acao: "LOGOUT_REALIZADO",
        acaoLabel: "Logout realizado",
        modulo: "Autenticação",
        descricao:
          "O usuário saiu do Reservado Administrativo.",
        nivel: "INFORMACAO",
      });
    }

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
