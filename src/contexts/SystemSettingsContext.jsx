import {
  createContext,
  useContext,
} from "react";

export const defaultSystemSettings = Object.freeze({
  systemName: "RESERVADO",
  organizationName: "Grupo Praiastur",
  supportEmail: "tecnoinfo@praiastur.com.br",
  environmentLabel: "Administração",
  showEnvironmentBadge: true,
  allowRememberSession: true,
});

const SystemSettingsContext = createContext(null);

export function SystemSettingsProvider({ children }) {
  return (
    <SystemSettingsContext.Provider
      value={{ settings: defaultSystemSettings }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);

  if (!context) {
    throw new Error(
      "useSystemSettings deve ser utilizado dentro de SystemSettingsProvider.",
    );
  }

  return context;
}
