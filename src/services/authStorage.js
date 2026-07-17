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