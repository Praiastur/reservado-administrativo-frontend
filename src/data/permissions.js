export const permissionGroups = [
  {
    id: "usuarios",
    nome: "Usuários",
    descricao: "Controle dos usuários que acessam o sistema.",
    permissoes: [
      {
        id: 1,
        codigo: "USUARIOS_VISUALIZAR",
        nome: "Visualizar usuários",
        descricao: "Permite consultar usuários e seus dados.",
      },
      {
        id: 2,
        codigo: "USUARIOS_CRIAR",
        nome: "Criar usuários",
        descricao: "Permite cadastrar novos usuários.",
      },
      {
        id: 3,
        codigo: "USUARIOS_EDITAR",
        nome: "Editar usuários",
        descricao: "Permite alterar dados e acessos dos usuários.",
      },
      {
        id: 4,
        codigo: "USUARIOS_EXCLUIR",
        nome: "Excluir usuários",
        descricao: "Permite excluir ou inativar usuários.",
      },
    ],
  },
  {
    id: "perfis",
    nome: "Perfis e permissões",
    descricao: "Administração dos níveis de acesso do sistema.",
    permissoes: [
      {
        id: 5,
        codigo: "PERFIS_VISUALIZAR",
        nome: "Visualizar perfis",
        descricao: "Permite consultar perfis e permissões.",
      },
      {
        id: 6,
        codigo: "PERFIS_CRIAR",
        nome: "Criar perfis",
        descricao: "Permite criar novos perfis de acesso.",
      },
      {
        id: 7,
        codigo: "PERFIS_EDITAR",
        nome: "Editar perfis",
        descricao: "Permite alterar perfis existentes.",
      },
      {
        id: 8,
        codigo: "PERFIS_EXCLUIR",
        nome: "Excluir perfis",
        descricao: "Permite excluir ou inativar perfis.",
      },
    ],
  },
  {
    id: "clientes",
    nome: "Clientes",
    descricao: "Permissões relacionadas aos cadastros de clientes.",
    permissoes: [
      {
        id: 9,
        codigo: "CLIENTES_VISUALIZAR",
        nome: "Visualizar clientes",
        descricao: "Permite consultar clientes cadastrados.",
      },
      {
        id: 10,
        codigo: "CLIENTES_CRIAR",
        nome: "Criar clientes",
        descricao: "Permite cadastrar novos clientes.",
      },
      {
        id: 11,
        codigo: "CLIENTES_EDITAR",
        nome: "Editar clientes",
        descricao: "Permite atualizar os dados dos clientes.",
      },
      {
        id: 12,
        codigo: "CLIENTES_EXCLUIR",
        nome: "Excluir clientes",
        descricao: "Permite excluir ou inativar clientes.",
      },
    ],
  },
  {
    id: "vendedores",
    nome: "Vendedores",
    descricao: "Gestão dos vendedores e equipes comerciais.",
    permissoes: [
      {
        id: 13,
        codigo: "VENDEDORES_VISUALIZAR",
        nome: "Visualizar vendedores",
        descricao: "Permite consultar vendedores e equipes.",
      },
      {
        id: 14,
        codigo: "VENDEDORES_CRIAR",
        nome: "Criar vendedores",
        descricao: "Permite cadastrar novos vendedores.",
      },
      {
        id: 15,
        codigo: "VENDEDORES_EDITAR",
        nome: "Editar vendedores",
        descricao: "Permite atualizar vendedores e equipes.",
      },
      {
        id: 16,
        codigo: "VENDEDORES_EXCLUIR",
        nome: "Excluir vendedores",
        descricao: "Permite excluir ou inativar vendedores.",
      },
    ],
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    descricao: "Acesso às informações e operações financeiras.",
    permissoes: [
      {
        id: 17,
        codigo: "FINANCEIRO_VISUALIZAR",
        nome: "Visualizar financeiro",
        descricao: "Permite consultar informações financeiras.",
      },
      {
        id: 18,
        codigo: "FINANCEIRO_EDITAR",
        nome: "Editar financeiro",
        descricao: "Permite realizar alterações financeiras.",
      },
    ],
  },
  {
    id: "integracoes",
    nome: "Integrações",
    descricao: "Controle das integrações com outros sistemas.",
    permissoes: [
      {
        id: 19,
        codigo: "INTEGRACOES_VISUALIZAR",
        nome: "Visualizar integrações",
        descricao: "Permite consultar integrações e sincronizações.",
      },
      {
        id: 20,
        codigo: "INTEGRACOES_EXECUTAR",
        nome: "Executar integrações",
        descricao: "Permite iniciar sincronizações manualmente.",
      },
    ],
  },
  {
    id: "sistema",
    nome: "Sistema",
    descricao: "Configurações e registros administrativos.",
    permissoes: [
      {
        id: 21,
        codigo: "CONFIGURACOES_EDITAR",
        nome: "Editar configurações",
        descricao: "Permite modificar configurações gerais.",
      },
      {
        id: 22,
        codigo: "AUDITORIA_VISUALIZAR",
        nome: "Visualizar auditoria",
        descricao: "Permite consultar os registros de auditoria.",
      },
    ],
  },
];

export const allPermissions = permissionGroups.flatMap(
  (group) => group.permissoes,
);