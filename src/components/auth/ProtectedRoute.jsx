import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet } from "react-router";

import { useAuth } from "../../contexts/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  // Enquanto a sessão guardada ainda está sendo conferida (e, se
  // necessário, renovada) não decide nada ainda — sem isso, um F5 com o
  // token expirado mas com refresh token válido mandaria a pessoa pro
  // login por um instante antes da renovação terminar.
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8fb]">
        <LoaderCircle
          size={28}
          className="animate-spin text-[#432059]"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
