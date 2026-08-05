import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  ReceiptText,
  RefreshCw,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { annualitiesService } from "../../services/annualitiesService";
import { getApiErrorMessage } from "../../services/apiError";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0));
}

export function AnnualityDetailsPage() {
  const { annualityId } = useParams();
  const [annuality, setAnnuality] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadAnnuality() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await annualitiesService.getById(annualityId);

        if (active) {
          setAnnuality(response?.id ? response : null);

          if (!response?.id) {
            setLoadError("A anuidade solicitada não foi encontrada.");
          }
        }
      } catch (error) {
        if (active) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar os dados da anuidade.",
            ),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadAnnuality();

    return () => {
      active = false;
    };
  }, [annualityId, reloadToken]);

  const receivableTotals = useMemo(() => {
    const receivables = annuality?.contasReceber ?? [];

    return receivables.reduce(
      (totals, receivable) => ({
        original: totals.original + receivable.valorOriginal,
        open: totals.open + receivable.valorAberto,
        paid: totals.paid + (receivable.pago ? 1 : 0),
      }),
      { original: 0, open: 0, paid: 0 },
    );
  }, [annuality]);

  if (isLoading) return <DetailsSkeleton />;

  if (loadError || !annuality) {
    return (
      <div className="space-y-5">
        <BackLink />
        <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(56,32,65,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={28} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#342b37]">
            Não foi possível abrir a anuidade
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

  const contractNumber = [
    annuality.contrato.numero,
    annuality.contrato.letra,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="space-y-6">
      <BackLink />

      <section className="relative overflow-hidden rounded-3xl bg-[#432059] p-6 text-white shadow-[0_18px_50px_rgba(67,32,89,0.18)] sm:p-8">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[45px] border-white/[0.04]" />
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <ReceiptText size={27} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-white/75">
                  Anuidade #{annuality.id}
                </span>
                <SituationBadge value={annuality.situacao} dark />
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                {annuality.anoReferencia ?? "Ano não informado"}
              </h2>
              <p className="mt-2 text-sm text-white/65">
                Contrato {contractNumber || `#${annuality.contratoId}`}
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
          icon={CircleDollarSign}
          label="Valor da anuidade"
          value={formatCurrency(annuality.valor)}
        />
        <InformationCard
          icon={CalendarDays}
          label="Vencimento"
          value={formatDate(annuality.dataVencimento)}
        />
        <InformationCard
          icon={CalendarCheck2}
          label="Pagamento"
          value={formatDate(annuality.dataPagamento)}
        />
        <InformationCard
          icon={WalletCards}
          label="Contas a receber"
          value={annuality.contasReceber.length}
        />
      </section>

      <ContractSection
        contract={annuality.contrato}
        fallbackId={annuality.contratoId}
      />

      <ReceivablesSection
        receivables={annuality.contasReceber}
        totals={receivableTotals}
      />

      <section className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Information
            label="Criada em"
            value={formatDate(annuality.criadoEm, true)}
          />
          <Information
            label="Última atualização"
            value={formatDate(annuality.atualizadoEm, true)}
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
      to="/anuidades"
      className="inline-flex items-center gap-2 text-sm font-bold text-[#5d276d] transition hover:text-[#341366]"
    >
      <ArrowLeft size={18} />
      Voltar para anuidades
    </Link>
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

function ContractSection({ contract, fallbackId }) {
  const contractId = contract.id ?? fallbackId;
  const contractNumber = [contract.numero, contract.letra]
    .filter(Boolean)
    .join(" / ");

  return (
    <section className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e8f3] text-[#5d276d]">
            <FileText size={19} />
          </div>
          <div>
            <h3 className="font-bold text-[#342b37]">Contrato vinculado</h3>
            <p className="mt-1 text-xs leading-5 text-[#8a808e]">
              Origem contratual desta anuidade.
            </p>
          </div>
        </div>
        {contractId && (
          <Link
            to={`/contratos/${contractId}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] px-4 text-sm font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f4fa]"
          >
            <FileText size={17} />
            Abrir contrato
          </Link>
        )}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Information label="Contrato" value={contractNumber || `#${contractId}`} />
        <Information label="Ano" value={contract.ano ?? "Não informado"} />
        <Information label="Situação" value={contract.situacao || "Não informada"} />
        <Information label="Status do cadastro" value={contract.ativo ? "Ativo" : "Inativo"} />
      </div>
    </section>
  );
}

function ReceivablesSection({ receivables, totals }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
      <header className="flex flex-col justify-between gap-4 border-b border-[#eee9f0] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e8f3] text-[#5d276d]">
            <Banknote size={19} />
          </div>
          <div>
            <h3 className="font-bold text-[#342b37]">Contas a receber</h3>
            <p className="mt-1 text-xs leading-5 text-[#8a808e]">
              Cobranças financeiras vinculadas a esta anuidade.
            </p>
          </div>
        </div>
        {receivables.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-lg bg-[#f7f3f8] px-3 py-2 text-[#65486f]">
              Original: {formatCurrency(totals.original)}
            </span>
            <span className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700">
              Em aberto: {formatCurrency(totals.open)}
            </span>
          </div>
        )}
      </header>

      {receivables.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3edf5] text-[#653475]">
            <WalletCards size={25} />
          </div>
          <p className="mt-4 font-bold text-[#3d3340]">
            Nenhuma conta a receber vinculada
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#8a808e]">
            O backend ainda não retornou cobranças para esta anuidade.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse">
              <thead className="bg-[#faf8fb]">
                <tr>
                  <TableHeading>Documento</TableHeading>
                  <TableHeading>Parcela</TableHeading>
                  <TableHeading>Vencimento</TableHeading>
                  <TableHeading>Valor original</TableHeading>
                  <TableHeading>Valor aberto</TableHeading>
                  <TableHeading>Situação</TableHeading>
                  <TableHeading>Pagamento</TableHeading>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ecf2]">
                {receivables.map((receivable) => (
                  <tr key={receivable.id} className="hover:bg-[#fcfafc]">
                    <TableCell strong>{receivable.numeroDocumento || `#${receivable.id}`}</TableCell>
                    <TableCell>{receivable.numeroParcela || "Não informada"}</TableCell>
                    <TableCell>{formatDate(receivable.dataVencimento)}</TableCell>
                    <TableCell strong>{formatCurrency(receivable.valorOriginal)}</TableCell>
                    <TableCell strong>{formatCurrency(receivable.valorAberto)}</TableCell>
                    <TableCell>{receivable.situacao || "Não informada"}</TableCell>
                    <TableCell><PaymentBadge paid={receivable.pago} /></TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#f0ecf2] lg:hidden">
            {receivables.map((receivable) => (
              <article key={receivable.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#342b37]">
                      {receivable.numeroDocumento || `Conta #${receivable.id}`}
                    </p>
                    <p className="mt-1 text-xs text-[#918794]">
                      Parcela {receivable.numeroParcela || "não informada"}
                    </p>
                  </div>
                  <PaymentBadge paid={receivable.pago} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Information label="Vencimento" value={formatDate(receivable.dataVencimento)} />
                  <Information label="Situação" value={receivable.situacao || "Não informada"} />
                  <Information label="Valor original" value={formatCurrency(receivable.valorOriginal)} />
                  <Information label="Valor aberto" value={formatCurrency(receivable.valorAberto)} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SituationBadge({ value, dark = false }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${dark ? "border-white/15 bg-white/10 text-white/80" : "border-[#ded4e2] bg-[#f7f3f8] text-[#684974]"}`}>
      {value || "Não informada"}
    </span>
  );
}

function PaymentBadge({ paid }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
      {paid ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {paid ? "Pago" : "Em aberto"}
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
    <td className={`whitespace-nowrap px-5 py-4 text-sm ${strong ? "font-bold text-[#413646]" : "text-[#756a79]"}`}>
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
    <div className="space-y-6" aria-label="Carregando anuidade">
      <div className="h-5 w-44 animate-pulse rounded bg-[#e9e2eb]" />
      <div className="h-52 animate-pulse rounded-3xl bg-[#e9e2eb]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-2xl bg-[#e9e2eb]" />
        ))}
      </div>
      <div className="h-52 animate-pulse rounded-2xl bg-[#e9e2eb]" />
      <div className="h-72 animate-pulse rounded-2xl bg-[#e9e2eb]" />
    </div>
  );
}
