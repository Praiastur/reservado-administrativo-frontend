import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).trim().toLowerCase() === "true";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const proxyTarget =
    env.VITE_API_PROXY_TARGET ||
    "https://api.praiastur.com";

  const proxyPrefix =
    env.VITE_API_PROXY_PREFIX ?? "";

  const proxySecure = parseBoolean(
    env.VITE_API_PROXY_SECURE,
    !proxyTarget.includes("localhost"),
  );

  return {
    plugins: [react(), tailwindcss()],

    // server: {
    //   proxy: {
    //     "/gateway": {
    //       target: proxyTarget,
    //       changeOrigin: true,
    //       secure: proxySecure,
    //       rewrite: (path) =>
    //         `${proxyPrefix}${path.replace(/^\/gateway/, "")}`,
    //     },
    //   },
    // },

    server: {
      proxy: {
        "/gateway/clientes": {
          target: "https://localhost:7025",
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            `/api${path.replace(/^\/gateway/, "")}`,
        },

        "/gateway/contratos": {
          target: "https://localhost:7084",
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            `/api${path.replace(/^\/gateway/, "")}`,
        },

        "/gateway/anuidades": {
          target: "https://localhost:7084",
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            `/api${path.replace(/^\/gateway/, "")}`,
        },

        "/gateway/contas-receber": {
          target: "https://localhost:7084",
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            `/api${path.replace(/^\/gateway/, "")}`,
        },

        "/gateway": {
          target: "https://localhost:7292",
          changeOrigin: true,
          secure: false,
          rewrite: (path) =>
            `/api${path.replace(/^\/gateway/, "")}`,
        },
      },
    },
  };
});
