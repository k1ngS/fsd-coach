# FSD Coach

Your opinionated, minimal CLI (plus a tiny core lib) that helps you start projects with Feature‑Sliced Design (FSD), think in features/domains first, and document architectural decisions as you go.

> It’s a coach, not a boilerplate generator. It scaffolds the bare minimum, asks guiding questions, and nudges you to keep a clean public API per slice.


## Why FSD Coach exists

- Encourage feature/domain‑first thinking, not ad‑hoc components and utils.
- Standardize layers, naming, and dependency boundaries across projects.
- Provide skeletons + README prompts instead of “too much” prewritten code.
- Work across stacks with the same philosophy (frontend first, backend next, full‑stack later).


## Principles

- Not a magic boilerplate
  - No fully working apps. Only a minimal skeleton + docs + questions.

- Forces reasoning
  - Every generated slice comes with a README asking:
    - What problem does this feature solve?
    - Which entities does it use?
    - What belongs in the public API?

- Enforces architecture
  - Clear layers, consistent names, explicit public APIs.

- Stack‑agnostic, opinionated
  - Different templates for Next.js App Router, FastAPI, etc., yet the same FSD mindset: organize by domain/feature.


## Audience

- You (and any developer) who wants to internalize FSD and avoid the classic "src/components" and "src/utils" sprawl.
- Primary focus today: Next.js (App Router) + React + TypeScript. FastAPI (Python) and full‑stack presets are planned.


## Monorepo layout

This repository is a PNPM workspace:

```txt
fsd-coach/
├─ package.json                 # workspace scripts
├─ pnpm-workspace.yaml
├─ packages/
│  ├─ cli/                      # CLI app (bin: fsd-coach)
│  └─ core/                     # core generators and filesystem utilities
```

- Root scripts:
  - `pnpm build` → run build across all packages
  - `pnpm test` → run tests across all packages (none yet)
  - `pnpm typecheck` → type-check across all packages


## Current capabilities (MVP today)

Implemented:

- Command: `fsd-coach init`
  - Template: `next-app` (App Router) is supported today.
  - Creates an FSD‑ready folder structure and a top‑level `README.fsd.md` with guidance.
  - Adds a minimal example feature skeleton (`src/features/example`).

- Command: `fsd-coach add:feature <name>`
  - Creates `src/features/<name>` with default segments (`ui`, `model`, `api`) and a `README.md` with coaching questions.
  - You can interactively choose segments (and optionally include `lib`).

Planned (not implemented yet in code):

- Templates: `fastapi`, `fullstack`.
- Commands: `add:entity`, `audit`.


## Install and run

Prerequisites:

- Node.js 18+ (recommended)
- PNPM (this repo uses `pnpm@10.21.0`)

```powershell
You can run the CLI from source right now, or use it later via `npx` once it’s published to npm.

### From source (this monorepo)

```powershell
# From the repo root
pnpm install
pnpm -w run build   # builds cli and core

# Run the CLI directly via Node
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js init --template next-app
node packages/cli/dist/cli.js add:feature auth
```

When published to npm, the same commands will be available as:

```bash
npx fsd-coach --help
npx fsd-coach init --template next-app
npx fsd-coach add:feature auth
```


## CLI reference

### `fsd-coach init`

Initialize a new project skeleton.

```bash
fsd-coach init
fsd-coach init --template next-app
fsd-coach init --template fastapi     # planned
fsd-coach init --template fullstack   # planned
```

Current behavior for `--template next-app`:

- Creates the App Router directory and FSD base layers under `src/`.
- Writes `README.fsd.md` with architecture tips and a checklist.
- Adds `src/features/example` with a tiny README and public API stub.

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

Create a new feature slice with coaching prompts.

```bash
fsd-coach add:feature auth
fsd-coach add:feature campaigns
```

Interactive mode lets you pick segments to create (defaults: `ui`, `model`, `api`; `lib` optional). Each segment gets a brief README explaining its role, and the feature root gets:

```txt
src/features/<name>/
├─ README.md          # answer guiding questions before coding
├─ index.ts           # define feature’s public API here
├─ ui/
│  └─ README.md
├─ model/
│  └─ README.md
├─ api/
│  └─ README.md
└─ lib/               # optional
   └─ README.md
```


## Templates (today and planned)

- `next-app` (implemented): Next.js App Router skeleton + FSD directories + coaching docs.
- `fastapi` (planned):
  - `backend/app/{core,shared,modules}` with `modules/<feature>/{api.py,schemas.py,service.py,repository.py,README.md}`.
- `fullstack` (planned):
  - `frontend/` as `next-app` + `backend/` as `fastapi` and an `ARCHITECTURE.md` describing front/back mirroring.


## Recommended workflow

### Step 1: Starting a project

```bash
npx fsd-coach init --template next-app
```

### Step 2: Before writing UI ad‑hoc

```bash
npx fsd-coach add:feature auth
# Fill the generated READMEs and commit the public API in index.ts
```

### Step 3: New domain model

```bash
# planned
npx fsd-coach add:entity user
```

### Step 4: Pre‑commit reminders

```bash
# planned
npx fsd-coach audit
```


## Developing this repo

```powershell
# Install deps
pnpm install

# Type-check all packages
pnpm -w run typecheck

# Build all packages
pnpm -w run build

# Run the CLI locally
node packages/cli/dist/cli.js --help
```

Notes:

- The CLI package `fsd-coach` depends on the core package `@fsd-coach/core` via workspace protocol.
- If you change generators in `packages/core`, rebuild before testing the CLI.


## Roadmap

- Implement `fastapi` and `fullstack` templates.
- Add `add:entity` and `audit` commands.
- FSD linting: import rules between layers/slices.
- Opinionated presets, e.g. `--preset=saas`, `--preset=dashboard`.
- VS Code integration (command palette: “Create FSD Feature”).
- Educational walkthrough (`fsd-coach guide`).


## FAQ

- Why doesn’t it generate a working app?
  - Because the goal is to shape your architecture and decisions, not to hide them.
- Where should my business rules live?
  - In `model/` for features, in `entities/` for reusable domain models.
- What is the “public API” of a feature?
  - The exports from `src/features/<name>/index.ts` that other layers are allowed to import.
