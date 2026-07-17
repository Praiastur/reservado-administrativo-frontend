import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  KeyRound,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import { useAccessManagement } from "../../contexts/AccessManagementContext";
import { useAudit } from "../../contexts/AuditContext";
import { useAuth } from "../../contexts/AuthContext";

const activityIconByAction = {
  PERFIS_ATUALIZADOS: UserCog,
  USUARIO_CRIADO: UserPlus,
  USUARIO_EDITADO: UserCog,
  SENHA_REDEFINIDA: KeyRound,
  USUARIO_BLOQUEADO: ShieldAlert,
  USUARIO_DESBLOQUEADO: CheckCircle2,
  USUARIO_INATIVADO: ShieldAlert,
  USUARIO_REATIVADO: CheckCircle2,
  PERFIL_CRIADO: ShieldCheck,
  PERFIL_EDITADO: UserCog,
  PERMISSOES_ALTERADAS: KeyRound,
  PERFIL_INATIVADO: ShieldAlert,
  PERFIL_REATIVADO: CheckCircle2,
  LOGIN_SUCESSO: CheckCircle2,
  LOGIN_FALHA: AlertTriangle,
  LOGOUT_REALIZADO: Activity,
  SESSAO_EXPIRADA: ShieldAlert,
  SESSAO_ENCERRADA: ShieldAlert,
  CONFIGURACOES_ALTERADAS: Settings,
  CONFIGURACOES_RESTAURADAS: Settings,
};

const quickActions = [
  {
    title: "Gerenciar usuários",
    description: "Cadastre colaboradores e administre os acessos.",
    path: "/usuarios",
    permission: "USUARIOS_VISUALIZAR",
    icon: UserPlus,
    primary: true,
  },
  {
    title: "Configurar permissões",
    description: "Organize perfis e níveis de acesso.",
    path: "/perfis",
    permission: "PERFIS_VISUALIZAR",
    icon: UserCog,
    primary: false,
  },
  {
    title: "Consultar auditoria",
    description: "Acompanhe ações e alertas de segurança.",
    path: "/auditoria",
    permission: "AUDITORIA_VISUALIZAR",
    icon: FileText,
    primary: false,
  },
  {
    title: "Abrir configurações",
    description: "Acesse as preferências gerais do sistema.",
    path: "/configuracoes",
    permission: "CONFIGURACOES_EDITAR",
    icon: Settings,
    primary: false,
  },
];

function getFormattedDate() {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function getFirstName(name) {
  return name?.trim().split(/\s+/)[0] || "Usuário";
}

function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

function getRelativeTime(value) {
  if (!isValidDate(value)) {
    return "Data não informada";
  }

  const eventTime = new Date(value).getTime();
  const differenceInSeconds = Math.max(
    0,
    Math.floor((Date.now() - eventTime) / 1000),
  );

  if (differenceInSeconds < 60) {
    return "Agora";
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);

  if (differenceInMinutes < 60) {
    return `Há ${differenceInMinutes} min`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 24) {
    return differenceInHours === 1
      ? "Há 1 hora"
      : `Há ${differenceInHours} horas`;
  }

  const differenceInDays = Math.floor(differenceInHours / 24);

  return differenceInDays === 1
    ? "Há 1 dia"
    : `Há ${differenceInDays} dias`;
}

function getPercentage(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function DashboardPage() {
  const {
    users,
    profiles,
    isLoading,
    loadError,
    useMockApi,
    getProfileUserCount,
  } = useAccessManagement();

  const { user, hasPermission } = useAuth();
  const { logs: auditLogs } = useAudit();

  const dashboardData = useMemo(() => {
    const now = new Date();
    const beginningOfToday = new Date(now);
    beginningOfToday.setHours(0, 0, 0, 0);

    const beginningOfLast24Hours = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    );

    const activeUsers = users.filter(
      (currentUser) => currentUser.ativo && !currentUser.bloqueado,
    ).length;

    const blockedUsers = users.filter(
      (currentUser) => currentUser.bloqueado,
    ).length;

    const inactiveUsers = users.filter(
      (currentUser) => !currentUser.ativo && !currentUser.bloqueado,
    ).length;

    const activeProfiles = profiles.filter(
      (profile) => profile.ativo,
    ).length;

    const inactiveProfiles = profiles.length - activeProfiles;

    const accessesToday = auditLogs.filter((log) => {
      return (
        log.acao === "LOGIN_SUCESSO" &&
        isValidDate(log.dataHora) &&
        new Date(log.dataHora) >= beginningOfToday
      );
    });

    const actionsLast24Hours = auditLogs.filter((log) => {
      return (
        isValidDate(log.dataHora) &&
        new Date(log.dataHora) >= beginningOfLast24Hours
      );
    });

    const securityAlertsLast24Hours = actionsLast24Hours.filter((log) =>
      ["ATENCAO", "CRITICO"].includes(log.nivel),
    ).length;

    const recentActivities = [...auditLogs]
      .filter((log) => isValidDate(log.dataHora))
      .sort(
        (firstLog, secondLog) =>
          new Date(secondLog.dataHora) - new Date(firstLog.dataHora),
      )
      .slice(0, 4);

    const topProfiles = profiles
      .map((profile) => ({
        ...profile,
        quantidadeUsuarios: getProfileUserCount(profile.id),
      }))
      .sort(
        (firstProfile, secondProfile) =>
          secondProfile.quantidadeUsuarios -
          firstProfile.quantidadeUsuarios,
      )
      .slice(0, 4);

    return {
      activeUsers,
      blockedUsers,
      inactiveUsers,
      activeProfiles,
      inactiveProfiles,
      accessesToday: accessesToday.length,
      distinctUsersToday: new Set(
        accessesToday.map((log) => log.usuarioEmail).filter(Boolean),
      ).size,
      actionsLast24Hours: actionsLast24Hours.length,
      securityAlertsLast24Hours,
      recentActivities,
      topProfiles,
    };
  }, [users, profiles, auditLogs, getProfileUserCount]);

  const statistics = [
    {
      label: "Usuários cadastrados",
      value: users.length,
      detail: `${dashboardData.activeUsers} ativos e ${dashboardData.blockedUsers} bloqueados`,
      icon: Users,
      iconClass: "bg-[#f1eaf4] text-[#432059]",
    },
    {
      label: "Perfis ativos",
      value: dashboardData.activeProfiles,
      detail:
        dashboardData.inactiveProfiles === 0
          ? "Todos em funcionamento"
          : `${dashboardData.inactiveProfiles} perfis inativos`,
      icon: ShieldCheck,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Acessos hoje",
      value: dashboardData.accessesToday,
      detail: `${dashboardData.distinctUsersToday} usuários identificados`,
      icon: Activity,
      iconClass: "bg-blue-50 text-blue-700",
    },
    {
      label: "Ações nas últimas 24h",
      value: dashboardData.actionsLast24Hours,
      detail: `${dashboardData.securityAlertsLast24Hours} alertas de segurança`,
      icon: FileText,
      iconClass: "bg-amber-50 text-amber-700",
    },
  ];

  const userStatusDistribution = [
    {
      label: "Ativos",
      value: dashboardData.activeUsers,
      percentage: getPercentage(dashboardData.activeUsers, users.length),
      barClassName: "bg-emerald-500",
      textClassName: "text-emerald-700",
    },
    {
      label: "Bloqueados",
      value: dashboardData.blockedUsers,
      percentage: getPercentage(dashboardData.blockedUsers, users.length),
      barClassName: "bg-red-500",
      textClassName: "text-red-700",
    },
    {
      label: "Inativos",
      value: dashboardData.inactiveUsers,
      percentage: getPercentage(dashboardData.inactiveUsers, users.length),
      barClassName: "bg-slate-400",
      textClassName: "text-slate-600",
    },
  ];

  const visibleQuickActions = quickActions.filter((action) =>
    hasPermission(action.permission),
  );

  return (
    <div className="space-y-6">
      {loadError && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <div>
              <p className="text-sm font-bold text-red-700">
                Não foi possível atualizar todos os indicadores
              </p>

              <p className="mt-1 text-sm leading-6 text-red-600">
                {loadError}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-3xl bg-[#432059] px-6 py-7 text-white shadow-[0_18px_50px_rgba(67,32,89,0.18)] sm:px-8 sm:py-9">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[50px] border-white/[0.04]" />
        <div className="absolute -bottom-40 right-32 h-80 w-80 rounded-full bg-[#8d55a1]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/80">
              <Clock3 size={14} />
              {getFormattedDate()}
            </div>

            <h2 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              Olá, {getFirstName(user?.nome)}.
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-white/65">
              Acompanhe os principais indicadores e gerencie as operações do
              Reservado Administrativo.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold text-white/75 backdrop-blur">
            <Activity size={16} />
            {isLoading
              ? "Atualizando indicadores..."
              : useMockApi
                ? "Dados locais atualizados"
                : "Usuários e perfis da API"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => {
          const Icon = statistic.icon;

          return (
            <article
              key={statistic.label}
              className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(56,32,65,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${statistic.iconClass}`}
                >
                  <Icon size={21} />
                </div>

                <ArrowUpRight size={18} className="text-[#bbb2bf]" />
              </div>

              <p className="mt-5 text-sm font-semibold text-[#7e7483]">
                {statistic.label}
              </p>

              <p className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[#2c242f]">
                {isLoading ? "—" : statistic.value}
              </p>

              <p className="mt-2 text-xs font-medium text-[#9a919e]">
                {isLoading ? "Carregando informações..." : statistic.detail}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#eee9f0] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-[#302733]">
                  Atividades recentes
                </h3>

                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
                  Auditoria dinâmica
                </span>
              </div>

              <p className="mt-1 text-sm text-[#8b818f]">
                Últimas movimentações registradas no sistema.
              </p>
            </div>

            {hasPermission("AUDITORIA_VISUALIZAR") && (
              <Link
                to="/auditoria"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#5d276d] transition hover:text-[#341366]"
              >
                Ver auditoria
                <ArrowUpRight size={17} />
              </Link>
            )}
          </div>

          <div className="divide-y divide-[#f0ecf2]">
            {dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((activity) => {
                const Icon =
                  activityIconByAction[activity.acao] ?? Activity;

                return (
                  <div
                    key={activity.id}
                    className="flex gap-4 px-5 py-5 transition hover:bg-[#fcfafc] sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2edf4] text-[#5d276d]">
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                        <p className="font-bold text-[#382f3b]">
                          {activity.acaoLabel}
                        </p>

                        <span className="shrink-0 text-xs font-medium text-[#a097a4]">
                          {getRelativeTime(activity.dataHora)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-[#857b89]">
                        {activity.descricao}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-[#9a919e]">
                        {activity.usuarioNome} · {activity.modulo}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <Activity size={26} className="mx-auto text-[#9b8fa0]" />

                <p className="mt-4 text-sm font-bold text-[#4b404f]">
                  Nenhuma atividade disponível
                </p>

                <p className="mt-2 text-xs leading-5 text-[#918795]">
                  As movimentações recentes aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-[#302733]">
              Situação dos usuários
            </h3>

            <p className="mt-1 text-sm text-[#8b818f]">
              Distribuição atual dos acessos cadastrados.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {userStatusDistribution.map((status) => (
              <div key={status.label}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-[#4b404f]">
                    {status.label}
                  </p>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${status.textClassName}`}
                    >
                      {status.value}
                    </span>

                    <span className="text-xs font-semibold text-[#9a919e]">
                      {status.percentage}%
                    </span>
                  </div>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee9f0]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${status.barClassName}`}
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-[#f7f3f8] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#5d276d]"
              />

              <p className="text-xs leading-5 text-[#776d7b]">
                Usuários bloqueados não são considerados ativos, mesmo quando
                o cadastro permanece habilitado.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-[#302733]">
              Perfis com mais usuários
            </h3>

            <p className="mt-1 text-sm text-[#8b818f]">
              Principais vínculos de acesso do sistema.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {dashboardData.topProfiles.length > 0 ? (
              dashboardData.topProfiles.map((profile, index) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-4 rounded-2xl border border-[#ebe5ed] bg-[#fcfafc] p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ede4f1] text-xs font-bold text-[#5d276d]">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-[#443849]">
                        {profile.nome}
                      </p>

                      {!profile.ativo && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                          Inativo
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[#918795]">
                      {profile.codigo}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-[#432059]">
                      {profile.quantidadeUsuarios}
                    </p>

                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9a919e]">
                      usuários
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d9cedd] px-5 py-10 text-center">
                <ShieldCheck size={25} className="mx-auto text-[#81658b]" />

                <p className="mt-4 text-sm font-bold text-[#4b404f]">
                  Nenhum perfil cadastrado
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-[#302733]">
              Ações rápidas
            </h3>

            <p className="mt-1 text-sm text-[#8b818f]">
              Acesse as principais operações permitidas para o seu perfil.
            </p>
          </div>

          {visibleQuickActions.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {visibleQuickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className="group flex items-center gap-4 rounded-2xl border border-[#e8e2eb] p-4 transition hover:border-[#cdbed4] hover:bg-[#faf7fb]"
                  >
                    <div
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        action.primary
                          ? "bg-[#432059] text-white shadow-[0_8px_20px_rgba(67,32,89,0.18)]"
                          : "bg-[#f0e8f3] text-[#5d276d]",
                      ].join(" ")}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#382f3b]">
                        {action.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#8b818f]">
                        {action.description}
                      </p>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-[#aaa0ad] transition group-hover:text-[#432059]"
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d9cedd] px-5 py-10 text-center">
              <ShieldAlert size={25} className="mx-auto text-[#81658b]" />

              <p className="mt-4 text-sm font-bold text-[#4b404f]">
                Nenhuma ação administrativa disponível
              </p>

              <p className="mt-2 text-xs leading-5 text-[#918795]">
                Seu perfil não possui permissão para acessar essas áreas.
              </p>
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-[#f7f3f8] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#5d276d]"
              />

              <p className="text-xs leading-5 text-[#776d7b]">
                As ações administrativas são vinculadas ao usuário responsável
                para fins de segurança e auditoria.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
