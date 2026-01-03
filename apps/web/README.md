# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and linting/formatting provided by Biome.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting, which is configured at the root level. You can run linting and formatting from the project root:

```bash
# Lint the entire project
pnpm biome check

# Format code
pnpm biome format

# Fix linting issues automatically
pnpm biome check --write
```

Biome provides fast, modern linting and formatting with built-in TypeScript support.
