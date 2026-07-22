import {
  Check,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

function sameId(firstId, secondId) {
  if (firstId === null || firstId === undefined) {
    return false;
  }

  if (secondId === null || secondId === undefined) {
    return false;
  }

  return String(firstId) === String(secondId);
}

function getPermissionCount(profile) {
  if (Number.isFinite(profile?.quantidadePermissoes)) {
    return profile.quantidadePermissoes;
  }

  return Array.isArray(profile?.permissoesIds)
    ? profile.permissoesIds.length
    : 0;
}

export function ProfileSelector({
  profiles,
  selectedIds,
  onToggle,
  error,
}) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d7ccd9] bg-[#faf8fb] px-5 py-10 text-center">
        <ShieldCheck
          size={28}
          className="mx-auto text-[#7b428a]"
        />

        <p className="mt-4 text-sm font-bold text-[#433748]">
          Nenhum perfil disponível
        </p>

        <p className="mt-2 text-xs leading-5 text-[#8a808e]">
          Crie um perfil antes de definir o acesso deste usuário.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {profiles.map((profile) => {
          const selected = selectedIds.some((selectedId) =>
            sameId(selectedId, profile.id),
          );
          const permissionCount = getPermissionCount(profile);

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onToggle(profile.id)}
              className={[
                "relative rounded-2xl border p-4 text-left transition",
                selected
                  ? "border-[#432059] bg-[#f8f3f9] ring-2 ring-[#432059]/10"
                  : "border-[#e3dce6] bg-white hover:border-[#c6b6cc] hover:bg-[#fcfafc]",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    selected
                      ? "bg-[#432059] text-white"
                      : "bg-[#f0e8f3] text-[#633274]",
                  ].join(" ")}
                >
                  <ShieldCheck size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#3b313e]">
                        {profile.nome}
                      </p>

                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#875492]">
                        {profile.codigo}
                      </p>
                    </div>

                    <span
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        selected
                          ? "border-[#432059] bg-[#432059] text-white"
                          : "border-[#cfc5d2] bg-white text-transparent",
                      ].join(" ")}
                    >
                      <Check size={14} />
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#8a808e]">
                    {profile.descricao}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#817688]">
                    <UsersRound size={14} />
                    {permissionCount} permissões
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
