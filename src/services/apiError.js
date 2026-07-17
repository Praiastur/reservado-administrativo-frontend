export function getApiErrorMessage(
  error,
  fallbackMessage = "Não foi possível concluir a operação.",
) {
  if (error?.name === "PartialSuccessError") {
    return error.message;
  }

  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  const backendMessage =
    responseData?.detail ||
    responseData?.message ||
    responseData?.title;

  if (backendMessage) {
    return backendMessage;
  }

  if (error?.code === "ECONNABORTED") {
    return "O servidor demorou mais que o esperado para responder.";
  }

  if (!error?.response) {
    return "Não foi possível estabelecer comunicação com o servidor.";
  }

  switch (error.response.status) {
    case 400:
      return "Confira os dados informados e tente novamente.";

    case 401:
      return "Sua sessão não é válida ou expirou.";

    case 403:
      return "Você não possui permissão para realizar esta operação.";

    case 404:
      return "O recurso solicitado não foi encontrado.";

    case 409:
      return "Já existe um registro com essas informações.";

    case 500:
      return "O servidor encontrou um erro ao processar a solicitação.";

    default:
      return fallbackMessage;
  }
}