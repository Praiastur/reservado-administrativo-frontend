import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Eye,
  FileSearch,
  FilterX,
  RefreshCw,
  Search,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";

import { clientsService } from "../../services/clientsService";
import { getApiErrorMessage } from "../../services/apiError";

const PAGE_SIZE = 20;

const initialFilters = {
  palavraChave: "",
  cpfCnpj: "",
  tipoPessoa: "",
  status: "TODOS",
};

function formatDocument(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      "$1.$2.$3-$4",
    );
  }

  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  }

  return value || "Não informado";
}

function getPersonTypeLabel(value) {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (normalized === "F" || normalized === "FISICA") {
    return "Pessoa física";
  }

  if (normalized === "J" || normalized === "JURIDICA") {
    return "Pessoa jurídica";
  }

  return value || "Não informado";
}

export function ClientsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState({
    items: [],
    totalRegistros: 0,
    totalPaginas: 1,
    temPaginaAnterior: false,
    temProximaPagina: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadClients() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await clientsService.list({
          palavraChave: appliedFilters.palavraChave,
          cpfCnpj: appliedFilters.cpfCnpj,
          tipoPessoa: appliedFilters.tipoPessoa,
          ativo:
            appliedFilters.status === "ATIVO"
              ? true
              : appliedFilters.status === "INATIVO"
                ? false
                : undefined,
          numeroPagina: currentPage,
          tamanhoPagina: PAGE_SIZE,
        });

        if (active) {
          setResult(response);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar os clientes.",
            ),
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadClients();

    return () => {
      active = false;
    };
  }, [appliedFilters, currentPage, reloadToken]);

  const pageStatistics = useMemo(() => {
    const physicalPeople = result.items.filter((client) =>
      ["F", "FISICA"].includes(
        String(client.tipoPessoa).trim().toUpperCase(),
      ),
    ).length;
    const legalPeople = result.items.filter((client) =>
      ["J", "JURIDICA"].includes(
        String(client.tipoPessoa).trim().toUpperCase(),
      ),
    ).length;

    return {
      active: result.items.filter((client) => client.ativo).length,
      physicalPeople,
      legalPeople,
    };
  }, [result.items]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setCurrentPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  }

  const hasFilters = Object.values(appliedFilters).some(
    (value) => value && value !== "TODOS",
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#754286]">
            Base de cadastros
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#2d2530]">
            Clientes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817688]">
            Consulte os clientes sincronizados e acompanhe seus dados cadastrais em um único lugar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReloadToken((current) => current + 1)}
          disabled={isLoading}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] bg-white px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          Atualizar dados
        </button>
      </section>

      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Não foi possível carregar os clientes</p>
            <p className="mt-1 text-sm leading-6">{loadError}</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard
          label="Clientes encontrados"
          value={result.totalRegistros}
          icon={UsersRound}
          iconClassName="bg-[#f0e8f3] text-[#432059]"
        />
        <StatisticCard
          label="Ativos nesta página"
          value={pageStatistics.active}
          icon={UserRoundCheck}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <StatisticCard
          label="Pessoas físicas na página"
          value={pageStatistics.physicalPeople}
          icon={CircleUserRound}
          iconClassName="bg-blue-50 text-blue-700"
        />
        <StatisticCard
          label="Pessoas jurídicas na página"
          value={pageStatistics.legalPeople}
          icon={Building2}
          iconClassName="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 border-b border-[#eee9f0] p-4 sm:p-5 md:grid-cols-2 2xl:grid-cols-[minmax(260px,1fr)_220px_180px_180px_auto]"
        >
          <FilterField icon={Search}>
            <input
              name="palavraChave"
              value={filters.palavraChave}
              onChange={handleFilterChange}
              placeholder="Nome, fantasia ou e-mail..."
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]"
            />
          </FilterField>

          <FilterField icon={FileSearch}>
            <input
              name="cpfCnpj"
              value={filters.cpfCnpj}
              onChange={handleFilterChange}
              placeholder="CPF ou CNPJ"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]"
            />
          </FilterField>

          <select
            name="tipoPessoa"
            value={filters.tipoPessoa}
            onChange={handleFilterChange}
            className="h-12 rounded-xl border border-[#ded8e2] bg-white px-3 text-sm font-semibold text-[#5d5361] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10"
          >
            <option value="">Todos os tipos</option>
            <option value="F">Pessoa física</option>
            <option value="J">Pessoa jurídica</option>
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-12 rounded-xl border border-[#ded8e2] bg-white px-3 text-sm font-semibold text-[#5d5361] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10"
          >
            <option value="TODOS">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#432059] px-4 text-sm font-bold text-white transition hover:bg-[#341366]"
            >
              <Search size={18} />
              Buscar
            </button>
            {(hasFilters || Object.values(filters).some(Boolean)) && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ded8e2] text-[#766c7a] transition hover:border-[#432059] hover:bg-[#f8f4fa] hover:text-[#432059]"
                aria-label="Limpar filtros"
              >
                <FilterX size={19} />
              </button>
            )}
          </div>
        </form>

        {isLoading ? (
          <LoadingState />
        ) : result.items.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse">
                <thead className="bg-[#faf8fb]">
                  <tr>
                    <TableHeading>Cliente</TableHeading>
                    <TableHeading>Documento</TableHeading>
                    <TableHeading>Tipo</TableHeading>
                    <TableHeading>Status</TableHeading>
                    <TableHeading align="right">Ações</TableHeading>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ecf2]">
                  {result.items.map((client) => (
                    <tr key={client.id} className="transition hover:bg-[#fcfafc]">
                      <td className="px-5 py-4">
                        <ClientIdentity client={client} />
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#615766]">
                        {formatDocument(client.cpfCnpj)}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#756b79]">
                        {getPersonTypeLabel(client.tipoPessoa)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge active={client.ativo} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DetailsLink clientId={client.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#f0ecf2] lg:hidden">
              {result.items.map((client) => (
                <article key={client.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <ClientIdentity client={client} />
                    <StatusBadge active={client.ativo} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Information label="Documento" value={formatDocument(client.cpfCnpj)} />
                    <Information label="Tipo" value={getPersonTypeLabel(client.tipoPessoa)} />
                  </div>
                  <DetailsLink clientId={client.id} fullWidth />
                </article>
              ))}
            </div>

            <Pagination
              currentPage={result.numeroPagina ?? currentPage}
              totalPages={Math.max(result.totalPaginas ?? 1, 1)}
              totalRecords={result.totalRegistros}
              canGoBack={result.temPaginaAnterior}
              canGoForward={result.temProximaPagina}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => page + 1)}
            />
          </>
        )}
      </section>
    </div>
  );
}

function FilterField({ icon: Icon, children }) {
  return (
    <div className="flex h-12 items-center rounded-xl border border-[#ded8e2] bg-white text-[#8b818f] transition focus-within:border-[#432059] focus-within:ring-4 focus-within:ring-[#432059]/10">
      <Icon size={18} className="ml-4 shrink-0" />
      {children}
    </div>
  );
}

function StatisticCard({ label, value, icon: Icon, iconClassName }) {
  return (
    <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon size={21} />
        </div>
        <p className="text-3xl font-bold tracking-[-0.04em] text-[#302733]">{value}</p>
      </div>
      <p className="mt-4 text-sm font-semibold text-[#817688]">{label}</p>
    </article>
  );
}

function TableHeading({ children, align = "left" }) {
  return (
    <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#8d8391] ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function ClientIdentity({ client }) {
  const icon = ["J", "JURIDICA"].includes(String(client.tipoPessoa).trim().toUpperCase())
    ? Building2
    : CircleUserRound;
  const Icon = icon;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ede4f1] text-[#5d276d]">
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#342b37]">{client.nomeRazaoSocial || "Cliente sem nome"}</p>
        <p className="mt-1 truncate text-xs text-[#928895]">{client.nomeFantasia || `Código ${client.id}`}</p>
      </div>
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function DetailsLink({ clientId, fullWidth = false }) {
  return (
    <Link
      to={`/clientes/${clientId}`}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ddd5e0] px-4 text-sm font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f4fa] ${fullWidth ? "mt-4 w-full" : ""}`}
    >
      <Eye size={17} />
      Detalhes
    </Link>
  );
}

function Information({ label, value }) {
  return (
    <div className="rounded-xl bg-[#faf8fb] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">{label}</p>
      <p className="mt-1.5 text-xs font-semibold text-[#554b59]">{value}</p>
    </div>
  );
}

function Pagination({ currentPage, totalPages, totalRecords, canGoBack, canGoForward, onPrevious, onNext }) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[#eee9f0] px-5 py-4 sm:flex-row">
      <p className="text-xs font-medium text-[#918794]">
        {totalRecords} {totalRecords === 1 ? "cliente encontrado" : "clientes encontrados"}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPrevious} disabled={!canGoBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded7e1] text-[#5d276d] transition hover:border-[#432059] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Página anterior">
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-24 text-center text-sm font-bold text-[#4c414f]">{currentPage} de {totalPages}</span>
        <button type="button" onClick={onNext} disabled={!canGoForward} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded7e1] text-[#5d276d] transition hover:border-[#432059] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Próxima página">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 p-5" aria-label="Carregando clientes">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#f3eff4]" />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0e8f3] text-[#432059]">
        <FileSearch size={28} />
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#342b37]">Nenhum cliente encontrado</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#817688]">
        {hasFilters ? "Revise os filtros utilizados ou faça uma nova pesquisa." : "A API ainda não retornou clientes para esta consulta."}
      </p>
      {hasFilters && (
        <button type="button" onClick={onClear} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#dcd4df] px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]">
          <FilterX size={18} />
          Limpar filtros
        </button>
      )}
    </div>
  );
}
