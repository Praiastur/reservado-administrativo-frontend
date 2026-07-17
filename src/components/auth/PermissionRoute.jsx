import {
  Navigate,
  useLocation,
} from "react-router";

import { useAuth } from "../../contexts/AuthContext";

export function PermissionRoute({
  permission,
  children,
}) {
  const location = useLocation();
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <Navigate
        to="/acesso-negado"
        replace
        state={{
          previousPath: location.pathname,
        }}
      />
    );
  }

  return children;
}