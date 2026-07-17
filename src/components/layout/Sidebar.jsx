import {
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

const navigationGroups = [
  {
    label: "Principal",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        end: true,
        permission: null,
      },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        label: "Usuários",
        path: "/usuarios",
        icon: Users,
        permission: "USUARIOS_VISUALIZAR",
      },
      {
        label: "Perfis e permissões",
        path: "/perfis",
        icon: ShieldCheck,
        permission: "PERFIS_VISUALIZAR",
      },
    ],
  },
  {
    label: "Controle",
    items: [
      {
        label: "Auditoria",
        path: "/auditoria",
        icon: ScrollText,
        permission: "AUDITORIA_VISUALIZAR",
      },
      {
        label: "Configurações",
        path: "/configuracoes",
        icon: Settings,
        permission: "CONFIGURACOES_EDITAR",
      },
    ],
  },
];
export function Sidebar({ isOpen, onClose }) {
  const { hasPermission } = useAuth();

  const visibleNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,

      items: group.items.filter((item) =>
        hasPermission(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#1f1524]/45 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col",
          "border-r border-white/10 bg-[#32113f] text-white",
          "transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-[86px] items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#432059] shadow-lg">
              R
            </div>

            <div>
              <p className="text-[17px] font-bold leading-none">Reservado</p>

              <p className="mt-1.5 text-xs font-medium text-white/55">
                Administrativo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/65 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-7">
           {visibleNavigationGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  {group.label}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          [
                            "group flex min-h-11 items-center gap-3 rounded-xl px-3.5",
                            "text-sm font-semibold transition duration-200",
                            isActive
                              ? "bg-white text-[#432059] shadow-[0_8px_24px_rgba(20,5,28,0.18)]"
                              : "text-white/65 hover:bg-white/[0.08] hover:text-white",
                          ].join(" ")
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={19}
                              strokeWidth={isActive ? 2.2 : 1.9}
                            />

                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-xs font-bold text-white/85">
                  Ambiente corporativo
                </p>

                <p className="mt-1 text-[11px] leading-5 text-white/40">
                  Acesso restrito aos colaboradores autorizados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}