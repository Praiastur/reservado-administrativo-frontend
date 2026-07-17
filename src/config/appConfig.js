export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL || "/gateway",

  useMockApi:
    String(import.meta.env.VITE_USE_MOCK_API).toLowerCase() !== "false",
};