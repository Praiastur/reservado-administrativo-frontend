import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  KeyRound,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router";

const statistics = [
  {
    label: "Usuários cadastrados",
    value: "128",
    detail: "12 novos neste mês",
    icon: Users,
    iconClass: "bg-[#f1eaf4] text-[#432059]",
  },
  {
    label: "Perfis ativos",
    value: "9",
    detail: "Todos em funcionamento",
    icon: ShieldCheck,
    iconClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Acessos hoje",
    value: "42",
    detail: "Último acesso há 3 min",
    icon: Activity,
    iconClass: "bg-blue-50 text-blue-700",
  },
  {
    label: "Ações registradas",
    value: "317",
    detail: "Nas últimas 24 horas",
    icon: FileText,
    iconClass: "bg-amber-50 text-amber-700",
  },
];

const activities = [
  {
    title: "Perfil de acesso atualizado",
    description: "As permissões do perfil Financeiro foram alteradas.",
    time: "Há 12 minutos",
    icon: KeyRound,
  },
  {
    title: "Novo usuário cadastrado",
    description: "Um novo colaborador foi adicionado ao sistema.",
    time: "Há 38 minutos",
    icon: UserPlus,
  },
  {
    title: "Acesso administrativo realizado",
    description: "Login efetuado com sucesso no ambiente administrativo.",
    time: "Há 1 hora",
    icon: CheckCircle2,
  },
];

function getFirstName() {
  try {
    const storedUser = sessionStorage.getItem("reservado_demo_user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    return user?.nome?.split(" ")[0] || "Usuário";
  } catch {
    return "Usuário";
  }
}

function getFormattedDate() {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

export function DashboardPage() {
  return (
    <div className="space-y-6">
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
              Olá, {getFirstName()}.
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-white/65">
              Acompanhe os principais indicadores e gerencie as operações do
              Reservado Administrativo.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold text-white/75 backdrop-blur">
            <Activity size={16} />
            Dados demonstrativos
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
                {statistic.value}
              </p>

              <p className="mt-2 text-xs font-medium text-[#9a919e]">
                {statistic.detail}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#eee9f0] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h3 className="text-lg font-bold text-[#302733]">
                Atividades recentes
              </h3>

              <p className="mt-1 text-sm text-[#8b818f]">
                Últimas movimentações registradas no sistema.
              </p>
            </div>

            <Link
              to="/auditoria"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#5d276d] transition hover:text-[#341366]"
            >
              Ver auditoria
              <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="divide-y divide-[#f0ecf2]">
            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <div
                  key={activity.title}
                  className="flex gap-4 px-5 py-5 transition hover:bg-[#fcfafc] sm:px-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2edf4] text-[#5d276d]">
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <p className="font-bold text-[#382f3b]">
                        {activity.title}
                      </p>

                      <span className="shrink-0 text-xs font-medium text-[#a097a4]">
                        {activity.time}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-6 text-[#857b89]">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-[#302733]">Ações rápidas</h3>

            <p className="mt-1 text-sm text-[#8b818f]">
              Acesse as principais operações administrativas.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              to="/usuarios"
              className="group flex items-center gap-4 rounded-2xl border border-[#e8e2eb] p-4 transition hover:border-[#cdbed4] hover:bg-[#faf7fb]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#432059] text-white shadow-[0_8px_20px_rgba(67,32,89,0.18)]">
                <UserPlus size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#382f3b]">Gerenciar usuários</p>

                <p className="mt-1 text-xs leading-5 text-[#8b818f]">
                  Cadastre e administre os acessos.
                </p>
              </div>

              <ArrowUpRight
                size={18}
                className="text-[#aaa0ad] transition group-hover:text-[#432059]"
              />
            </Link>

            <Link
              to="/perfis"
              className="group flex items-center gap-4 rounded-2xl border border-[#e8e2eb] p-4 transition hover:border-[#cdbed4] hover:bg-[#faf7fb]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0e8f3] text-[#5d276d]">
                <UserCog size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#382f3b]">
                  Configurar permissões
                </p>

                <p className="mt-1 text-xs leading-5 text-[#8b818f]">
                  Organize perfis e níveis de acesso.
                </p>
              </div>

              <ArrowUpRight
                size={18}
                className="text-[#aaa0ad] transition group-hover:text-[#432059]"
              />
            </Link>
          </div>

          <div className="mt-6 rounded-2xl bg-[#f7f3f8] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#5d276d]"
              />

              <p className="text-xs leading-5 text-[#776d7b]">
                As ações administrativas serão vinculadas ao usuário
                responsável para fins de segurança e auditoria.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}