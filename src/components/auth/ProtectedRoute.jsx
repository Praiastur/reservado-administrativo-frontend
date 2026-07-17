import { Navigate, Outlet } from "react-router";

export function ProtectedRoute() {
  const storedUser = sessionStorage.getItem("reservado_demo_user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}