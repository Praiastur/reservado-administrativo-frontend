import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileText,
  ReceiptText,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { getApiErrorMessage } from "../../services/apiError";
import { contractsService } from "../../services/contractsService";

function formatDate(value, includeTime = false) {
  if (!value) return "Não informado";

  const normalizedValue =
    String(value).length === 10 ? `${value}T00:00:00` : value;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

export function ContractDetailsPage() {
  const { contractId } = useParams();
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadContract() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await contractsService.getById(contractId);

        if (active) {
          setContract(response);

          if (!response) {
            setLoadError("O contrato solicitado não foi encontrado.");
          }
        }
      } catch (error) {
        if (active) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar os dados do contrato.",
            ),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadContract();

    return () => {
      active = false;
    };
  }, [contractId, reloadToken]);

  if (isLoading) return <DetailsSkeleton />;

  if (loadError || !contract) {
    return (
      <div className="space-y-5">
        <BackLink />
        <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(56,32,65,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={28} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#342b37]">
            Não foi possível abrir o contrato
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#817688]">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => setReloadToken((current) => current + 1)}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366]"
          >
            <RefreshCw size={18} />
            Tentar novamente
          </button>
        </section>
      </div>
    );
  }

  const completeNumber = [contract.numero, contract.letra]
    .filter(Boolean)
    .join(" / ");
  const totalAnnualities = contract.anuidades.length;
  const annualitiesWithReceivable = contract.anuidades.filter(
    (annuality) => annuality.possuiContaReceber,
  ).length;

  return (
    <div className="space-y-6">
      <BackLink />

      <section className="relative overflow-hidden rounded-3xl bg-[#432059] p-6 text-white shadow-[0_18px_50px_rgba(67,32,89,0.18)] sm:p-8">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[45px] border-white/[0.04]" />
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <FileText size={27} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-white/75">
                  Contrato #{contract.id}
                </span>
                <StatusBadge active={contract.ativo} />
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                {completeNumber || "Contrato sem número"}
              </h2>
              <p className="mt-2 text-sm text-white/65">
                {contract.situacao || "Situação não informada"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReloadToken((current) => current + 1)}
            className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
          >
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InformationCard
          icon={CalendarDays}
          label="Ano do contrato"
          value={contract.ano ?? "Não informado"}
        />
        <InformationCard
          icon={FileCheck2}
          label="Situação"
          value={contract.situacao || "Não informada"}
        />
        <InformationCard
          icon={CalendarCheck2}
          label="Anuidades vinculadas"
          value={totalAnnualities}
        />
        <InformationCard
          icon={ReceiptText}
          label="Com conta a receber"
          value={annualitiesWithReceivable}
        />
      </section>

      <AnnualitiesSection annualities={contract.anuidades} />

      <section className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Information
            label="Criado em"
            value={formatDate(contract.criadoEm, true)}
          />
          <Information
            label="Última atualização"
            value={formatDate(contract.atualizadoEm, true)}
          />
        </div>
        <p className="mt-4 text-xs leading-5 text-[#918794]">
          Esta página é somente para consulta e utiliza os dados fornecidos
          pela API Financeiro.
        </p>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/contratos"
      className="inline-flex items-center gap-2 text-sm font-bold text-[#5d276d] transition hover:text-[#341366]"
    >
      <ArrowLeft size={18} />
      Voltar para contratos
    </Link>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
        active
          ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
          : "border-white/15 bg-white/10 text-white/70"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-300" : "bg-white/50"
        }`}
      />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function InformationCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0e8f3] text-[#5d276d]">
        <Icon size={19} />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#958a99]">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold leading-6 text-[#3a303d]">
        {value}
      </p>
    </article>
  );
}

function AnnualitiesSection({ annualities }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
      <header className="flex items-start gap-3 border-b border-[#eee9f0] px-5 py-5 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e8f3] text-[#5d276d]">
          <Banknote size={19} />
        </div>
        <div>
          <h3 className="font-bold text-[#342b37]">Anuidades</h3>
          <p className="mt-1 text-xs leading-5 text-[#8a808e]">
            Valores e vencimentos vinculados a este contrato.
          </p>
        </div>
      </header>

      {annualities.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3edf5] text-[#653475]">
            <CalendarDays size={25} />
          </div>
          <p className="mt-4 font-bold text-[#3d3340]">
            Nenhuma anuidade vinculada
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#8a808e]">
            O backend ainda não retornou anuidades para este contrato.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse">
              <thead className="bg-[#faf8fb]">
                <tr>
                  <TableHeading>Ano</TableHeading>
                  <TableHeading>Valor</TableHeading>
                  <TableHeading>Vencimento</TableHeading>
                  <TableHeading>Pagamento</TableHeading>
                  <TableHeading>Situação</TableHeading>
                  <TableHeading>Conta a receber</TableHeading>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ecf2]">
                {annualities.map((annuality) => (
                  <tr key={annuality.id} className="hover:bg-[#fcfafc]">
                    <TableCell strong>{annuality.anoReferencia}</TableCell>
                    <TableCell strong>
                      {formatCurrency(annuality.valor)}
                    </TableCell>
                    <TableCell>
                      {formatDate(annuality.dataVencimento)}
                    </TableCell>
                    <TableCell>
                      {formatDate(annuality.dataPagamento)}
                    </TableCell>
                    <TableCell>
                      {annuality.situacao || "Não informada"}
                    </TableCell>
                    <TableCell>
                      <ReceivableBadge
                        available={annuality.possuiContaReceber}
                      />
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#f0ecf2] md:hidden">
            {annualities.map((annuality) => (
              <article key={annuality.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#928895]">
                      Anuidade {annuality.anoReferencia}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#342b37]">
                      {formatCurrency(annuality.valor)}
                    </p>
                  </div>
                  <ReceivableBadge
                    available={annuality.possuiContaReceber}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Information
                    label="Vencimento"
                    value={formatDate(annuality.dataVencimento)}
                  />
                  <Information
                    label="Pagamento"
                    value={formatDate(annuality.dataPagamento)}
                  />
                  <Information
                    label="Situação"
                    value={annuality.situacao || "Não informada"}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ReceivableBadge({ available }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${
        available
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {available ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {available ? "Disponível" : "Não vinculada"}
    </span>
  );
}

function TableHeading({ children }) {
  return (
    <th className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.13em] text-[#8d8391]">
      {children}
    </th>
  );
}

function TableCell({ children, strong = false }) {
  return (
    <td
      className={`whitespace-nowrap px-5 py-4 text-sm ${
        strong ? "font-bold text-[#413646]" : "text-[#756a79]"
      }`}
    >
      {children}
    </td>
  );
}

function Information({ label, value }) {
  return (
    <div className="rounded-xl bg-[#faf8fb] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#554b59]">{value}</p>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando contrato">
      <div className="h-5 w-44 animate-pulse rounded bg-[#e9e2eb]" />
      <div className="h-52 animate-pulse rounded-3xl bg-[#e9e2eb]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl bg-[#e9e2eb]"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-[#e9e2eb]" />
    </div>
  );
}
