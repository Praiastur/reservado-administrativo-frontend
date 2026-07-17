import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App";
import { AccessManagementProvider } from "./contexts/AccessManagementContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SystemSettingsProvider } from "./contexts/SystemSettingsContext";
import "./index.css";

createRoot(
  document.getElementById("root"),
).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SystemSettingsProvider>
          <AccessManagementProvider>
            <App />
          </AccessManagementProvider>
        </SystemSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);