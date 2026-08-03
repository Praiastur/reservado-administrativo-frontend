import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import { PermissionRoute } from "./components/auth/PermissionRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { AccessDeniedPage } from "./pages/AccessDenied/AccessDeniedPage";
import { ClientDetailsPage } from "./pages/Clients/ClientDetailsPage";
import { ClientsPage } from "./pages/Clients/ClientsPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { ProfilesPage } from "./pages/Profiles/ProfilesPage";
import { UsersPage } from "./pages/Users/UsersPage";

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
            path="/clientes"
            element={
              <PermissionRoute permission="CLIENTES_VISUALIZAR">
                <ClientsPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/clientes/:clientId"
            element={
              <PermissionRoute permission="CLIENTES_VISUALIZAR">
                <ClientDetailsPage />
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
