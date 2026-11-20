# React + Vite

## Configuring the API

The frontend uses `VITE_API_BASE_URL` for publishing presents and loading
published presents.

- If the variable is unset or empty, requests use relative `/api` URLs. During
  local development, Vite forwards those requests to `http://localhost:8080`.
- For hosting, set `VITE_API_BASE_URL` to the backend's public base URL in the
  hosting provider's frontend build environment, then rebuild the frontend.
  Use the base origin/path only, without an `/api` suffix; requests append
  `/api/presentes` themselves. A trailing slash is also accepted.

Vite embeds `VITE_*` values into the frontend at build time. Do not put
credentials or secrets in this variable or any other `VITE_*` variable; values
are visible to users of the deployed site.

## Vite template notes

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
