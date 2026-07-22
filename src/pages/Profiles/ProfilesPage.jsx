import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  Filter,
  KeyRound,
  Layers3,
  Pencil,
  Plus,
  Power,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import {
  allPermissions as fallbackPermissions,
  permissionGroups as fallbackPermissionGroups,
} from "../../data/permissions";
import { useAccessManagement } from "../../contexts/AccessManagementContext";
import { getApiErrorMessage } from "../../services/apiError";
import { permissionsService } from "../../services/permissionsService";
import { createPermissionGroups } from "../../utils/permissionGroups";

const initialForm = {
  nome: "",
  codigo: "",
  descricao: "",
  permissoesIds: [],
};

function sameId(firstId, secondId) {
  if (firstId === null || firstId === undefined) {
    return false;
  }

  if (secondId === null || secondId === undefined) {
    return false;
  }

  return String(firstId) === String(secondId);
}

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

function isAdministratorProfile(profile) {
  return (
    String(profile?.codigo ?? "")
      .trim()
      .toUpperCase() === "ADMINISTRADOR"
  );
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

function UserStatus({ user }) {
  const status = !user.ativo
    ? {
        label: "Inativo",
        className:
          "border-slate-200 bg-slate-50 text-slate-600",
      }
    : user.bloqueado
      ? {
          label: "Bloqueado",
          className:
            "border-amber-200 bg-amber-50 text-amber-700",
        }
      : {
          label: "Ativo",
          className:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        };

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2 py-1 text-[10px] font-bold",
        status.className,
      ].join(" ")}
    >
      {status.label}
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
          "disabled:cursor-not-allowed disabled:bg-[#f5f2f6] disabled:text-[#8f8593]",
          error ? "border-red-400" : "border-[#ded8e2]",
        ].join(" ")}
        aria-invalid={Boolean(error)}
        {...inputProps}
      />

      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-600">
          {error}
        </p>
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
  const { hasPermission } = useAuth();

  const {
    profiles,
    isLoading,
    isSaving,
    loadError,
    createProfile,
    updateProfile,
    setProfileActive,
    getProfileUsers,
    getProfileUserCount,
    useMockApi,
  } = useAccessManagement();

  const canCreateProfile = hasPermission("PERFIS_CRIAR");
  const canEditProfile = hasPermission("PERFIS_EDITAR");
  const canChangeProfileStatus = hasPermission("PERFIS_EXCLUIR");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProfileId, setEditProfileId] = useState(null);
  const [statusConfirmation, setStatusConfirmation] = useState(null);

  const [createForm, setCreateForm] = useState(initialForm);
  const [createErrors, setCreateErrors] = useState({});

  const [editForm, setEditForm] = useState(initialForm);
  const [editErrors, setEditErrors] = useState({});

  const [successNotice, setSuccessNotice] = useState(null);
  const [actionError, setActionError] = useState("");

  const [availablePermissions, setAvailablePermissions] =
    useState(() =>
      useMockApi ? fallbackPermissions : [],
    );
  const [availablePermissionGroups, setAvailablePermissionGroups] =
    useState(() =>
      useMockApi ? fallbackPermissionGroups : [],
    );
  const [permissionsLoadError, setPermissionsLoadError] =
    useState("");
  const [isLoadingPermissions, setIsLoadingPermissions] =
    useState(!useMockApi);

  useEffect(() => {
    if (useMockApi) {
      setAvailablePermissions(fallbackPermissions);
      setAvailablePermissionGroups(
        fallbackPermissionGroups,
      );
      setPermissionsLoadError("");
      setIsLoadingPermissions(false);

      return undefined;
    }

    let ignoreResult = false;

    async function loadPermissions() {
      setIsLoadingPermissions(true);
      setPermissionsLoadError("");

      try {
        const result = await permissionsService.list({
          ativo: true,
        });

        if (ignoreResult) {
          return;
        }

        setAvailablePermissions(result.items);
        setAvailablePermissionGroups(
          createPermissionGroups(result.items),
        );
      } catch (error) {
        if (!ignoreResult) {
          setAvailablePermissions([]);
          setAvailablePermissionGroups([]);
          setPermissionsLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar as permissões disponíveis.",
            ),
          );
        }
      } finally {
        if (!ignoreResult) {
          setIsLoadingPermissions(false);
        }
      }
    }

    loadPermissions();

    return () => {
      ignoreResult = true;
    };
  }, [useMockApi]);

  const selectedProfile = useMemo(
    () =>
      profiles.find((profile) =>
        sameId(profile.id, selectedProfileId),
      ) ?? null,
    [profiles, selectedProfileId],
  );

  const editingProfile = useMemo(
    () =>
      profiles.find((profile) =>
        sameId(profile.id, editProfileId),
      ) ?? null,
    [profiles, editProfileId],
  );

  const confirmationProfile = useMemo(
    () =>
      profiles.find((profile) =>
        sameId(
          profile.id,
          statusConfirmation?.profileId,
        ),
      ) ?? null,
    [profiles, statusConfirmation],
  );

  const selectedProfilePermissionIds =
    getProfilePermissionIds(selectedProfile);

  const selectedProfileUsers = selectedProfile
    ? getProfileUsers(selectedProfile.id)
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
      permissoesDisponiveis: availablePermissions.length,
    };
  }, [profiles, getProfileUserCount, availablePermissions.length]);

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

  function clearMessages() {
    setActionError("");
    setSuccessNotice(null);
  }

  function handleCreateFormChange(event) {
    const { name, value } = event.target;

    setCreateForm((currentForm) => ({
      ...currentForm,
      [name]: name === "codigo" ? normalizeCode(value) : value,
    }));

    setCreateErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
      submit: "",
    }));

    clearMessages();
  }

  function handleEditFormChange(event) {
    const { name, value } = event.target;

    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setEditErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
      submit: "",
    }));

    clearMessages();
  }

  function togglePermission(
    setForm,
    setErrors,
    permissionId,
  ) {
    setForm((currentForm) => {
      const currentPermissionIds = Array.isArray(
        currentForm.permissoesIds,
      )
        ? currentForm.permissoesIds
        : [];

      const alreadySelected =
        currentPermissionIds.includes(permissionId);

      return {
        ...currentForm,
        permissoesIds: alreadySelected
          ? currentPermissionIds.filter(
              (currentId) => currentId !== permissionId,
            )
          : [...currentPermissionIds, permissionId],
      };
    });

    setErrors((currentErrors) => ({
      ...currentErrors,
      permissoesIds: "",
      submit: "",
    }));

    clearMessages();
  }

  function togglePermissionGroup(
    form,
    setForm,
    setErrors,
    group,
  ) {
    const selectedPermissions = Array.isArray(
      form.permissoesIds,
    )
      ? form.permissoesIds
      : [];

    const groupPermissionIds = group.permissoes.map(
      (permission) => permission.id,
    );

    const allGroupSelected = groupPermissionIds.every(
      (permissionId) =>
        selectedPermissions.includes(permissionId),
    );

    setForm((currentForm) => {
      const currentPermissionIds = Array.isArray(
        currentForm.permissoesIds,
      )
        ? currentForm.permissoesIds
        : [];

      if (allGroupSelected) {
        return {
          ...currentForm,
          permissoesIds: currentPermissionIds.filter(
            (permissionId) =>
              !groupPermissionIds.includes(permissionId),
          ),
        };
      }

      return {
        ...currentForm,
        permissoesIds: Array.from(
          new Set([
            ...currentPermissionIds,
            ...groupPermissionIds,
          ]),
        ),
      };
    });

    setErrors((currentErrors) => ({
      ...currentErrors,
      permissoesIds: "",
      submit: "",
    }));

    clearMessages();
  }

  function validateCreateForm() {
    const errors = {};
    const normalizedName = createForm.nome.trim();
    const normalizedCode = createForm.codigo.trim();

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
          String(profile.codigo ?? "").toUpperCase() ===
          normalizedCode.toUpperCase(),
      )
    ) {
      errors.codigo = "Já existe um perfil com este código.";
    }

    if (!createForm.descricao.trim()) {
      errors.descricao = "Informe uma descrição para o perfil.";
    }

    if (createForm.permissoesIds.length === 0) {
      errors.permissoesIds =
        "Selecione pelo menos uma permissão.";
    }

    setCreateErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function validateEditForm() {
    const errors = {};

    if (useMockApi) {
      const normalizedName = editForm.nome.trim();

      if (!normalizedName) {
        errors.nome = "Informe o nome do perfil.";
      } else if (normalizedName.length < 3) {
        errors.nome =
          "O nome deve possuir pelo menos 3 caracteres.";
      }

      if (!editForm.descricao.trim()) {
        errors.descricao =
          "Informe uma descrição para o perfil.";
      }
    }

    if (editForm.permissoesIds.length === 0) {
      errors.permissoesIds =
        "Selecione pelo menos uma permissão.";
    }

    setEditErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function openCreateModal() {
    clearMessages();

    if (
      !useMockApi &&
      availablePermissions.length === 0
    ) {
      setActionError(
        permissionsLoadError ||
        "As permissões ainda não foram carregadas. Atualize a página e tente novamente.",
      );
      return;
    }

    setCreateForm(initialForm);
    setCreateErrors({});
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setCreateForm(initialForm);
    setCreateErrors({});
  }

  function openProfileDetails(profile) {
    clearMessages();
    setSelectedProfileId(profile.id);
  }

  function closeProfileDetails() {
    setSelectedProfileId(null);
  }

  function openEditModal(profile) {
    clearMessages();

    if (!canEditProfile) {
      setActionError(
        "Seu usuário não possui permissão para editar perfis.",
      );
      return;
    }

    if (isAdministratorProfile(profile)) {
      setActionError(
        "O perfil Administrador é protegido e não pode ser alterado.",
      );
      return;
    }

    if (
      !useMockApi &&
      availablePermissions.length === 0
    ) {
      setActionError(
        permissionsLoadError ||
        "As permissões ainda não foram carregadas. Atualize a página e tente novamente.",
      );
      return;
    }

    const permissionIds = getProfilePermissionIds(profile);

    if (
      permissionIds.length === 0 &&
      getProfilePermissionCount(profile) > 0
    ) {
      setActionError(
        "A API não devolveu os identificadores das permissões deste perfil. A edição ficará disponível quando o backend retornar esses dados.",
      );
      return;
    }

    setSelectedProfileId(null);
    setEditProfileId(profile.id);
    setEditForm({
      nome: profile.nome ?? "",
      codigo: profile.codigo ?? "",
      descricao: profile.descricao ?? "",
      permissoesIds: permissionIds,
    });
    setEditErrors({});
  }

  function closeEditModal() {
    setEditProfileId(null);
    setEditForm(initialForm);
    setEditErrors({});
  }

  function requestProfileStatusChange(profile) {
    clearMessages();

    if (!canChangeProfileStatus) {
      setActionError(
        "Seu usuário não possui permissão para alterar o status de perfis.",
      );
      return;
    }

    if (isAdministratorProfile(profile)) {
      setActionError(
        "O perfil Administrador é protegido e não pode ser inativado.",
      );
      return;
    }

    const linkedUsersCount = getProfileUserCount(profile.id);

    if (profile.ativo && linkedUsersCount > 0) {
      setActionError(
        `O perfil ${profile.nome} possui ${linkedUsersCount} usuário(s) vinculado(s). Remova esses vínculos antes de inativá-lo.`,
      );
      return;
    }

    setSelectedProfileId(null);
    setStatusConfirmation({
      profileId: profile.id,
      nextActive: !profile.ativo,
    });
  }

  function closeStatusConfirmation() {
    setStatusConfirmation(null);
  }

  async function handleCreateProfile(event) {
    event.preventDefault();

    if (!validateCreateForm()) {
      return;
    }

    try {
      const newProfile = await createProfile({
        codigo: createForm.codigo,
        nome: createForm.nome,
        descricao: createForm.descricao,
        permissoesIds: createForm.permissoesIds,
      });

      setSuccessNotice({
        title: "Perfil cadastrado",
        message: `O perfil ${newProfile.nome} foi criado com sucesso.`,
      });

      closeCreateModal();
      setSearch("");
      setStatusFilter("TODOS");
    } catch (error) {
      setCreateErrors((currentErrors) => ({
        ...currentErrors,
        submit:
          error.message ||
          "Não foi possível criar o perfil.",
      }));
    }
  }

  async function handleUpdateProfile(event) {
    event.preventDefault();

    if (!editingProfile || !validateEditForm()) {
      return;
    }

    try {
      const updatedProfile = await updateProfile(
        editingProfile.id,
        {
          nome: editForm.nome,
          descricao: editForm.descricao,
          permissoesIds: editForm.permissoesIds,
        },
      );

      setSuccessNotice({
        title: "Perfil atualizado",
        message: `O perfil ${updatedProfile.nome} foi atualizado com sucesso.`,
      });

      closeEditModal();
      setSelectedProfileId(updatedProfile.id);
    } catch (error) {
      setEditErrors((currentErrors) => ({
        ...currentErrors,
        submit:
          error.message ||
          "Não foi possível atualizar o perfil.",
      }));
    }
  }

  async function handleConfirmStatusChange() {
    if (!confirmationProfile || !statusConfirmation) {
      return;
    }

    try {
      await setProfileActive(
        confirmationProfile.id,
        statusConfirmation.nextActive,
      );

      setSuccessNotice({
        title: statusConfirmation.nextActive
          ? "Perfil reativado"
          : "Perfil inativado",
        message: statusConfirmation.nextActive
          ? `O perfil ${confirmationProfile.nome} foi reativado com sucesso.`
          : `O perfil ${confirmationProfile.nome} foi inativado com sucesso.`,
      });

      const profileId = confirmationProfile.id;

      closeStatusConfirmation();
      setSelectedProfileId(profileId);
    } catch (error) {
      setActionError(
        error.message ||
          "Não foi possível alterar o status do perfil.",
      );
      closeStatusConfirmation();
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("TODOS");
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <AlertMessage
          title="Não foi possível carregar os perfis"
          message={loadError}
        />
      )}

      {permissionsLoadError && (
        <AlertMessage
          title="Não foi possível carregar as permissões"
          message={permissionsLoadError}
        />
      )}

      {actionError && (
        <AlertMessage
          title="Operação não permitida"
          message={actionError}
          onClose={() => setActionError("")}
        />
      )}

      {successNotice && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800 sm:px-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="text-sm font-bold">
                {successNotice.title}
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                {successNotice.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
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

        {canCreateProfile && (
          <button
            type="button"
            onClick={openCreateModal}
            disabled={isLoading || isSaving}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(67,32,89,0.2)] transition hover:-translate-y-0.5 hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <ShieldPlus size={19} />
            Novo perfil
          </button>
        )}
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
              onView={() => openProfileDetails(profile)}
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
          <ProfileForm
            form={createForm}
            errors={createErrors}
            onChange={handleCreateFormChange}
            onPermissionToggle={(permissionId) =>
              togglePermission(
                setCreateForm,
                setCreateErrors,
                permissionId,
              )
            }
            permissionGroups={availablePermissionGroups}
            isLoadingPermissions={isLoadingPermissions}
            onGroupToggle={(group) =>
              togglePermissionGroup(
                createForm,
                setCreateForm,
                setCreateErrors,
                group,
              )
            }
          />

          <ModalFormFooter
            onCancel={closeCreateModal}
            isSaving={isSaving}
            submitLabel="Criar perfil"
            savingLabel="Criando perfil..."
            submitIcon={Plus}
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(editingProfile)}
        onClose={isSaving ? () => {} : closeEditModal}
        title="Editar perfil"
        description={
          useMockApi
            ? "Atualize o nome, a descrição e as permissões concedidas."
            : "Atualize as permissões concedidas. Nome e descrição aguardam endpoint específico no backend."
        }
        maxWidth="max-w-4xl"
      >
        {editingProfile && (
          <form onSubmit={handleUpdateProfile} noValidate>
            <ProfileForm
              form={editForm}
              errors={editErrors}
              onChange={handleEditFormChange}
              codeReadOnly
              detailsReadOnly={!useMockApi}
              permissionGroups={availablePermissionGroups}
              isLoadingPermissions={isLoadingPermissions}
              onPermissionToggle={(permissionId) =>
                togglePermission(
                  setEditForm,
                  setEditErrors,
                  permissionId,
                )
              }
              onGroupToggle={(group) =>
                togglePermissionGroup(
                  editForm,
                  setEditForm,
                  setEditErrors,
                  group,
                )
              }
            />

            <ModalFormFooter
              onCancel={closeEditModal}
              isSaving={isSaving}
              submitLabel="Salvar alterações"
              savingLabel="Salvando alterações..."
              submitIcon={Check}
            />
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(selectedProfile)}
        onClose={closeProfileDetails}
        title="Detalhes do perfil"
        description="Informações gerais, permissões e usuários vinculados."
        maxWidth="max-w-4xl"
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

                    {isAdministratorProfile(selectedProfile) && (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                        Protegido
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7b428a]">
                    {selectedProfile.codigo}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[#817688]">
                    {selectedProfile.descricao}
                  </p>
                </div>
              </section>

              {isAdministratorProfile(selectedProfile) && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={20}
                      className="mt-0.5 shrink-0 text-violet-700"
                    />

                    <div>
                      <p className="text-sm font-bold text-violet-800">
                        Perfil essencial do sistema
                      </p>

                      <p className="mt-1 text-xs leading-5 text-violet-700">
                        O perfil Administrador não pode ser editado ou inativado,
                        evitando a perda acidental do acesso administrativo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <section className="grid gap-4 sm:grid-cols-2">
                <DetailCard
                  icon={KeyRound}
                  label="Permissões"
                  value={`${getProfilePermissionCount(selectedProfile)} concedidas`}
                />

                <DetailCard
                  icon={UsersRound}
                  label="Usuários vinculados"
                  value={`${selectedProfileUsers.length} usuários`}
                />
              </section>

              <section>
                <h4 className="text-sm font-bold text-[#3b323e]">
                  Permissões concedidas
                </h4>

                {selectedProfilePermissionIds.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {availablePermissionGroups.map((group) => {
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
                ) : getProfilePermissionCount(selectedProfile) > 0 ? (
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
                ) : (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-700">
                      Nenhuma permissão concedida
                    </p>
                  </div>
                )}
              </section>

              <section>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <h4 className="text-sm font-bold text-[#3b323e]">
                      Usuários vinculados
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-[#918795]">
                      Usuários que atualmente utilizam este perfil de acesso.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-[#f1eaf4] px-3 py-1.5 text-xs font-bold text-[#603071]">
                    {selectedProfileUsers.length} vinculados
                  </span>
                </div>

                {selectedProfileUsers.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {selectedProfileUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-start gap-3 rounded-2xl border border-[#e9e3eb] bg-[#fcfafc] p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#efe7f2] text-[#633274]">
                          <UserRound size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold text-[#443849]">
                              {user.nome}
                            </p>

                            <UserStatus user={user} />
                          </div>

                          <p className="mt-1 truncate text-xs text-[#918795]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#dcd4df] bg-[#fcfafc] p-5 text-center">
                    <UsersRound
                      size={22}
                      className="mx-auto text-[#8e8292]"
                    />

                    <p className="mt-2 text-sm font-bold text-[#5b505f]">
                      Nenhum usuário vinculado
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#918795]">
                      Este perfil pode ser inativado porque não está associado
                      a nenhum usuário.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeProfileDetails}
                className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:bg-white"
              >
                Fechar
              </button>

              {canChangeProfileStatus &&
                !isAdministratorProfile(selectedProfile) && (
                  <button
                    type="button"
                    onClick={() =>
                      requestProfileStatusChange(selectedProfile)
                    }
                    disabled={
                      isSaving ||
                      (selectedProfile.ativo &&
                        selectedProfileUsers.length > 0)
                    }
                    title={
                      selectedProfile.ativo &&
                      selectedProfileUsers.length > 0
                        ? "Remova os usuários vinculados antes de inativar."
                        : undefined
                    }
                    className={[
                      "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5",
                      "text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45",
                      selectedProfile.ativo
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                    ].join(" ")}
                  >
                    {selectedProfile.ativo ? (
                      <>
                        <Power size={18} />
                        Inativar perfil
                      </>
                    ) : (
                      <>
                        <RefreshCcw size={18} />
                        Reativar perfil
                      </>
                    )}
                  </button>
                )}

              {canEditProfile &&
                !isAdministratorProfile(selectedProfile) && (
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedProfile)}
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Pencil size={18} />
                    Editar perfil
                  </button>
                )}
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(statusConfirmation)}
        onClose={
          isSaving
            ? () => {}
            : closeStatusConfirmation
        }
        title={
          statusConfirmation?.nextActive
            ? "Reativar perfil"
            : "Inativar perfil"
        }
        description="Confirme a alteração do status deste perfil de acesso."
        maxWidth="max-w-lg"
      >
        {confirmationProfile && statusConfirmation && (
          <>
            <div className="px-5 py-6 sm:px-6">
              <div
                className={[
                  "flex items-start gap-4 rounded-2xl border p-4",
                  statusConfirmation.nextActive
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50",
                ].join(" ")}
              >
                {statusConfirmation.nextActive ? (
                  <RefreshCcw
                    size={22}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                ) : (
                  <AlertTriangle
                    size={22}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />
                )}

                <div>
                  <p
                    className={[
                      "font-bold",
                      statusConfirmation.nextActive
                        ? "text-emerald-800"
                        : "text-amber-800",
                    ].join(" ")}
                  >
                    {statusConfirmation.nextActive
                      ? `Reativar ${confirmationProfile.nome}?`
                      : `Inativar ${confirmationProfile.nome}?`}
                  </p>

                  <p
                    className={[
                      "mt-2 text-sm leading-6",
                      statusConfirmation.nextActive
                        ? "text-emerald-700"
                        : "text-amber-700",
                    ].join(" ")}
                  >
                    {statusConfirmation.nextActive
                      ? "O perfil voltará a ficar disponível para novos vínculos e operações administrativas."
                      : "O perfil deixará de ficar disponível para novos vínculos. O histórico continuará preservado."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeStatusConfirmation}
                disabled={isSaving}
                className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isSaving}
                className={[
                  "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5",
                  "text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                  statusConfirmation.nextActive
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700",
                ].join(" ")}
              >
                {isSaving
                  ? "Salvando..."
                  : statusConfirmation.nextActive
                    ? "Confirmar reativação"
                    : "Confirmar inativação"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function AlertMessage({
  title,
  message,
  onClose,
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0 text-red-700"
        />

        <div>
          <p className="text-sm font-bold text-red-700">
            {title}
          </p>

          <p className="mt-1 text-sm leading-6 text-red-600">
            {message}
          </p>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-700 transition hover:bg-red-100"
          aria-label="Fechar mensagem"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

function ProfileForm({
  form,
  errors,
  onChange,
  onPermissionToggle,
  onGroupToggle,
  permissionGroups,
  isLoadingPermissions = false,
  codeReadOnly = false,
  detailsReadOnly = false,
}) {
  return (
    <div className="space-y-7 px-5 py-6 sm:px-6">
      <section className="grid gap-5 sm:grid-cols-2">
        <FormField
          id={codeReadOnly ? "edit-nome" : "nome"}
          name="nome"
          label="Nome do perfil"
          value={form.nome}
          onChange={onChange}
          placeholder="Ex.: Supervisor comercial"
          error={errors.nome}
          disabled={detailsReadOnly}
          helpText={
            detailsReadOnly
              ? "A edição do nome aguarda um endpoint específico no backend."
              : undefined
          }
        />

        <FormField
          id={codeReadOnly ? "edit-codigo" : "codigo"}
          name="codigo"
          label="Código interno"
          value={form.codigo}
          onChange={onChange}
          placeholder="SUPERVISOR_COMERCIAL"
          helpText={
            codeReadOnly
              ? "O código é permanente e não pode ser alterado."
              : "O código será utilizado internamente pelo sistema."
          }
          error={errors.codigo}
          disabled={codeReadOnly}
        />

        <div className="sm:col-span-2">
          <label
            htmlFor={
              codeReadOnly
                ? "edit-descricao"
                : "descricao"
            }
            className="mb-2 block text-sm font-bold text-[#3b323e]"
          >
            Descrição
          </label>

          <textarea
            id={
              codeReadOnly
                ? "edit-descricao"
                : "descricao"
            }
            name="descricao"
            value={form.descricao}
            onChange={onChange}
            placeholder="Descreva a finalidade deste perfil..."
            rows={3}
            disabled={detailsReadOnly}
            className={[
              "w-full resize-none rounded-xl border bg-white px-4 py-3",
              "text-sm leading-6 text-[#2f2732] outline-none transition",
              "placeholder:text-[#aaa1ae]",
              "focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10",
              "disabled:cursor-not-allowed disabled:bg-[#f5f2f6] disabled:text-[#8f8593]",
              errors.descricao
                ? "border-red-400"
                : "border-[#ded8e2]",
            ].join(" ")}
          />

          {errors.descricao && (
            <p className="mt-1.5 text-xs font-semibold text-red-600">
              {errors.descricao}
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

        {errors.permissoesIds && (
          <p className="mt-3 text-xs font-semibold text-red-600">
            {errors.permissoesIds}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {isLoadingPermissions ? (
            <div className="rounded-2xl border border-[#e6dfe8] bg-[#faf8fb] px-4 py-6 text-center text-sm font-semibold text-[#766b7a]">
              Carregando permissões...
            </div>
          ) : permissionGroups.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm font-semibold text-amber-800">
              Nenhuma permissão disponível foi retornada pela API.
            </div>
          ) : (
            permissionGroups.map((group) => (
              <PermissionGroup
                key={group.id}
                group={group}
                selectedPermissions={form.permissoesIds}
                onPermissionToggle={onPermissionToggle}
                onGroupToggle={() => onGroupToggle(group)}
              />
            ))
          )}
        </div>
      </section>

      {errors.submit && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
          {errors.submit}
        </div>
      )}
    </div>
  );
}

function ModalFormFooter({
  onCancel,
  isSaving,
  submitLabel,
  savingLabel,
  submitIcon: SubmitIcon,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      <button
        type="button"
        onClick={onCancel}
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
          savingLabel
        ) : (
          <>
            <SubmitIcon size={18} />
            {submitLabel}
          </>
        )}
      </button>
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

function ProfileCard({
  profile,
  quantidadeUsuarios,
  onView,
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(56,32,65,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#efe7f2] text-[#5d276d]">
            <ShieldCheck size={23} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-bold text-[#342b37]">
                {profile.nome}
              </h3>

              {isAdministratorProfile(profile) && (
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">
                  Protegido
                </span>
              )}
            </div>

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

function DetailCard({
  icon: Icon,
  label,
  value,
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
    </div>
  );
}
