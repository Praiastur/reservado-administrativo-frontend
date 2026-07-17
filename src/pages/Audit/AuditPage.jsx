import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Modal } from "../../components/ui/Modal";
import { useAudit } from "../../contexts/AuditContext";

const LOGS_PER_PAGE = 6;

const levelConfiguration = {
  SUCESSO: {
    label: "Sucesso",
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  INFORMACAO: {
    label: "Informação",
    icon: Activity,
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
    dotClassName: "bg-blue-500",
  },
  ATENCAO: {
    label: "Atenção",
    icon: AlertTriangle,
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },
  CRITICO: {
    label: "Crítico",
    icon: ShieldAlert,
    className:
      "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
  },
};

function getLevelConfiguration(level) {
  return (
    levelConfiguration[level] ??
    levelConfiguration.INFORMACAO
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isDateInPeriod(dateValue, period) {
  if (period === "TODOS") {
    return true;
  }

  const eventDate = new Date(dateValue);
  const now = new Date();

  if (Number.isNaN(eventDate.getTime())) {
    return false;
  }

  if (period === "HOJE") {
    const beginningOfToday = new Date();
    beginningOfToday.setHours(0, 0, 0, 0);

    return eventDate >= beginningOfToday;
  }

  const periodInDays =
    period === "7_DIAS" ? 7 : 30;

  const periodStart = new Date(
    now.getTime() -
      periodInDays * 24 * 60 * 60 * 1000,
  );

  return eventDate >= periodStart;
}

function LevelBadge({ level }) {
  const configuration =
    getLevelConfiguration(level);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1",
        "text-xs font-bold",
        configuration.className,
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          configuration.dotClassName,
        ].join(" ")}
      />

      {configuration.label}
    </span>
  );
}

export function AuditPage() {
  const { logs } = useAudit();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] =
    useState("TODOS");
  const [levelFilter, setLevelFilter] =
    useState("TODOS");
  const [periodFilter, setPeriodFilter] =
    useState("30_DIAS");

  const [currentPage, setCurrentPage] =
    useState(1);
  const [selectedLog, setSelectedLog] =
    useState(null);

  const availableModules = useMemo(() => {
    return Array.from(
      new Set(
        logs.map((log) => log.modulo),
      ),
    ).sort((firstModule, secondModule) =>
      firstModule.localeCompare(
        secondModule,
        "pt-BR",
      ),
    );
  }, [logs]);

  const statistics = useMemo(() => {
    const beginningOfToday = new Date();
    beginningOfToday.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter(
      (log) =>
        new Date(log.dataHora) >= beginningOfToday,
    );

    const securityEvents = logs.filter(
      (log) =>
        log.modulo === "Autenticação" &&
        ["ATENCAO", "CRITICO"].includes(
          log.nivel,
        ),
    );

    const uniqueUsers = new Set(
      logs
        .map((log) => log.usuarioEmail)
        .filter(Boolean),
    );

    return {
      total: logs.length,
      hoje: todayLogs.length,
      seguranca: securityEvents.length,
      usuarios: uniqueUsers.size,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return logs
      .filter((log) => {
        const searchableContent = [
          log.usuarioNome,
          log.usuarioEmail,
          log.acao,
          log.acaoLabel,
          log.modulo,
          log.descricao,
          log.ip,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          searchableContent.includes(
            normalizedSearch,
          );

        const matchesModule =
          moduleFilter === "TODOS" ||
          log.modulo === moduleFilter;

        const matchesLevel =
          levelFilter === "TODOS" ||
          log.nivel === levelFilter;

        const matchesPeriod = isDateInPeriod(
          log.dataHora,
          periodFilter,
        );

        return (
          matchesSearch &&
          matchesModule &&
          matchesLevel &&
          matchesPeriod
        );
      })
      .sort(
        (firstLog, secondLog) =>
          new Date(secondLog.dataHora) -
          new Date(firstLog.dataHora),
      );
  }, [
    logs,
    search,
    moduleFilter,
    levelFilter,
    periodFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLogs.length / LOGS_PER_PAGE,
    ),
  );

  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setCurrentPage(1);
  }

  function handleModuleChange(event) {
    setModuleFilter(event.target.value);
    setCurrentPage(1);
  }

  function handleLevelChange(event) {
    setLevelFilter(event.target.value);
    setCurrentPage(1);
  }

  function handlePeriodChange(event) {
    setPeriodFilter(event.target.value);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearch("");
    setModuleFilter("TODOS");
    setLevelFilter("TODOS");
    setPeriodFilter("30_DIAS");
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Activity
            size={20}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <div>
            <p className="text-sm font-bold text-blue-800">
              Auditoria local ativa
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              As ações realizadas no ambiente administrativo agora são registradas
              automaticamente neste navegador enquanto o endpoint de auditoria
              não está disponível no backend.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#754286]">
          Segurança e rastreabilidade
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#2d2530]">
          Auditoria do sistema
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#817688]">
          Consulte as ações realizadas pelos usuários,
          tentativas de acesso e alterações administrativas
          dentro do Reservado Administrativo.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard
          label="Total de registros"
          value={statistics.total}
          icon={Activity}
          iconClassName="bg-[#f0e8f3] text-[#432059]"
        />

        <StatisticCard
          label="Ações realizadas hoje"
          value={statistics.hoje}
          icon={CalendarDays}
          iconClassName="bg-emerald-50 text-emerald-700"
        />

        <StatisticCard
          label="Alertas de segurança"
          value={statistics.seguranca}
          icon={ShieldAlert}
          iconClassName="bg-red-50 text-red-700"
        />

        <StatisticCard
          label="Usuários identificados"
          value={statistics.usuarios}
          icon={UsersRound}
          iconClassName="bg-blue-50 text-blue-700"
        />
      </section>

      <section className="rounded-2xl border border-[#e7e1e9] bg-white p-4 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_190px_190px]">
          <div className="relative">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958b99]"
            />

            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Pesquisar usuário, ação, módulo ou IP..."
              className="h-12 w-full rounded-xl border border-[#ded8e2] bg-white pl-11 pr-4 text-sm text-[#312934] outline-none transition placeholder:text-[#a59ca9] focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10"
            />
          </div>

          <FilterSelect
            value={moduleFilter}
            onChange={handleModuleChange}
            icon={Filter}
            ariaLabel="Filtrar por módulo"
          >
            <option value="TODOS">
              Todos os módulos
            </option>

            {availableModules.map((moduleName) => (
              <option
                key={moduleName}
                value={moduleName}
              >
                {moduleName}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={levelFilter}
            onChange={handleLevelChange}
            icon={ShieldAlert}
            ariaLabel="Filtrar por nível"
          >
            <option value="TODOS">
              Todos os níveis
            </option>
            <option value="SUCESSO">Sucesso</option>
            <option value="INFORMACAO">
              Informação
            </option>
            <option value="ATENCAO">Atenção</option>
            <option value="CRITICO">Crítico</option>
          </FilterSelect>

          <FilterSelect
            value={periodFilter}
            onChange={handlePeriodChange}
            icon={CalendarDays}
            ariaLabel="Filtrar por período"
          >
            <option value="HOJE">Hoje</option>
            <option value="7_DIAS">
              Últimos 7 dias
            </option>
            <option value="30_DIAS">
              Últimos 30 dias
            </option>
            <option value="TODOS">
              Todo o período
            </option>
          </FilterSelect>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
        {currentLogs.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="border-b border-[#eee9f0] bg-[#faf8fb]">
                    <TableHeading>
                      Usuário
                    </TableHeading>
                    <TableHeading>Ação</TableHeading>
                    <TableHeading>Módulo</TableHeading>
                    <TableHeading>Nível</TableHeading>
                    <TableHeading>Data e hora</TableHeading>
                    <TableHeading align="right">
                      Detalhes
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ecf2]">
                  {currentLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition hover:bg-[#fcfafc]"
                    >
                      <td className="px-5 py-4">
                        <AuditUser log={log} />
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-[#443849]">
                          {log.acaoLabel}
                        </p>

                        <p className="mt-1 max-w-[320px] truncate text-xs text-[#918795]">
                          {log.descricao}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-[#f3eef5] px-2.5 py-1.5 text-xs font-bold text-[#633274]">
                          {log.modulo}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <LevelBadge
                          level={log.nivel}
                        />
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-[#756b79]">
                        {formatDateTime(
                          log.dataHora,
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLog(log)
                          }
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ded7e1] px-3.5 text-xs font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f3f9]"
                        >
                          <Eye size={16} />
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#eee9f0] lg:hidden">
              {currentLogs.map((log) => (
                <article
                  key={log.id}
                  className="p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <AuditUser log={log} />

                    <LevelBadge
                      level={log.nivel}
                    />
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-bold text-[#443849]">
                      {log.acaoLabel}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#918795]">
                      {log.descricao}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileInformation
                      label="Módulo"
                      value={log.modulo}
                    />

                    <MobileInformation
                      label="Data"
                      value={formatDate(
                        log.dataHora,
                      )}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedLog(log)
                    }
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#ded7e1] text-xs font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f3f9]"
                  >
                    <Eye size={16} />
                    Visualizar registro
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2edf4] text-[#623173]">
              <Search size={24} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#342b37]">
              Nenhum registro encontrado
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#897f8d]">
              Não encontramos registros correspondentes
              aos filtros selecionados.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 text-sm font-bold text-[#5d276d] hover:underline"
            >
              Limpar pesquisa e filtros
            </button>
          </div>
        )}

        <footer className="flex flex-col justify-between gap-4 border-t border-[#eee9f0] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <p className="text-xs font-medium text-[#8d8391]">
            Exibindo{" "}
            <strong className="text-[#514756]">
              {currentLogs.length}
            </strong>{" "}
            de{" "}
            <strong className="text-[#514756]">
              {filteredLogs.length}
            </strong>{" "}
            registros
          </p>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(1, page - 1),
                )
              }
              disabled={currentPage === 1}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ded7e1] px-3 text-xs font-bold text-[#665c6a] transition hover:border-[#bdaec4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
              Anterior
            </button>

            <span className="text-xs font-bold text-[#655b69]">
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    totalPages,
                    page + 1,
                  ),
                )
              }
              disabled={
                currentPage === totalPages
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ded7e1] px-3 text-xs font-bold text-[#665c6a] transition hover:border-[#bdaec4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight size={17} />
            </button>
          </div>
        </footer>
      </section>

      <Modal
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Detalhes do registro"
        description="Informações completas da ação registrada."
        maxWidth="max-w-2xl"
      >
        {selectedLog && (
          <>
            <div className="space-y-6 px-5 py-6 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#432059] text-white">
                  <Activity size={25} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-[#312934]">
                      {selectedLog.acaoLabel}
                    </h3>

                    <LevelBadge
                      level={selectedLog.nivel}
                    />
                  </div>

                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.13em] text-[#875492]">
                    {selectedLog.acao}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[#817688]">
                    {selectedLog.descricao}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailCard
                  icon={UserRound}
                  label="Usuário"
                  value={selectedLog.usuarioNome}
                  secondaryValue={
                    selectedLog.usuarioEmail
                  }
                />

                <DetailCard
                  icon={Activity}
                  label="Módulo"
                  value={selectedLog.modulo}
                />

                <DetailCard
                  icon={Clock3}
                  label="Data e hora"
                  value={formatDateTime(
                    selectedLog.dataHora,
                  )}
                />

                <DetailCard
                  icon={ShieldAlert}
                  label="Endereço IP"
                  value={selectedLog.ip || "Não informado"}
                />
              </div>

              <div className="rounded-2xl border border-[#ebe5ed] bg-[#fcfafc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b397a]">
                  Identificador do evento
                </p>

                <p className="mt-2 font-mono text-sm font-bold text-[#3d3440]">
                  AUD-{String(
                    selectedLog.id,
                  ).padStart(6, "0")}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
                className="h-11 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366]"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  icon: Icon,
  ariaLabel,
  children,
}) {
  return (
    <div className="relative">
      <Icon
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958b99]"
      />

      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className="h-12 w-full appearance-none rounded-xl border border-[#ded8e2] bg-white pl-11 pr-10 text-sm font-semibold text-[#4d4351] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10"
      >
        {children}
      </select>

      <ChevronDown
        size={17}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#958b99]"
      />
    </div>
  );
}

function AuditUser({ log }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ede4f1] text-xs font-bold text-[#5d276d]">
        {getInitials(log.usuarioNome) || "?"}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#342b37]">
          {log.usuarioNome}
        </p>

        <p className="mt-1 truncate text-xs text-[#928895]">
          {log.usuarioEmail}
        </p>
      </div>
    </div>
  );
}

function StatisticCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}) {
  return (
    <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={21} />
        </div>

        <p className="text-3xl font-bold tracking-[-0.04em] text-[#302733]">
          {value}
        </p>
      </div>

      <p className="mt-4 text-sm font-semibold text-[#817688]">
        {label}
      </p>
    </article>
  );
}

function TableHeading({
  children,
  align = "left",
}) {
  return (
    <th
      className={[
        "px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.13em]",
        "text-[#8d8391]",
        align === "right"
          ? "text-right"
          : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function MobileInformation({ label, value }) {
  return (
    <div className="rounded-xl bg-[#faf8fb] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">
        {label}
      </p>

      <p className="mt-1.5 text-xs font-semibold leading-5 text-[#554b59]">
        {value}
      </p>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  secondaryValue,
}) {
  return (
    <div className="rounded-2xl border border-[#ebe5ed] bg-[#fcfafc] p-4">
      <div className="flex items-center gap-2 text-[#6b397a]">
        <Icon size={17} />

        <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-bold text-[#3d3440]">
        {value}
      </p>

      {secondaryValue && (
        <p className="mt-1 break-all text-xs text-[#8d8391]">
          {secondaryValue}
        </p>
      )}
    </div>
  );
}