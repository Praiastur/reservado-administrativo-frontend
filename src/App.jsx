import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import { PermissionRoute } from "./components/auth/PermissionRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { AccessDeniedPage } from "./pages/AccessDenied/AccessDeniedPage";
import { AnnualityDetailsPage } from "./pages/Annualities/AnnualityDetailsPage";
import { AnnualitiesPage } from "./pages/Annualities/AnnualitiesPage";
import { ClientDetailsPage } from "./pages/Clients/ClientDetailsPage";
import { ClientsPage } from "./pages/Clients/ClientsPage";
import { ContractsPage } from "./pages/Contracts/ContractsPage";
import { ContractDetailsPage } from "./pages/Contracts/ContractDetailsPage";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { ProfilesPage } from "./pages/Profiles/ProfilesPage";
import { ReceivableDetailsPage } from "./pages/Receivables/ReceivableDetailsPage";
import { ReceivablesPage } from "./pages/Receivables/ReceivablesPage";
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

          <Route
            path="/contratos"
            element={
              <PermissionRoute permission="CONTRATOS_VISUALIZAR">
                <ContractsPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/contratos/:contractId"
            element={
              <PermissionRoute permission="CONTRATOS_VISUALIZAR">
                <ContractDetailsPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/anuidades"
            element={
              <PermissionRoute permission="ANUIDADES_VISUALIZAR">
                <AnnualitiesPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/anuidades/:annualityId"
            element={
              <PermissionRoute permission="ANUIDADES_VISUALIZAR">
                <AnnualityDetailsPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/contas-receber"
            element={
              <PermissionRoute permission="CONTAS_A_RECEBER_VISUALIZAR">
                <ReceivablesPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/contas-receber/:receivableId"
            element={
              <PermissionRoute permission="CONTAS_A_RECEBER_VISUALIZAR">
                <ReceivableDetailsPage />
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
