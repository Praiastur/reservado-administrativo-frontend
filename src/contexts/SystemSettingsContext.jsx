import {
  createContext,
  useContext,
  useState,
} from "react";

import { useAudit } from "./AuditContext";
import { useAuth } from "./AuthContext";

const SETTINGS_STORAGE_KEY =
  "reservado_admin_system_settings_v1";

export const defaultSystemSettings = {
  systemName: "Reservado Administrativo",
  organizationName: "Praiastur / Reservado",
  supportEmail: "suporte@reservado.com.br",
  environmentLabel: "Desenvolvimento",
  showEnvironmentBadge: true,
  allowRememberSession: true,
};

const SystemSettingsContext = createContext(null);

function readStoredSettings() {
  try {
    const storedSettings = localStorage.getItem(
      SETTINGS_STORAGE_KEY,
    );

    if (!storedSettings) {
      return defaultSystemSettings;
    }

    const parsedSettings = JSON.parse(storedSettings);

    return {
      ...defaultSystemSettings,
      ...parsedSettings,
    };
  } catch {
    return defaultSystemSettings;
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getChangedSettings(previousSettings, nextSettings) {
  return Object.keys(nextSettings).filter(
    (key) => previousSettings[key] !== nextSettings[key],
  );
}

export function SystemSettingsProvider({ children }) {
  const { user } = useAuth();
  const { recordAudit } = useAudit();

  const [settings, setSettings] = useState(
    readStoredSettings,
  );

  const [isSavingSettings, setIsSavingSettings] =
    useState(false);

  async function saveSettings(nextSettings) {
    setIsSavingSettings(true);

    try {
      await wait(500);

      const sanitizedSettings = {
        systemName: nextSettings.systemName.trim(),
        organizationName: nextSettings.organizationName.trim(),
        supportEmail: nextSettings.supportEmail
          .trim()
          .toLowerCase(),
        environmentLabel: nextSettings.environmentLabel.trim(),
        showEnvironmentBadge: Boolean(
          nextSettings.showEnvironmentBadge,
        ),
        allowRememberSession: Boolean(
          nextSettings.allowRememberSession,
        ),
      };

      const changedSettings = getChangedSettings(
        settings,
        sanitizedSettings,
      );

      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(sanitizedSettings),
      );

      setSettings(sanitizedSettings);

      recordAudit({
        actor: {
          nome: user?.nome || "Usuário do sistema",
          email: user?.email || "Não informado",
        },
        acao: "CONFIGURACOES_ALTERADAS",
        acaoLabel: "Configurações alteradas",
        modulo: "Configurações",
        descricao:
          changedSettings.length > 0
            ? `${changedSettings.length} configurações administrativas foram atualizadas.`
            : "As configurações administrativas foram salvas sem alterações de valor.",
        nivel: "SUCESSO",
      });

      return sanitizedSettings;
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function restoreDefaultSettings() {
    setIsSavingSettings(true);

    try {
      await wait(400);

      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      setSettings(defaultSystemSettings);

      recordAudit({
        actor: {
          nome: user?.nome || "Usuário do sistema",
          email: user?.email || "Não informado",
        },
        acao: "CONFIGURACOES_RESTAURADAS",
        acaoLabel: "Configurações restauradas",
        modulo: "Configurações",
        descricao:
          "As configurações administrativas foram restauradas para os valores padrão.",
        nivel: "ATENCAO",
      });

      return defaultSystemSettings;
    } finally {
      setIsSavingSettings(false);
    }
  }

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        isSavingSettings,
        saveSettings,
        restoreDefaultSettings,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(
    SystemSettingsContext,
  );

  if (!context) {
    throw new Error(
      "useSystemSettings deve ser utilizado dentro de SystemSettingsProvider.",
    );
  }

  return context;
}
