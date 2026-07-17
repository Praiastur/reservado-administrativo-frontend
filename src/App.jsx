import { Navigate, Route, Routes } from "react-router";
import {
  ScrollText,
  Settings,
} from "lucide-react";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { ComingSoonPage } from "./pages/ComingSoon/ComingSoonPage";
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
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/usuarios" element={<UsersPage />} />

          <Route path="/perfis" element={<ProfilesPage />} />

          <Route
            path="/auditoria"
            element={
              <ComingSoonPage
                title="Auditoria do sistema"
                description="Esta página exibirá as principais ações realizadas pelos usuários dentro do ambiente administrativo."
                icon={ScrollText}
              />
            }
          />

          <Route
            path="/configuracoes"
            element={
              <ComingSoonPage
                title="Configurações"
                description="Esta área concentrará as preferências e configurações gerais do Reservado Administrativo."
                icon={Settings}
              />
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