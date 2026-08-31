import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FileSearch,
  FileText,
  FilterX,
  Link2,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import { integracoesService } from "../../services/integracoesService";
import { getApiErrorMessage } from "../../services/apiError";

export function ContratosNaoCadastradosPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response =
          await integracoesService.listarContratosNaoCadastrados();
        if (active) {
          setItems(response.itens);
          setTotal(response.total);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar os contratos pendentes.",
            ),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const contractNumber = [item.contrato, item.letra]
        .filter(Boolean)
        .join(" / ")
        .toLowerCase();

      return (
        contractNumber.includes(term) ||
        item.titular.toLowerCase().includes(term)
      );
    });
  }, [items, search]);

  const activeCount = items.filter((item) => {
    const normalized = (item.status ?? "").toUpperCase();
    return normalized === "A" || normalized === "R";
  }).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#754286]">
            Integrações
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#2d2530]">
            Contratos não cadastrados
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817688]">
            Contratos ainda ativos no sistema antigo (Gota) — em geral de anos
            anteriores a 2025 — que nunca foram migrados para a Omie nem
            cadastrados aqui no Reservado. Use como checklist de migração.
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
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold">
              Não foi possível carregar os contratos pendentes
            </p>
            <p className="mt-1 text-sm leading-6">{loadError}</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <StatisticCard
          label="Contratos não cadastrados"
          value={total}
          icon={Link2}
          iconClassName="bg-[#f0e8f3] text-[#432059]"
        />
        <StatisticCard
          label="Com status ativo no Gota"
          value={activeCount}
          icon={FileText}
          iconClassName="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#eee9f0] p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex h-12 flex-1 items-center rounded-xl border border-[#ded8e2] bg-white text-[#8b818f] transition focus-within:border-[#432059] focus-within:ring-4 focus-within:ring-[#432059]/10">
            <Search size={18} className="ml-4 shrink-0" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por número do contrato ou titular"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ded8e2] text-[#766c7a] transition hover:border-[#432059] hover:bg-[#f8f4fa] hover:text-[#432059] sm:self-auto"
              aria-label="Limpar busca"
            >
              <FilterX size={19} />
            </button>
          )}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : filteredItems.length === 0 ? (
          <EmptyState hasSearch={Boolean(search)} onClear={() => setSearch("")} />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse">
                <thead className="bg-[#faf8fb]">
                  <tr>
                    <TableHeading>Contrato</TableHeading>
                    <TableHeading>Titular</TableHeading>
                    <TableHeading>Status no Gota</TableHeading>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ecf2]">
                  {filteredItems.map((item, index) => (
                    <tr
                      key={`${item.contrato}-${item.letra}-${index}`}
                      className="transition hover:bg-[#fcfafc]"
                    >
                      <td className="px-5 py-4">
                        <ContractIdentity item={item} />
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#413646]">
                        {item.titular || "Não informado"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#f0ecf2] lg:hidden">
              {filteredItems.map((item, index) => (
                <article
                  key={`${item.contrato}-${item.letra}-${index}`}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <ContractIdentity item={item} />
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#413646]">
                    {item.titular || "Não informado"}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ContractIdentity({ item }) {
  const contractNumber =
    [item.contrato, item.letra].filter(Boolean).join(" / ") ||
    "Contrato sem número";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ede4f1] text-[#5d276d]">
        <FileText size={19} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#342b37]">
          {contractNumber}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = (status ?? "").toUpperCase();
  // "R" (renegociado) também conta como ativo pra esse checklist —
  // confirmado com o Arthur, não é um status inativo/cancelado.
  const isAtivo = normalized === "A" || normalized === "R";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${
        isAtivo
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-[#ded4e2] bg-[#f7f3f8] text-[#684974]"
      }`}
    >
      {isAtivo ? "Ativo" : status || "Não informado"}
    </span>
  );
}

function StatisticCard({ label, value, icon: Icon, iconClassName }) {
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
      <p className="mt-4 text-sm font-semibold text-[#817688]">{label}</p>
    </article>
  );
}

function TableHeading({ children }) {
  return (
    <th className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.13em] text-[#8d8391]">
      {children}
    </th>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 p-5" aria-label="Carregando contratos">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-2xl bg-[#f3eff4]"
        />
      ))}
    </div>
  );
}

function EmptyState({ hasSearch, onClear }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0e8f3] text-[#432059]">
        {hasSearch ? <FileSearch size={28} /> : <UserRound size={28} />}
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#342b37]">
        {hasSearch
          ? "Nenhum contrato encontrado"
          : "Nenhum contrato pendente"}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#817688]">
        {hasSearch
          ? "Revise o termo buscado ou limpe a busca."
          : "Não há contratos do Gota pendentes de migração no momento."}
      </p>
      {hasSearch && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#dcd4df] px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]"
        >
          <FilterX size={18} />
          Limpar busca
        </button>
      )}
    </div>
  );
}
