const AUTH_STORAGE_KEY = "reservado_admin_auth_v1";

function readStorage(storage) {
  try {
    const storedValue = storage.getItem(AUTH_STORAGE_KEY);

    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
}

export function getStoredAuthSession() {
  return (
    readStorage(sessionStorage) ||
    readStorage(localStorage)
  );
}

export function saveAuthSession(session, remember = false) {
  clearAuthSession();

  const selectedStorage = remember
    ? localStorage
    : sessionStorage;

  selectedStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(session),
  );
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Usado depois de um refresh de token silencioso: atualiza a sessão
// mantendo o mesmo storage já escolhido no login (localStorage se
// "lembrar de mim" estava marcado, senão sessionStorage) — ao contrário
// de saveAuthSession, não limpa nem troca de storage.
export function updateStoredAuthSession(updates) {
  const isInLocalStorage = Boolean(readStorage(localStorage));
  const storage = isInLocalStorage ? localStorage : sessionStorage;
  const currentSession = readStorage(storage);

  if (!currentSession) {
    return null;
  }

  const updatedSession = { ...currentSession, ...updates };

  storage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(updatedSession),
  );

  return updatedSession;
}