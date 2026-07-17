import { Navigate, Route, Routes } from "react-router";
import { Settings } from "lucide-react"; "lucide-react";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { ComingSoonPage } from "./pages/ComingSoon/ComingSoonPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { ProfilesPage } from "./pages/Profiles/ProfilesPage";
import { UsersPage } from "./pages/Users/UsersPage";
import { PermissionRoute } from "./components/auth/PermissionRoute";
import { AccessDeniedPage } from "./pages/AccessDenied/AccessDeniedPage";
import { AuditPage } from "./pages/Audit/AuditPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/acesso-negado"
            element={<AccessDeniedPage />}
          />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route
            path="/usuarios"
            element={
              <PermissionRoute permission="USUARIOS_VISUALIZAR">
                <UsersPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/perfis"
            element={
              <PermissionRoute permission="PERFIS_VISUALIZAR">
                <ProfilesPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/auditoria"
            element={
              <PermissionRoute permission="AUDITORIA_VISUALIZAR">
                <AuditPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <PermissionRoute permission="CONFIGURACOES_EDITAR">
                <ComingSoonPage
                  title="Configurações"
                  description="Esta área concentrará as preferências e configurações gerais do Reservado Administrativo."
                  icon={Settings}
                />
              </PermissionRoute>
            }
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;