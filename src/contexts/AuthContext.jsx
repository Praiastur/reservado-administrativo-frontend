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
  updateStoredAuthSession,
} from "../services/authStorage";
import { useAudit } from "./AuditContext";

const AuthContext = createContext(null);

function getSessionActor(session) {
  return {
    nome: session?.usuario?.nome || "Usuário não identificado",
    email: session?.usuario?.email || "Não informado",
  };
}

export function AuthProvider({ children }) {
  const { recordAudit } = useAudit();
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Resolve a sessão guardada uma única vez, ao carregar o app (F5, nova
  // aba, etc). Antes, isso era síncrono e simplesmente apagava a sessão
  // se o access token já tivesse expirado — mesmo com um refresh token
  // válido guardado, mesmo que a pessoa só tivesse dado F5 no meio do
  // uso. Agora, se o access token expirou mas existe um refresh token,
  // tenta renovar antes de desistir; só derruba a sessão de vez se essa
  // renovação também falhar.
  useEffect(() => {
    let cancelled = false;

    async function resolveInitialSession() {
      const storedSession = getStoredAuthSession();

      if (!storedSession) {
        if (!cancelled) setIsInitializing(false);
        return;
      }

      const isExpired =
        storedSession.expiresAt &&
        storedSession.expiresAt <= Date.now();

      if (!isExpired) {
        if (!cancelled) {
          setSession(storedSession);
          setIsInitializing(false);
        }
        return;
      }

      if (storedSession.refreshToken) {
        try {
          const sessaoRenovada = await authService.refresh(
            storedSession.refreshToken,
          );

          if (cancelled) return;

          const sessaoAtualizada = updateStoredAuthSession(
            sessaoRenovada,
          );

          setSession(sessaoAtualizada ?? sessaoRenovada);
          setIsInitializing(false);
          return;
        } catch {
          // Refresh token também inválido/expirado — segue pro logout
          // abaixo.
        }
      }

      if (cancelled) return;

      clearAuthSession();
      setSession(null);
      setIsInitializing(false);
    }

    resolveInitialSession();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    let cancelled = false;

    // Ao bater o prazo do access token, tenta renovar com o refresh
    // token ANTES de encerrar a sessão — só desloga de fato se a
    // renovação falhar (refresh token também expirado/revogado) ou se
    // essa sessão não tiver um refresh token (sessões antigas, ou modo
    // mock). Sem isso, esse timer sempre derrubava a sessão na hora
    // exata da expiração, mesmo com a renovação silenciosa funcionando.
    async function expirarOuRenovarSessao() {
      if (session.refreshToken) {
        try {
          const sessaoRenovada = await authService.refresh(
            session.refreshToken,
          );

          if (cancelled) return;

          const sessaoAtualizada = updateStoredAuthSession(
            sessaoRenovada,
          );

          setSession(sessaoAtualizada ?? sessaoRenovada);

          return;
        } catch {
          // Refresh token inválido/expirado/revogado — cai pro logout
          // abaixo.
        }
      }

      if (cancelled) return;

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
    }

    const remainingTime = session.expiresAt - Date.now();

    if (remainingTime <= 0) {
      expirarOuRenovarSessao();

      return () => {
        cancelled = true;
      };
    }

    const maximumTimeout = 2_147_483_647;

    const expirationTimer = window.setTimeout(() => {
      expirarOuRenovarSessao();
    }, Math.min(remainingTime, maximumTimeout));

    return () => {
      cancelled = true;
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
      isInitializing,
      isMockMode: session?.mode === "mock",
      login,
      logout,
      hasPermission,
    }),
    [session, isInitializing],
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
