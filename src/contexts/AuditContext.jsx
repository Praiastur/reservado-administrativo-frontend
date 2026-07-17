import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { initialAuditLogs } from "../data/auditLogs";

const AUDIT_STORAGE_KEY = "reservado_admin_audit_logs_v2";
const MAX_AUDIT_LOGS = 500;

const AuditContext = createContext(null);

function normalizeAuditLog(log = {}) {
  return {
    id: log.id ?? Date.now(),
    dataHora: log.dataHora ?? new Date().toISOString(),
    usuarioNome: log.usuarioNome || "Usuário não identificado",
    usuarioEmail: log.usuarioEmail || "Não informado",
    acao: log.acao || "ACAO_NAO_INFORMADA",
    acaoLabel: log.acaoLabel || "Ação não informada",
    modulo: log.modulo || "Sistema",
    descricao: log.descricao || "Nenhuma descrição informada.",
    nivel: log.nivel || "INFORMACAO",
    ip: log.ip || "Não informado",
    origem: log.origem || "FRONTEND_LOCAL",
  };
}

function readStoredLogs() {
  try {
    const storedLogs = localStorage.getItem(AUDIT_STORAGE_KEY);

    if (!storedLogs) {
      return initialAuditLogs.map(normalizeAuditLog);
    }

    const parsedLogs = JSON.parse(storedLogs);

    return Array.isArray(parsedLogs)
      ? parsedLogs.map(normalizeAuditLog)
      : initialAuditLogs.map(normalizeAuditLog);
  } catch {
    return initialAuditLogs.map(normalizeAuditLog);
  }
}

let auditSequence = 0;

function createAuditId() {
  auditSequence = (auditSequence + 1) % 1000;

  return Date.now() * 1000 + auditSequence;
}

export function AuditProvider({ children }) {
  const [logs, setLogs] = useState(readStoredLogs);

  useEffect(() => {
    localStorage.setItem(
      AUDIT_STORAGE_KEY,
      JSON.stringify(logs.slice(0, MAX_AUDIT_LOGS)),
    );
  }, [logs]);

  const recordAudit = useCallback((event = {}) => {
    const actor = event.actor ?? {};

    const newLog = normalizeAuditLog({
      id: createAuditId(),
      dataHora: new Date().toISOString(),
      usuarioNome:
        actor.nome || event.usuarioNome || "Usuário não identificado",
      usuarioEmail:
        actor.email || event.usuarioEmail || "Não informado",
      acao: event.acao,
      acaoLabel: event.acaoLabel,
      modulo: event.modulo,
      descricao: event.descricao,
      nivel: event.nivel,
      ip: event.ip || "Não informado",
      origem: event.origem || "FRONTEND_LOCAL",
    });

    setLogs((currentLogs) =>
      [newLog, ...currentLogs].slice(0, MAX_AUDIT_LOGS),
    );

    return newLog;
  }, []);

  const restoreInitialLogs = useCallback(() => {
    const restoredLogs = initialAuditLogs.map(normalizeAuditLog);

    setLogs(restoredLogs);

    return restoredLogs;
  }, []);

  const contextValue = useMemo(
    () => ({
      logs,
      recordAudit,
      restoreInitialLogs,
      isLocalAudit: true,
    }),
    [logs, recordAudit, restoreInitialLogs],
  );

  return (
    <AuditContext.Provider value={contextValue}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const context = useContext(AuditContext);

  if (!context) {
    throw new Error(
      "useAudit deve ser utilizado dentro de AuditProvider.",
    );
  }

  return context;
}
