# PrepHub React

The React version of PrepHub, built page by page to learn React: React 19, TypeScript (strict) and Tailwind CSS v4 on Vite.
No router, data or form libraries yet: those are written by hand first, and TanStack comes later in a second version.

## Run

```bash
yarn install
yarn dev        # http://localhost:5175
yarn build      # type-check, then build to dist/
yarn typecheck
```

`/api/*` is proxied to the PrepHub API on `http://localhost:5001` (start it from the Prephub repository with `yarn api:dev`).

## Rules

- Use `yarn`, never npm.
- ES module syntax only; TypeScript strict.
- Versions are pinned exactly (see `package.json`).
