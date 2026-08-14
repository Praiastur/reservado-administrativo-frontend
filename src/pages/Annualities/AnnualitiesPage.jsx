import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileSearch,
  FileText,
  FilterX,
  Hash,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Link } from "react-router";

import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { annualitiesService } from "../../services/annualitiesService";
import { getApiErrorMessage } from "../../services/apiError";

const PAGE_SIZE = 20;
const initialFilters = {
  anoReferencia: "",
  numeroContrato: "",
  contratoId: "",
  situacao: "",
  contaReceber: "TODOS",
};
const initialResult = {
  items: [],
  totalRegistros: 0,
  numeroPagina: 1,
  totalPaginas: 1,
  temPaginaAnterior: false,
  temProximaPagina: false,
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function AnnualitiesPage() {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState(initialResult);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [operationMessage, setOperationMessage] = useState("");

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const [showBoletosModal, setShowBoletosModal] = useState(false);
  const [isGeneratingBoletos, setIsGeneratingBoletos] = useState(false);
  const [boletosError, setBoletosError] = useState("");

  const canGenerateAnnualities = hasPermission("ANUIDADES_VISUALIZAR");
  const canGenerateBoletos = hasPermission("ANUIDADES_CRIAR");

  useEffect(() => {
    let active = true;

    async function loadAnnualities() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await annualitiesService.list({
          ...appliedFilters,
          numeroPagina: currentPage,
          tamanhoPagina: PAGE_SIZE,
        });
        if (active) setResult(response);
      } catch (error) {
        if (active) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar as anuidades.",
            ),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadAnnualities();
    return () => {
      active = false;
    };
  }, [appliedFilters, currentPage, reloadToken]);

  const pageStatistics = useMemo(() => {
    const withReceivable = result.items.filter(
      (annuality) => annuality.possuiContaReceber,
    ).length;
    return {
      withReceivable,
      withoutReceivable: result.items.length - withReceivable,
      pageValue: result.items.reduce(
        (total, annuality) => total + annuality.valor,
        0,
      ),
    };
  }, [result.items]);

  const hasAppliedFilters = Object.values(appliedFilters).some(
    (value) => value !== "" && value !== "TODOS",
  );
  const hasDraftFilters = Object.values(filters).some(
    (value) => value !== "" && value !== "TODOS",
  );

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
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

  function closeGenerateModal() {
    if (isGenerating) return;
    setShowGenerateModal(false);
    setGenerateError("");
  }

  async function handleGenerateEmMassa() {
    setIsGenerating(true);
    setGenerateError("");
    setOperationMessage("");

    try {
      const generated = await annualitiesService.gerarEmMassa();

      setOperationMessage(
        `${generated.geradas} de ${generated.totalContratos} contratos ` +
          `ganharam anuidade nova${
            generated.erros > 0
              ? ` (${generated.erros} com erro — veja o log do servidor)`
              : ""
          }.`,
      );
      setShowGenerateModal(false);
      setReloadToken((current) => current + 1);
    } catch (error) {
      setGenerateError(
        getApiErrorMessage(
          error,
          "Não foi possível gerar as anuidades em massa.",
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function closeBoletosModal() {
    if (isGeneratingBoletos) return;
    setShowBoletosModal(false);
    setBoletosError("");
  }

  async function handleGenerateBoletosEmMassa() {
    setIsGeneratingBoletos(true);
    setBoletosError("");
    setOperationMessage("");

    try {
      const generated = await annualitiesService.gerarBoletosEmMassa();

      setOperationMessage(
        `${generated.gerados} de ${generated.total} anuidades ganharam ` +
          `boleto novo${
            generated.erros > 0
              ? ` (${generated.erros} com erro — veja o log do servidor)`
              : ""
          }.`,
      );
      setShowBoletosModal(false);
      setReloadToken((current) => current + 1);
    } catch (error) {
      setBoletosError(
        getApiErrorMessage(
          error,
          "Não foi possível gerar os boletos em massa.",
        ),
      );
    } finally {
      setIsGeneratingBoletos(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#754286]">
            Gestão financeira
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#2d2530]">
            Anuidades
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817688]">
            Consulte valores, vencimentos e vínculos financeiros das anuidades
            associadas aos contratos.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {canGenerateBoletos && (
            <button
              type="button"
              onClick={() => setShowBoletosModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] bg-white px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]"
            >
              <Banknote size={18} />
              Gerar boletos em massa
            </button>
          )}
          {canGenerateAnnualities && (
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] bg-white px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]"
            >
              <CalendarPlus size={18} />
              Gerar anuidades em massa
            </button>
          )}
          <button
            type="button"
            onClick={() => setReloadToken((current) => current + 1)}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] bg-white px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            Atualizar dados
          </button>
        </div>
      </section>

      {operationMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800"
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Operação concluída</p>
            <p className="mt-1 text-sm leading-6">{operationMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setOperationMessage("")}
            className="shrink-0 rounded-lg p-1 transition hover:bg-emerald-100"
            aria-label="Fechar mensagem"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loadError && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold">
              Não foi possível carregar as anuidades
            </p>
            <p className="mt-1 text-sm leading-6">{loadError}</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Anuidades encontradas" value={result.totalRegistros} icon={ReceiptText} iconClassName="bg-[#f0e8f3] text-[#432059]" />
        <StatisticCard label="Valor nesta página" value={currencyFormatter.format(pageStatistics.pageValue)} icon={CircleDollarSign} iconClassName="bg-emerald-50 text-emerald-700" compact />
        <StatisticCard label="Com conta a receber" value={pageStatistics.withReceivable} icon={CheckCircle2} iconClassName="bg-blue-50 text-blue-700" />
        <StatisticCard label="Sem conta a receber" value={pageStatistics.withoutReceivable} icon={XCircle} iconClassName="bg-amber-50 text-amber-700" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
        <form onSubmit={handleSubmit} className="grid gap-3 border-b border-[#eee9f0] p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-5">
          <FilterField icon={CalendarDays}>
            <input name="anoReferencia" type="number" min="2000" max="2200" value={filters.anoReferencia} onChange={handleFilterChange} placeholder="Ano de referência" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]" />
          </FilterField>
          <FilterField icon={FileText}>
            <input name="numeroContrato" value={filters.numeroContrato} onChange={handleFilterChange} placeholder="Número do contrato" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]" />
          </FilterField>
          <FilterField icon={Hash}>
            <input name="contratoId" type="number" min="1" value={filters.contratoId} onChange={handleFilterChange} placeholder="Código do contrato" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]" />
          </FilterField>
          <FilterField icon={Search}>
            <input name="situacao" value={filters.situacao} onChange={handleFilterChange} placeholder="Situação" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]" />
          </FilterField>
          <select name="contaReceber" value={filters.contaReceber} onChange={handleFilterChange} className="h-12 rounded-xl border border-[#ded8e2] bg-white px-3 text-sm font-semibold text-[#5d5361] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10">
            <option value="TODOS">Todas as contas</option>
            <option value="COM_CONTA">Com conta a receber</option>
            <option value="SEM_CONTA">Sem conta a receber</option>
          </select>
          <div className="flex gap-2 md:col-span-2 xl:col-span-5 xl:justify-end">
            <button type="submit" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] xl:flex-none">
              <Search size={18} />
              Buscar anuidades
            </button>
            {(hasAppliedFilters || hasDraftFilters) && (
              <button type="button" onClick={clearFilters} className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ded8e2] text-[#766c7a] transition hover:border-[#432059] hover:bg-[#f8f4fa] hover:text-[#432059]" aria-label="Limpar filtros">
                <FilterX size={19} />
              </button>
            )}
          </div>
        </form>

        {isLoading ? (
          <LoadingState />
        ) : result.items.length === 0 ? (
          <EmptyState hasFilters={hasAppliedFilters} onClear={clearFilters} />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse">
                <thead className="bg-[#faf8fb]">
                  <tr>
                    <TableHeading>Contrato</TableHeading>
                    <TableHeading>Ano</TableHeading>
                    <TableHeading>Valor</TableHeading>
                    <TableHeading>Vencimento</TableHeading>
                    <TableHeading>Situação</TableHeading>
                    <TableHeading>Conta a receber</TableHeading>
                    <TableHeading align="right">Ações</TableHeading>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ecf2]">
                  {result.items.map((annuality) => (
                    <tr key={annuality.id} className="transition hover:bg-[#fcfafc]">
                      <td className="px-5 py-4"><AnnualityIdentity annuality={annuality} /></td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#615766]">{annuality.anoReferencia ?? "Não informado"}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#342b37]">{currencyFormatter.format(annuality.valor)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#615766]">{formatDate(annuality.dataVencimento)}</td>
                      <td className="px-5 py-4"><SituationBadge value={annuality.situacao} /></td>
                      <td className="px-5 py-4"><ReceivableBadge linked={annuality.possuiContaReceber} /></td>
                      <td className="px-5 py-4 text-right"><AnnualityDetailsLink annualityId={annuality.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[#f0ecf2] lg:hidden">
              {result.items.map((annuality) => (
                <article key={annuality.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <AnnualityIdentity annuality={annuality} />
                    <ReceivableBadge linked={annuality.possuiContaReceber} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Information label="Ano" value={annuality.anoReferencia ?? "Não informado"} />
                    <Information label="Valor" value={currencyFormatter.format(annuality.valor)} />
                    <Information label="Vencimento" value={formatDate(annuality.dataVencimento)} />
                    <Information label="Situação" value={annuality.situacao || "Não informada"} />
                  </div>
                  <AnnualityDetailsLink annualityId={annuality.id} mobile />
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

      <Modal
        open={showGenerateModal}
        onClose={closeGenerateModal}
        title="Gerar anuidades em massa"
        description="Gera uma anuidade para todos os contratos ativos que ainda não têm anuidade no ano corrente, com vencimento padrão calculado pela API."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6 text-amber-800">
              Essa ação pode afetar vários contratos de uma vez e não tem
              volta automática. Confirme antes de continuar.
            </p>
          </div>

          {generateError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <XCircle size={19} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-6">{generateError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeGenerateModal}
            disabled={isGenerating}
            className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleGenerateEmMassa}
            disabled={isGenerating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <CalendarPlus size={17} />
                Gerar anuidades
              </>
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={showBoletosModal}
        onClose={closeBoletosModal}
        title="Gerar boletos em massa"
        description="Gera boleto para todas as anuidades aprovadas do ano corrente que ainda não têm conta a receber."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6 text-amber-800">
              Essa ação pode gerar vários boletos de uma vez na Omie.
              Confirme antes de continuar.
            </p>
          </div>

          {boletosError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <XCircle size={19} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-6">{boletosError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeBoletosModal}
            disabled={isGeneratingBoletos}
            className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleGenerateBoletosEmMassa}
            disabled={isGeneratingBoletos}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingBoletos ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Banknote size={17} />
                Gerar boletos
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Não informado";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function AnnualityDetailsLink({ annualityId, mobile = false }) {
  return (
    <Link to={`/anuidades/${annualityId}`} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ddd5e0] px-4 text-xs font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f4fa] ${mobile ? "mt-4 w-full" : ""}`}>
      <ReceiptText size={16} />
      Detalhes
    </Link>
  );
}

function FilterField({ icon: Icon, children }) {
  return <div className="flex h-12 items-center rounded-xl border border-[#ded8e2] bg-white text-[#8b818f] transition focus-within:border-[#432059] focus-within:ring-4 focus-within:ring-[#432059]/10"><Icon size={18} className="ml-4 shrink-0" />{children}</div>;
}

function StatisticCard({ label, value, icon: Icon, iconClassName, compact = false }) {
  return <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)]"><div className="flex items-center justify-between gap-4"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}><Icon size={21} /></div><p className={`${compact ? "text-xl" : "text-3xl"} text-right font-bold tracking-[-0.04em] text-[#302733]`}>{value}</p></div><p className="mt-4 text-sm font-semibold text-[#817688]">{label}</p></article>;
}

function TableHeading({ children, align = "left" }) {
  return <th className={`whitespace-nowrap px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#8d8391] ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>;
}

function AnnualityIdentity({ annuality }) {
  const contract = [annuality.numeroContrato, annuality.letraContrato].filter(Boolean).join(" / ");
  return <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ede4f1] text-[#5d276d]"><ReceiptText size={19} /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#342b37]">{contract || "Contrato não informado"}</p><p className="mt-1 truncate text-xs text-[#928895]">Anuidade {annuality.id}</p></div></div>;
}

function SituationBadge({ value }) {
  return <span className="inline-flex rounded-full border border-[#ded4e2] bg-[#f7f3f8] px-2.5 py-1 text-xs font-bold text-[#684974]">{value || "Não informada"}</span>;
}

function ReceivableBadge({ linked }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${linked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{linked ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{linked ? "Vinculada" : "Não vinculada"}</span>;
}

function Information({ label, value }) {
  return <div className="rounded-xl bg-[#faf8fb] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">{label}</p><p className="mt-1.5 text-xs font-semibold text-[#554b59]">{value}</p></div>;
}

function Pagination({ currentPage, totalPages, totalRecords, canGoBack, canGoForward, onPrevious, onNext }) {
  return <div className="flex flex-col items-center justify-between gap-3 border-t border-[#eee9f0] px-5 py-4 sm:flex-row"><p className="text-xs font-medium text-[#918794]">{totalRecords} {totalRecords === 1 ? "anuidade encontrada" : "anuidades encontradas"}</p><div className="flex items-center gap-2"><button type="button" onClick={onPrevious} disabled={!canGoBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded7e1] text-[#5d276d] transition hover:border-[#432059] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Página anterior"><ChevronLeft size={18} /></button><span className="min-w-24 text-center text-sm font-bold text-[#4c414f]">{currentPage} de {totalPages}</span><button type="button" onClick={onNext} disabled={!canGoForward} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded7e1] text-[#5d276d] transition hover:border-[#432059] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Próxima página"><ChevronRight size={18} /></button></div></div>;
}

function LoadingState() {
  return <div className="space-y-3 p-5" aria-label="Carregando anuidades">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#f3eff4]" />)}</div>;
}

function EmptyState({ hasFilters, onClear }) {
  return <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0e8f3] text-[#432059]"><FileSearch size={28} /></div><h3 className="mt-5 text-lg font-bold text-[#342b37]">Nenhuma anuidade encontrada</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#817688]">{hasFilters ? "Revise os filtros utilizados ou faça uma nova pesquisa." : "A API ainda não retornou anuidades para esta consulta."}</p>{hasFilters && <button type="button" onClick={onClear} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#dcd4df] px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]"><FilterX size={18} />Limpar filtros</button>}</div>;
}
