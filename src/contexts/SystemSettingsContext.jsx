import {
  createContext,
  useContext,
  useState,
} from "react";

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

export function SystemSettingsProvider({ children }) {
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
        systemName:
          nextSettings.systemName.trim(),
        organizationName:
          nextSettings.organizationName.trim(),
        supportEmail:
          nextSettings.supportEmail
            .trim()
            .toLowerCase(),
        environmentLabel:
          nextSettings.environmentLabel.trim(),
        showEnvironmentBadge: Boolean(
          nextSettings.showEnvironmentBadge,
        ),
        allowRememberSession: Boolean(
          nextSettings.allowRememberSession,
        ),
      };

      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(sanitizedSettings),
      );

      setSettings(sanitizedSettings);

      return sanitizedSettings;
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function restoreDefaultSettings() {
    setIsSavingSettings(true);

    try {
      await wait(400);

      localStorage.removeItem(
        SETTINGS_STORAGE_KEY,
      );

      setSettings(defaultSystemSettings);

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