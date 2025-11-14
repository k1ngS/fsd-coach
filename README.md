# FSD Coach

> Your opinionated CLI coach for Feature‑Sliced Design (FSD)

FSD Coach is a small CLI (and core library) that helps you start projects already structured by domain/features and forces you to think about architecture before writing ad‑hoc components.

## ✨ What is implemented today

- 🏗️ Project initialization with FSD structure for **Next.js App Router** (`init --template next-app`).
- 📦 Feature generator via `fsd-coach add:feature <name>` that creates `src/features/<name>` with segments like `ui`, `model`, `api` and coaching READMEs.
- 📄 Auto‑generated `README.fsd.md` explaining the base layers and how to use them.

Planned but **not implemented yet** (design only, no code):

- 🔍 Architecture audit (`fsd-coach audit`).
- 📦 Entity generator (`fsd-coach add:entity`).
- ⚙️ Configuration via `.fsdcoachrc` (`fsd-coach config`).
- 🚀 Cache system and project structure visualization.
- 📋 Extra commands like `fsd-coach list` and `fsd-coach cache`.

## 🧠 Principles

- Not a magic boilerplate
  - No full apps ready out of the box; only a minimal skeleton + docs + questions.

- Forces architectural thinking
  - Every generated feature has a README with questions such as:
    - What problem does this feature solve?
    - Which entities does it use?
    - What should be exposed in the public API (`index.ts`)?

- Enforces boundaries
  - Clear layers, consistent naming, and explicit public APIs per slice.

- Same philosophy across stacks
  - Next.js App Router today; FastAPI and full‑stack templates are on the roadmap.

## 🗂 Monorepo structure

This repository is a PNPM workspace:

```txt
fsd-coach/
├─ package.json                 # workspace scripts
├─ pnpm-workspace.yaml
├─ packages/
│  ├─ cli/                      # CLI app (bin: fsd-coach)
│  └─ core/                     # core generators and filesystem utilities
```

Root scripts:

- `pnpm build` → build all packages.
- `pnpm test` → run tests (none yet; placeholder).
- `pnpm typecheck` → type-check all packages.

## 🚀 Quick start (from this repo)

Prerequisites:

- Node.js 18+
- PNPM (this repo uses `pnpm@10.21.0`)

Install dependencies and build:

```powershell
# from repo root
pnpm install
pnpm -w run build
```

Run the CLI directly:

```powershell
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js init --template next-app
node packages/cli/dist/cli.js add:feature auth
```

After publishing to npm, the idea is to use:

```bash
npx fsd-coach init --template next-app
npx fsd-coach add:feature auth
```

## 📚 Commands (implemented)

### `fsd-coach init`

Initialize a new project skeleton.

**Usage:**

```bash
fsd-coach init
fsd-coach init --template next-app
```

Currently, the `next-app` template is implemented. Other templates (`fastapi`, `fullstack`) are still in design.

What `next-app` does:

- Creates an App Router base directory and FSD layers under `src/`.
- Writes `README.fsd.md` explaining each layer and how to use it.
- Adds an example feature skeleton at `src/features/example/`.

Resulting structure (simplified):

```txt
.
├─ app/
│  └─ (public)/
├─ src/
│  ├─ app/            # providers, global configs
│  ├─ processes/      # large flows (auth-flow, onboarding)
│  ├─ pages/          # optional FSD pages
│  ├─ widgets/
│  ├─ features/
│  │  └─ example/
│  │     ├─ README.md
│  │     └─ index.ts
│  ├─ entities/
│  └─ shared/
│     ├─ ui/
│     ├─ lib/
│     └─ config/
└─ README.fsd.md
```

### `fsd-coach add:feature <name>`

Create a new feature slice and its coaching docs.

**Usage:**

```bash
fsd-coach add:feature auth
fsd-coach add:feature campaigns
```

Behavior (based on `@fsd-coach/core`):

- Creates `src/features/<name>/`.
- Writes a root `README.md` with questions you should answer before coding.
- Creates `index.ts` as the single public API entry point for that feature.
- Creates segment directories and READMEs:
  - `ui/` → visual components for the feature (no heavy business rules).
  - `model/` → state, hooks, and business logic (testable without UI).
  - `api/` → HTTP clients/calls encapsulated for this feature.
  - `lib/` (optional) → helpers internal to the feature.

Example structure:

```txt
src/features/auth/
├─ README.md
├─ index.ts
├─ ui/
│  └─ README.md
├─ model/
│  └─ README.md
├─ api/
│  └─ README.md
└─ lib/
	 └─ README.md
```

## 🧩 Templates (status)

- `next-app` (implemented): Next.js App Router + FSD directories + coaching docs.
- `fastapi` (planned): FSD‑inspired FastAPI backend with `app/core`, `app/shared`, `app/modules/<feature>`.
- `fullstack` (planned): Combined `frontend/` (next-app) + `backend/` (fastapi) plus `ARCHITECTURE.md` explaining front/back mirroring.

## 🧭 Recommended workflow (vision)

### Step 1: Start a project

```bash
npx fsd-coach init --template next-app
```

### Step 2: Before writing random UI

```bash
npx fsd-coach add:feature auth
```

Fill in the generated READMEs and define the public API in `src/features/auth/index.ts` before writing components.

### Step 3: Entities and audit (future)

The design includes:

- `fsd-coach add:entity <name>` to create reusable domain entities.
- `fsd-coach audit` to scan the folder structure and remind you about missing READMEs or missing `index.ts` public APIs.

## 🛠 Developing this repo

```powershell
pnpm install
pnpm -w run typecheck
pnpm -w run build
node packages/cli/dist/cli.js --help
```

Notes:

- The CLI package `fsd-coach` depends on the core package `@fsd-coach/core` (workspace protocol).
- If you change generators in `packages/core`, rebuild before testing the CLI again.

## 🎓 Learning FSD

Some good starting points to understand Feature‑Sliced Design and modular architecture:

- https://feature-sliced.design/
- https://feature-sliced.design/docs/get-started/overview
- Articles and talks about “feature‑first architecture”, “modular frontends”, and “vertical slices”.
