import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  Filter,
  KeyRound,
  Layers3,
  Plus,
  Search,
  ShieldCheck,
  ShieldPlus,
  UsersRound,
  X,
} from "lucide-react";

import { Modal } from "../../components/ui/Modal";
import {
  allPermissions,
  permissionGroups,
} from "../../data/permissions";

import { useAccessManagement } from "../../contexts/AccessManagementContext";

const initialForm = {
  nome: "",
  codigo: "",
  descricao: "",
  permissoesIds: [],
};

function normalizeCode(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getProfilePermissionIds(profile) {
  return Array.isArray(profile?.permissoesIds)
    ? profile.permissoesIds
    : [];
}

function getProfilePermissionCount(profile) {
  const permissionIds = getProfilePermissionIds(profile);

  if (permissionIds.length > 0) {
    return permissionIds.length;
  }

  const permissionCount = Number(profile?.quantidadePermissoes);

  return Number.isFinite(permissionCount) ? permissionCount : 0;
}

function ProfileStatus({ ativo }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1",
        "text-xs font-bold",
        ativo
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          ativo ? "bg-emerald-500" : "bg-slate-400",
        ].join(" ")}
      />

      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

function FormField({
  id,
  label,
  error,
  helpText,
  className = "",
  ...inputProps
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-[#3b323e]"
      >
        {label}
      </label>

      <input
        id={id}
        className={[
          "h-12 w-full rounded-xl border bg-white px-4 text-sm",
          "text-[#2f2732] outline-none transition",
          "placeholder:text-[#aaa1ae]",
          "focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10",
          error ? "border-red-400" : "border-[#ded8e2]",
        ].join(" ")}
        aria-invalid={Boolean(error)}
        {...inputProps}
      />

      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>
      ) : (
        helpText && (
          <p className="mt-1.5 text-xs leading-5 text-[#918795]">
            {helpText}
          </p>
        )
      )}
    </div>
  );
}

export function ProfilesPage() {
  const {
    profiles,
    isLoading,
    isSaving,
    loadError,
    createProfile,
    getProfileUserCount,
  } = useAccessManagement();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const selectedProfilePermissionIds = selectedProfile
    ? getProfilePermissionIds(selectedProfile)
    : [];

  const statistics = useMemo(() => {
    const activeProfiles = profiles.filter((profile) => profile.ativo);
    const linkedUsers = profiles.reduce(
      (total, profile) =>
        total + getProfileUserCount(profile.id),
      0,
    );

    return {
      total: profiles.length,
      ativos: activeProfiles.length,
      usuariosVinculados: linkedUsers,
      permissoesDisponiveis: allPermissions.length,
    };
  }, [profiles, getProfileUserCount]);

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const profileName = String(profile.nome ?? "").toLowerCase();
      const profileCode = String(profile.codigo ?? "").toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        profileName.includes(normalizedSearch) ||
        profileCode.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "TODOS" ||
        (statusFilter === "ATIVO" && profile.ativo) ||
        (statusFilter === "INATIVO" && !profile.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [profiles, search, statusFilter]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: name === "codigo" ? normalizeCode(value) : value,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
      submit: "",
    }));
  }

  function handlePermissionToggle(permissionId) {
    setForm((currentForm) => {
      const alreadySelected =
        currentForm.permissoesIds.includes(permissionId);

      return {
        ...currentForm,
        permissoesIds: alreadySelected
          ? currentForm.permissoesIds.filter(
            (currentId) => currentId !== permissionId,
          )
          : [...currentForm.permissoesIds, permissionId],
      };
    });

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      permissoesIds: "",
      submit: "",
    }));
  }

  function handleGroupToggle(group) {
    const groupPermissionIds = group.permissoes.map(
      (permission) => permission.id,
    );

    const allGroupSelected = groupPermissionIds.every((permissionId) =>
      form.permissoesIds.includes(permissionId),
    );

    setForm((currentForm) => {
      if (allGroupSelected) {
        return {
          ...currentForm,
          permissoesIds: currentForm.permissoesIds.filter(
            (permissionId) =>
              !groupPermissionIds.includes(permissionId),
          ),
        };
      }

      return {
        ...currentForm,
        permissoesIds: Array.from(
          new Set([
            ...currentForm.permissoesIds,
            ...groupPermissionIds,
          ]),
        ),
      };
    });

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      permissoesIds: "",
      submit: "",
    }));
  }

  function validateForm() {
    const errors = {};
    const normalizedName = form.nome.trim();
    const normalizedCode = form.codigo.trim();

    if (!normalizedName) {
      errors.nome = "Informe o nome do perfil.";
    } else if (normalizedName.length < 3) {
      errors.nome = "O nome deve possuir pelo menos 3 caracteres.";
    }

    if (!normalizedCode) {
      errors.codigo = "Informe o código do perfil.";
    } else if (!/^[A-Z0-9_]+$/.test(normalizedCode)) {
      errors.codigo =
        "Utilize apenas letras, números e underline.";
    } else if (
      profiles.some(
        (profile) =>
          profile.codigo.toUpperCase() === normalizedCode.toUpperCase(),
      )
    ) {
      errors.codigo = "Já existe um perfil com este código.";
    }

    if (!form.descricao.trim()) {
      errors.descricao = "Informe uma descrição para o perfil.";
    }

    if (form.permissoesIds.length === 0) {
      errors.permissoesIds =
        "Selecione pelo menos uma permissão.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleCreateProfile(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const newProfile = await createProfile({
        codigo: form.codigo,
        nome: form.nome,
        descricao: form.descricao,
        permissoesIds: form.permissoesIds,
      });

      setSuccessMessage(
        `O perfil ${newProfile.nome} foi criado com sucesso.`,
      );

      closeCreateModal();
      setSearch("");
      setStatusFilter("TODOS");
    } catch (error) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        submit:
          error.message ||
          "Não foi possível criar o perfil.",
      }));
    }
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setForm(initialForm);
    setFormErrors({});
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("TODOS");
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-bold text-red-700">
            Não foi possível carregar os perfis
          </p>

          <p className="mt-1 text-sm leading-6 text-red-600">
            {loadError}
          </p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800 sm:px-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="text-sm font-bold">
                Perfil cadastrado
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                {successMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-emerald-100"
            aria-label="Fechar mensagem"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#754286]">
            Controle de acesso
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#2d2530]">
            Perfis e permissões
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817688]">
            Organize as responsabilidades dos usuários definindo quais áreas
            e operações cada perfil poderá acessar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          disabled={isLoading || isSaving}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(67,32,89,0.2)] transition hover:-translate-y-0.5 hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <ShieldPlus size={19} />
          Novo perfil
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard
          label="Total de perfis"
          value={statistics.total}
          icon={Layers3}
          iconClassName="bg-[#f0e8f3] text-[#432059]"
        />

        <StatisticCard
          label="Perfis ativos"
          value={statistics.ativos}
          icon={CheckCircle2}
          iconClassName="bg-emerald-50 text-emerald-700"
        />

        <StatisticCard
          label="Usuários vinculados"
          value={statistics.usuariosVinculados}
          icon={UsersRound}
          iconClassName="bg-blue-50 text-blue-700"
        />

        <StatisticCard
          label="Permissões disponíveis"
          value={statistics.permissoesDisponiveis}
          icon={KeyRound}
          iconClassName="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="rounded-2xl border border-[#e7e1e9] bg-white p-4 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958b99]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome ou código..."
              className="h-12 w-full rounded-xl border border-[#ded8e2] bg-white pl-11 pr-4 text-sm text-[#312934] outline-none transition placeholder:text-[#a59ca9] focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10"
            />
          </div>

          <div className="relative lg:w-56">
            <Filter
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958b99]"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-[#ded8e2] bg-white pl-11 pr-10 text-sm font-semibold text-[#4d4351] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10"
            >
              <option value="TODOS">Todos os status</option>
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#958b99]"
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-2xl border border-[#e7e1e9] bg-white px-5 py-12 text-center shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e7dfea] border-t-[#432059]" />

          <p className="mt-4 text-sm font-semibold text-[#817688]">
            Carregando perfis e permissões...
          </p>
        </section>
      ) : filteredProfiles.length > 0 ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              quantidadeUsuarios={getProfileUserCount(profile.id)}
              onView={() => setSelectedProfile(profile)}
            />
          ))}
        </section>
      ) : !loadError ? (
        <section className="rounded-2xl border border-[#e7e1e9] bg-white px-5 py-16 text-center shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2edf4] text-[#623173]">
            <Search size={24} />
          </div>

          <h3 className="mt-5 text-lg font-bold text-[#342b37]">
            Nenhum perfil encontrado
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#897f8d]">
            Não encontramos perfis correspondentes aos filtros selecionados.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 text-sm font-bold text-[#5d276d] hover:underline"
          >
            Limpar pesquisa e filtros
          </button>
        </section>
      ) : null}

      <Modal
        open={createModalOpen}
        onClose={isSaving ? () => {} : closeCreateModal}
        title="Criar novo perfil"
        description="Defina as informações do perfil e selecione as permissões que serão concedidas."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateProfile} noValidate>
          <div className="space-y-7 px-5 py-6 sm:px-6">
            <section className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="nome"
                name="nome"
                label="Nome do perfil"
                value={form.nome}
                onChange={handleFormChange}
                placeholder="Ex.: Supervisor comercial"
                error={formErrors.nome}
              />

              <FormField
                id="codigo"
                name="codigo"
                label="Código interno"
                value={form.codigo}
                onChange={handleFormChange}
                placeholder="SUPERVISOR_COMERCIAL"
                helpText="O código será utilizado internamente pelo sistema."
                error={formErrors.codigo}
              />

              <div className="sm:col-span-2">
                <label
                  htmlFor="descricao"
                  className="mb-2 block text-sm font-bold text-[#3b323e]"
                >
                  Descrição
                </label>

                <textarea
                  id="descricao"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleFormChange}
                  placeholder="Descreva a finalidade deste perfil..."
                  rows={3}
                  className={[
                    "w-full resize-none rounded-xl border bg-white px-4 py-3",
                    "text-sm leading-6 text-[#2f2732] outline-none transition",
                    "placeholder:text-[#aaa1ae]",
                    "focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10",
                    formErrors.descricao
                      ? "border-red-400"
                      : "border-[#ded8e2]",
                  ].join(" ")}
                />

                {formErrors.descricao && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">
                    {formErrors.descricao}
                  </p>
                )}
              </div>
            </section>

            <section>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold text-[#3b323e]">
                    Permissões do perfil
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#918795]">
                    Selecione as operações que os usuários deste perfil poderão
                    realizar.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-[#f1eaf4] px-3 py-1.5 text-xs font-bold text-[#603071]">
                  {form.permissoesIds.length} selecionadas
                </span>
              </div>

              {formErrors.permissoesIds && (
                <p className="mt-3 text-xs font-semibold text-red-600">
                  {formErrors.permissoesIds}
                </p>
              )}

              <div className="mt-4 space-y-4">
                {permissionGroups.map((group) => (
                  <PermissionGroup
                    key={group.id}
                    group={group}
                    selectedPermissions={form.permissoesIds}
                    onPermissionToggle={handlePermissionToggle}
                    onGroupToggle={() => handleGroupToggle(group)}
                  />
                ))}
              </div>
            </section>
          </div>

          {formErrors.submit && (
            <div className="mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700 sm:mx-6">
              {formErrors.submit}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={isSaving}
              className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                "Criando perfil..."
              ) : (
                <>
                  <Plus size={18} />
                  Criar perfil
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedProfile)}
        onClose={() => setSelectedProfile(null)}
        title="Detalhes do perfil"
        description="Informações gerais e permissões concedidas."
        maxWidth="max-w-3xl"
      >
        {selectedProfile && (
          <>
            <div className="space-y-6 px-5 py-6 sm:px-6">
              <section className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#432059] text-white">
                  <ShieldCheck size={26} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-[#312934]">
                      {selectedProfile.nome}
                    </h3>

                    <ProfileStatus ativo={selectedProfile.ativo} />
                  </div>

                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7b428a]">
                    {selectedProfile.codigo}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[#817688]">
                    {selectedProfile.descricao}
                  </p>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <DetailCard
                  icon={KeyRound}
                  label="Permissões"
                  value={`${getProfilePermissionCount(selectedProfile)} concedidas`}
                />

                <DetailCard
                  icon={UsersRound}
                  label="Usuários vinculados"
                  value={`${getProfileUserCount(selectedProfile.id)} usuários`}
                />
              </section>

              <section>
                <h4 className="text-sm font-bold text-[#3b323e]">
                  Permissões concedidas
                </h4>

                {selectedProfilePermissionIds.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {permissionGroups.map((group) => {
                      const selectedGroupPermissions =
                        group.permissoes.filter((permission) =>
                          selectedProfilePermissionIds.includes(
                            permission.id,
                          ),
                        );

                      if (selectedGroupPermissions.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={group.id}
                          className="rounded-2xl border border-[#e9e3eb] bg-[#fcfafc] p-4"
                        >
                          <p className="text-sm font-bold text-[#443849]">
                            {group.nome}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedGroupPermissions.map((permission) => (
                              <span
                                key={permission.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#efe7f2] px-2.5 py-1.5 text-xs font-bold text-[#633274]"
                              >
                                <Check size={14} />
                                {permission.nome}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold text-amber-800">
                      Detalhamento indisponível
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      A API informou a quantidade de permissões, mas ainda não
                      devolveu os identificadores necessários para listar cada
                      permissão deste perfil.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <div className="flex justify-end border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
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

function PermissionGroup({
  group,
  selectedPermissions,
  onPermissionToggle,
  onGroupToggle,
}) {
  const selectedCount = group.permissoes.filter((permission) =>
    selectedPermissions.includes(permission.id),
  ).length;

  const allSelected = selectedCount === group.permissoes.length;
  const partiallySelected =
    selectedCount > 0 && selectedCount < group.permissoes.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e6dfe8]">
      <header className="flex flex-col justify-between gap-3 bg-[#faf8fb] px-4 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-[#403544]">
            {group.nome}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#918795]">
            {group.descricao}
          </p>
        </div>

        <button
          type="button"
          onClick={onGroupToggle}
          className={[
            "inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-xl border px-3",
            "text-xs font-bold transition",
            allSelected
              ? "border-[#432059] bg-[#432059] text-white"
              : partiallySelected
                ? "border-[#bca5c5] bg-[#f3edf5] text-[#5d276d]"
                : "border-[#dcd4df] bg-white text-[#675d6b] hover:border-[#bca5c5]",
          ].join(" ")}
        >
          <span
            className={[
              "flex h-4 w-4 items-center justify-center rounded",
              allSelected
                ? "bg-white text-[#432059]"
                : partiallySelected
                  ? "bg-[#5d276d] text-white"
                  : "border border-[#bfb5c2]",
            ].join(" ")}
          >
            {(allSelected || partiallySelected) && <Check size={12} />}
          </span>

          {allSelected ? "Remover grupo" : "Selecionar grupo"}
        </button>
      </header>

      <div className="grid gap-px bg-[#eee9f0] sm:grid-cols-2">
        {group.permissoes.map((permission) => {
          const selected = selectedPermissions.includes(permission.id);

          return (
            <button
              key={permission.id}
              type="button"
              onClick={() => onPermissionToggle(permission.id)}
              className={[
                "flex items-start gap-3 bg-white p-4 text-left transition",
                "hover:bg-[#fcfafc]",
                selected ? "bg-[#fbf8fc]" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                  selected
                    ? "border-[#432059] bg-[#432059] text-white"
                    : "border-[#cfc5d2] bg-white text-transparent",
                ].join(" ")}
              >
                <Check size={14} />
              </span>

              <span>
                <span className="block text-sm font-bold text-[#443849]">
                  {permission.nome}
                </span>

                <span className="mt-1 block text-xs leading-5 text-[#918795]">
                  {permission.descricao}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function ProfileCard({ profile, quantidadeUsuarios, onView }) {
  return (
    <article className="flex flex-col rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(56,32,65,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#efe7f2] text-[#5d276d]">
            <ShieldCheck size={23} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-[#342b37]">
              {profile.nome}
            </h3>

            <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-[0.13em] text-[#875492]">
              {profile.codigo}
            </p>
          </div>
        </div>

        <ProfileStatus ativo={profile.ativo} />
      </div>

      <p className="mt-5 flex-1 text-sm leading-6 text-[#817688]">
        {profile.descricao}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#faf8fb] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">
            Permissões
          </p>

          <p className="mt-1.5 text-sm font-bold text-[#4b404f]">
            {getProfilePermissionCount(profile)}
          </p>
        </div>

        <div className="rounded-xl bg-[#faf8fb] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">
            Usuários
          </p>

          <p className="mt-1.5 text-sm font-bold text-[#4b404f]">
            {quantidadeUsuarios}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#ded7e1] text-xs font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f3f9]"
      >
        <Eye size={17} />
        Visualizar perfil
      </button>
    </article>
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

      <p className="mt-4 text-sm font-semibold text-[#817688]">
        {label}
      </p>
    </article>
  );
}

function DetailCard({ icon: Icon, label, value }) {
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
    </div>
  );
}