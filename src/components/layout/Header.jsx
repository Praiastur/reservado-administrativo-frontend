import {
  ChevronDown,
  LogOut,
  Menu,
  Server,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useAuth } from "../../contexts/AuthContext";
import { useSystemSettings } from "../../contexts/SystemSettingsContext";

const pageInformation = {
  "/dashboard": {
    eyebrow: "Visão geral",
    title: "Dashboard",
  },
  "/usuarios": {
    eyebrow: "Administração",
    title: "Usuários",
  },
  "/perfis": {
    eyebrow: "Administração",
    title: "Perfis e permissões",
  },
  "/clientes": {
    eyebrow: "Operação",
    title: "Clientes",
  },
  "/contratos": {
    eyebrow: "Financeiro",
    title: "Contratos",
  },
  "/anuidades": {
    eyebrow: "Financeiro",
    title: "Anuidades",
  },
  "/contas-receber": {
    eyebrow: "Financeiro",
    title: "Contas a receber",
  },
  "/acesso-negado": {
    eyebrow: "Segurança",
    title: "Acesso negado",
  },
};

function getInitials(name) {
  if (!name) {
    return "US";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useSystemSettings();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const page =
    pageInformation[location.pathname] ??
    (location.pathname.startsWith("/contas-receber/")
      ? {
          eyebrow: "Financeiro",
          title: "Detalhes da conta a receber",
        }
      : location.pathname.startsWith("/anuidades/")
      ? {
          eyebrow: "Financeiro",
          title: "Detalhes da anuidade",
        }
      : location.pathname.startsWith("/contratos/")
      ? {
          eyebrow: "Financeiro",
          title: "Detalhes do contrato",
        }
      : location.pathname.startsWith("/clientes/")
      ? {
          eyebrow: "Operação",
          title: "Detalhes do cliente",
        }
      : {
          eyebrow: settings.organizationName || "Reservado",
          title: settings.systemName || "Administrativo",
        });

  const userName = user?.nome || "Usuário";
  const userEmail = user?.email || "usuario@reservado.com.br";

  const environmentLabel =
    settings.environmentLabel?.trim() || "Ambiente";

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#e8e2eb] bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-[86px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e4dde7] bg-white text-[#432059] transition hover:border-[#cdbfd3] hover:bg-[#f8f4fa] lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8d8292]">
                {page.eyebrow}
              </p>

              {settings.showEnvironmentBadge && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cddd] bg-[#f6f1f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#653475]">
                  <Server size={12} />
                  {environmentLabel}
                </span>
              )}
            </div>

            <h1 className="mt-1 truncate text-xl font-bold tracking-[-0.025em] text-[#2a222d] sm:text-2xl">
              {page.title}
            </h1>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setUserMenuOpen((current) => !current)
            }
            className="flex items-center gap-3 rounded-2xl border border-transparent p-1.5 pr-2 transition hover:border-[#e4dde7] hover:bg-[#faf8fb]"
            aria-expanded={userMenuOpen}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#432059] text-sm font-bold text-white shadow-[0_8px_20px_rgba(67,32,89,0.22)]">
              {getInitials(userName)}
            </div>

            <div className="hidden max-w-[190px] text-left sm:block">
              <p className="truncate text-sm font-bold text-[#342b37]">
                {userName}
              </p>

              <p className="mt-0.5 truncate text-xs text-[#8a808e]">
                {userEmail}
              </p>
            </div>

            <ChevronDown
              size={17}
              className={[
                "hidden text-[#8a808e] transition-transform sm:block",
                userMenuOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-72 overflow-hidden rounded-2xl border border-[#e5dfe8] bg-white shadow-[0_20px_60px_rgba(41,25,48,0.16)]">
              <div className="border-b border-[#eee9f0] px-5 py-4">
                <p className="text-sm font-bold text-[#342b37]">
                  {userName}
                </p>

                <p className="mt-1 truncate text-xs text-[#8a808e]">
                  {userEmail}
                </p>

                {settings.showEnvironmentBadge && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#f6f1f8] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#653475]">
                    <Server size={12} />
                    {environmentLabel}
                  </p>
                )}
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Sair do sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
