// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// function parseBoolean(value, fallback) {
//   if (value === undefined || value === null || value === "") {
//     return fallback;
//   }

//   return String(value).trim().toLowerCase() === "true";
// }

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), "");

//   const proxyTarget =
//     env.VITE_API_PROXY_TARGET ||
//     "https://api.praiastur.com";

//   const proxyPrefix =
//     env.VITE_API_PROXY_PREFIX ?? "";

//   const proxySecure = parseBoolean(
//     env.VITE_API_PROXY_SECURE,
//     !proxyTarget.includes("localhost"),
//   );

//   return {
//     plugins: [react(), tailwindcss()],

//     server: {
//       proxy: {
//         "/gateway": {
//           target: proxyTarget,
//           changeOrigin: true,
//           secure: proxySecure,

//           rewrite: (path) =>
//             `${proxyPrefix}${path.replace(/^\/gateway/, "")}`,
//         },
//       },
//     },
//   };
// });


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      "/gateway": {
        target: "https://api.praiastur.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(/^\/gateway/, ""),
      },
    },
  },
});