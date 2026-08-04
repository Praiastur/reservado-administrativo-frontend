import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  AtSign,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarDays,
  CircleUserRound,
  FileText,
  Landmark,
  MapPin,
  Phone,
  RefreshCw,
  Tags,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { clientsService } from "../../services/clientsService";
import { getApiErrorMessage } from "../../services/apiError";

function formatDocument(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }

  return value || "Não informado";
}

function formatDate(value) {
  if (!value) {
    return "Não informado";
  }

  const date = new Date(`${value}`.length === 10 ? `${value}T00:00:00` : value);

  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getPersonTypeLabel(value) {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (["F", "FISICA"].includes(normalized)) {
    return "Pessoa física";
  }

  if (["J", "JURIDICA"].includes(normalized)) {
    return "Pessoa jurídica";
  }

  return value || "Não informado";
}

export function ClientDetailsPage() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadClient() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await clientsService.getById(clientId);

        if (active) {
          setClient(response);

          if (!response) {
            setLoadError("O cliente solicitado não foi encontrado.");
          }
        }
      } catch (error) {
        if (active) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar os dados do cliente.",
            ),
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadClient();

    return () => {
      active = false;
    };
  }, [clientId, reloadToken]);

  if (isLoading) {
    return <DetailsSkeleton />;
  }

  if (loadError || !client) {
    return (
      <div className="space-y-5">
        <BackLink />
        <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(56,32,65,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={28} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#342b37]">Não foi possível abrir o cliente</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#817688]">{loadError}</p>
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

  const isLegalPerson = ["J", "JURIDICA"].includes(
    String(client.tipoPessoa).trim().toUpperCase(),
  );
  const IdentityIcon = isLegalPerson ? Building2 : CircleUserRound;

  return (
    <div className="space-y-6">
      <BackLink />

      <section className="relative overflow-hidden rounded-3xl bg-[#432059] p-6 text-white shadow-[0_18px_50px_rgba(67,32,89,0.18)] sm:p-8">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[45px] border-white/[0.04]" />
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <IdentityIcon size={27} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-white/75">
                  Cliente #{client.id}
                </span>
                <StatusBadge active={client.ativo} />
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                {client.nomeRazaoSocial || "Cliente sem nome"}
              </h2>
              <p className="mt-2 text-sm text-white/65">
                {client.nomeFantasia || getPersonTypeLabel(client.tipoPessoa)}
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
        <InformationCard icon={FileText} label="CPF/CNPJ" value={formatDocument(client.cpfCnpj)} />
        <InformationCard icon={BadgeCheck} label="Tipo de pessoa" value={getPersonTypeLabel(client.tipoPessoa)} />
        <InformationCard icon={AtSign} label="E-mail principal" value={client.emailPrincipal || "Não informado"} />
        <InformationCard icon={CalendarDays} label={isLegalPerson ? "Cadastro" : "Nascimento"} value={isLegalPerson ? formatDate(client.criadoEm) : formatDate(client.dataNascimento)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <CollectionCard
          icon={Phone}
          title="Contatos"
          description="Telefones e outros canais cadastrados."
          items={client.contatos}
          emptyMessage="Nenhum contato foi informado."
          renderItem={(contact) => (
            <DetailRow
              key={contact.id ?? `${contact.tipo}-${contact.valor}`}
              title={contact.tipo || "Contato"}
              value={[contact.ddd ? `(${contact.ddd})` : "", contact.valor].filter(Boolean).join(" ")}
              badge={contact.principal ? "Principal" : null}
            />
          )}
        />

        <CollectionCard
          icon={MapPin}
          title="Endereços"
          description="Locais vinculados ao cadastro."
          items={client.enderecos}
          emptyMessage="Nenhum endereço foi informado."
          renderItem={(address) => (
            <DetailRow
              key={address.id ?? `${address.tipo}-${address.cep}`}
              title={address.tipo || "Endereço"}
              value={formatAddress(address)}
              badge={address.principal ? "Principal" : null}
            />
          )}
        />

        <CollectionCard
          icon={FileText}
          title="Documentos adicionais"
          description="Documentos complementares do cliente."
          items={client.documentos}
          emptyMessage="Nenhum documento adicional foi informado."
          renderItem={(document) => (
            <DetailRow
              key={document.id ?? `${document.tipoDocumento}-${document.numero}`}
              title={document.tipoDocumento || "Documento"}
              value={document.numero || "Não informado"}
              badge={document.principal ? "Principal" : null}
            />
          )}
        />

        <CollectionCard
          icon={Landmark}
          title="Dados bancários"
          description="Contas e chaves para operações autorizadas."
          items={client.dadosBancarios}
          emptyMessage="Nenhum dado bancário foi informado."
          renderItem={(bankData) => (
            <DetailRow
              key={bankData.id ?? `${bankData.codigoBanco}-${bankData.contaCorrente}`}
              title={bankData.nomeTitular || "Conta bancária"}
              value={formatBankData(bankData)}
              badge={bankData.transferenciaPadrao ? "Padrão" : null}
            />
          )}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <CollectionCard
          icon={Tags}
          title="Tags"
          description="Classificações recebidas das integrações."
          items={client.tags}
          emptyMessage="Nenhuma tag foi informada."
          renderItem={(tag) => (
            <span key={tag.id ?? tag.tag} className="inline-flex rounded-full border border-[#dfd5e3] bg-[#f7f2f8] px-3 py-2 text-xs font-bold text-[#653475]">
              {tag.tag}
            </span>
          )}
          inline
        />

        <CollectionCard
          icon={Banknote}
          title="Características"
          description="Informações complementares mantidas no cadastro."
          items={client.caracteristicas}
          emptyMessage="Nenhuma característica foi informada."
          renderItem={(characteristic) => (
            <DetailRow
              key={characteristic.id ?? characteristic.campo}
              title={characteristic.campo || "Característica"}
              value={characteristic.conteudo || "Não informado"}
            />
          )}
        />
      </section>

      <section className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Information label="Criado em" value={formatDate(client.criadoEm)} />
          <Information label="Última atualização" value={formatDate(client.atualizadoEm)} />
        </div>
        <p className="mt-4 text-xs leading-5 text-[#918794]">
          Esta tela é somente para consulta. Alterações cadastrais dependerão de endpoints específicos do backend.
        </p>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/clientes" className="inline-flex items-center gap-2 text-sm font-bold text-[#5d276d] transition hover:text-[#341366]">
      <ArrowLeft size={18} />
      Voltar para clientes
    </Link>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${active ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100" : "border-white/15 bg-white/10 text-white/70"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-300" : "bg-white/50"}`} />
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
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#958a99]">{label}</p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-[#3a303d]">{value}</p>
    </article>
  );
}

function CollectionCard({ icon: Icon, title, description, items, emptyMessage, renderItem, inline = false }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
      <header className="flex items-start gap-3 border-b border-[#eee9f0] px-5 py-5 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e8f3] text-[#5d276d]">
          <Icon size={19} />
        </div>
        <div>
          <h3 className="font-bold text-[#342b37]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[#8a808e]">{description}</p>
        </div>
      </header>
      <div className={`p-5 sm:p-6 ${inline ? "flex flex-wrap gap-2" : "space-y-3"}`}>
        {items.length > 0 ? items.map(renderItem) : (
          <p className="text-sm leading-6 text-[#918794]">{emptyMessage}</p>
        )}
      </div>
    </article>
  );
}

function DetailRow({ title, value, badge }) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-xl border border-[#eee8f0] bg-[#fcfafc] p-4 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#4c414f]">{title}</p>
        <p className="mt-1 break-words text-sm leading-6 text-[#817688]">{value || "Não informado"}</p>
      </div>
      {badge && <span className="w-fit shrink-0 rounded-full bg-[#ede4f1] px-2.5 py-1 text-[10px] font-bold text-[#5d276d]">{badge}</span>}
    </div>
  );
}

function Information({ label, value }) {
  return (
    <div className="rounded-xl bg-[#faf8fb] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#554b59]">{value}</p>
    </div>
  );
}

function formatAddress(address) {
  const firstLine = [address.logradouro, address.numero].filter(Boolean).join(", ");
  const secondLine = [address.bairro, address.cidade, address.estado].filter(Boolean).join(" · ");
  const cep = address.cep ? `CEP ${address.cep}` : "";

  return [firstLine, address.complemento, secondLine, cep].filter(Boolean).join(" — ") || "Não informado";
}

function formatBankData(bankData) {
  const account = [
    bankData.codigoBanco ? `Banco ${bankData.codigoBanco}` : "",
    bankData.agencia ? `Ag. ${bankData.agencia}` : "",
    bankData.contaCorrente ? `Conta ${bankData.contaCorrente}` : "",
  ].filter(Boolean).join(" · ");

  return [account, bankData.chavePix ? `PIX: ${bankData.chavePix}` : ""].filter(Boolean).join(" — ") || "Não informado";
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando cliente">
      <div className="h-5 w-40 animate-pulse rounded bg-[#e9e2eb]" />
      <div className="h-52 animate-pulse rounded-3xl bg-[#e9e2eb]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-[#e9e2eb]" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {[1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-[#e9e2eb]" />)}
      </div>
    </div>
  );
}
