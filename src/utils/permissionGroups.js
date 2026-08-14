const MODULE_METADATA = {
  USUARIOS: {
    nome: "Usuários",
    descricao: "Controle dos usuários que acessam o sistema.",
  },
  PERFIS: {
    nome: "Perfis e permissões",
    descricao: "Administração dos níveis de acesso do sistema.",
  },
  CLIENTES: {
    nome: "Clientes",
    descricao: "Permissões relacionadas aos cadastros de clientes.",
  },
  DEPENDENTES: {
    nome: "Dependentes",
    descricao: "Operações relacionadas aos dependentes dos clientes.",
  },
  ASSOCIADOS: {
    nome: "Associados",
    descricao: "Operações relacionadas aos associados.",
  },
  VENDEDORES: {
    nome: "Vendedores",
    descricao: "Gestão dos vendedores e equipes comerciais.",
  },
  FINANCEIRO: {
    nome: "Financeiro",
    descricao: "Acesso às informações e operações financeiras.",
  },
  INTEGRACOES: {
    nome: "Integrações",
    descricao: "Controle das integrações com outros sistemas.",
  },
  CONFIGURACOES: {
    nome: "Configurações",
    descricao: "Configurações administrativas do sistema.",
  },
  AUDITORIA: {
    nome: "Auditoria",
    descricao: "Consulta dos registros de auditoria.",
  },
};

function normalizeModule(permission = {}) {
  const informedModule = String(
    permission.modulo ?? "",
  )
    .trim()
    .toUpperCase();

  if (informedModule) {
    return informedModule;
  }

  return String(permission.codigo ?? "")
    .trim()
    .toUpperCase()
    .split("_")[0] || "OUTROS";
}

function formatModuleName(moduleCode) {
  return moduleCode
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (letter) =>
      letter.toUpperCase(),
    );
}

export function createPermissionGroups(
  permissions = [],
) {
  const groups = new Map();

  permissions.forEach((permission) => {
    const moduleCode = normalizeModule(permission);
    const metadata = MODULE_METADATA[moduleCode] ?? {
      nome: formatModuleName(moduleCode),
      descricao:
        "Permissões disponíveis para este módulo.",
    };

    if (!groups.has(moduleCode)) {
      groups.set(moduleCode, {
        id: moduleCode.toLowerCase(),
        codigo: moduleCode,
        nome: metadata.nome,
        descricao: metadata.descricao,
        permissoes: [],
      });
    }

    groups.get(moduleCode).permissoes.push(permission);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      permissoes: [...group.permissoes].sort(
        (firstPermission, secondPermission) =>
          String(firstPermission.nome).localeCompare(
            String(secondPermission.nome),
            "pt-BR",
          ),
      ),
    }))
    .sort((firstGroup, secondGroup) =>
      firstGroup.nome.localeCompare(
        secondGroup.nome,
        "pt-BR",
      ),
    );
}
