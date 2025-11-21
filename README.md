# FSD Coach

> Your opinionated CLI (and core toolkit) for practicing Feature‑Sliced Design from day zero.

FSD Coach helps you scaffold Feature‑Sliced Design structures, keep slices documented, and audit whether a project is still respecting the architecture. This repository contains a PNPM workspace with:

- `packages/cli` – the end-user CLI (`fsd-coach`).
- `packages/core` – generators, filesystem helpers, config utilities, audit engine, and cache layer that can be reused programmatically.

---

## ✨ Capabilities today

- `fsd-coach init --template next-app` scaffolds the FSD directory layout (App Router friendly) and drops a `README.fsd.md` explaining the layers.
- `fsd-coach add:feature <name>` creates a new feature slice with `README.md`, `index.ts`, and chosen segments (`ui`, `model`, `api`, `lib`).
- `fsd-coach add:entity <name>` scaffolds reusable entities with their own documentation and segments (`model`, `ui`, `lib`).
- `fsd-coach audit` walks the project and checks public APIs, cross-layer imports, and slice boundaries.
- `fsd-coach config ...` manages a `.fsdcoachrc` (init/show/get/set/reset/delete).
- `fsd-coach cache ...` inspects or clears the audit cache.
- `fsd-coach list` prints existing features, entities, and widgets.
- `--dry-run` is available on the scaffolding commands so you can preview changes without touching the filesystem.

Planned (tracked in code comments / roadmap but not shipped):

- Additional templates such as `fastapi` and `fullstack`.
- Opinionated presets/presets for specific product types.
- Richer audit rules (import graph heuristics, automatic fixes).

---

## Repository structure

```txt
fsd-coach/
├─ package.json
├─ pnpm-workspace.yaml
├─ packages/
│  ├─ cli/        # CLI entry point and command wiring
│  └─ core/       # generators, audit engine, cache, config helpers
└─ README.md
```

Workspace scripts:

- `pnpm build` – run `tsup` builds across all packages.
- `pnpm typecheck` – run `tsc --noEmit` in every package.
- `pnpm test` – placeholder (no automated tests yet).

---

## Local quick start (working on this repo)

```powershell
# Install dependencies
pnpm install

# Build both packages
pnpm -w run build

# Try the CLI from source
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js init --template next-app --dry-run
node packages/cli/dist/cli.js add:feature auth
```

Once published to npm, all commands can be executed with `npx fsd-coach <command>`.

Prerequisites: Node.js ≥ 18 and PNPM (this repo uses `pnpm@10.21.0`).

---

## CLI usage

### `fsd-coach init`

Initialize the base FSD layout.

```bash
fsd-coach init --template next-app [--dry-run]
```

- Currently only `next-app` is implemented; it creates `app/(public)` plus all `src/*` layers, a sample feature (`src/features/example`), and `README.fsd.md` describing how to work with the structure.
- `--dry-run` prints what would change without creating directories/files.

Result snapshot:

```txt
.
├─ app/(public)
├─ src/app
├─ src/processes
├─ src/pages
├─ src/widgets
├─ src/features/example
├─ src/entities
└─ src/shared/{ui,lib,config}
```

### `fsd-coach add:feature <name>`

Generate a new feature slice.

```bash
fsd-coach add:feature campaign --segments ui,model,api --dry-run
```

- Valid segments: `ui`, `model`, `api`, `lib`; when you omit `--segments`, an interactive checkbox prompts you.
- Each slice gets a `README.md` with coaching questions plus an `index.ts` that acts as the public API.
- `--dry-run` shows the tree that would be created.

### `fsd-coach add:entity <name>`

Scaffold reusable domain entities.

```bash
fsd-coach add:entity user --segments model,ui
```

- Defaults to `model` + `ui`; `lib` is optional.
- Each entity ships with a README explaining what to document and an `index.ts` stub for the public API.
- Supports `--dry-run` as well.

### `fsd-coach audit`

Run static checks against your project:

```bash
fsd-coach audit [--strict] [--fix]
```

- Scans `src/` for `.ts/.tsx/.js/.jsx` files.
- Validates cross-layer imports, shared imports, direct segment imports, cross-feature dependencies, and verifies that every slice exposes a public API (`index.ts`).
- Uses a persistent cache (`packages/core/src/cache`) to avoid re-parsing unchanged files.
- `--strict` fails when warnings exist; `--fix` is reserved for future auto-fixes.

### `fsd-coach config`

Manage the `.fsdcoachrc` file.

Common subcommands:

| Command                              | Description                               |
| ------------------------------------ | ----------------------------------------- |
| `fsd-coach config init [--force]`    | Create a config file with defaults.       |
| `fsd-coach config show [--defaults]` | Print effective config or defaults.       |
| `fsd-coach config get <key>`         | Read nested keys like `rootDir.features`. |
| `fsd-coach config set <key> <value>` | Update values (JSON or plain strings).    |
| `fsd-coach config reset --yes`       | Reset to defaults.                        |
| `fsd-coach config delete --yes`      | Remove the config file.                   |

Configuration lets you customize default segments, directories, lint rules, and localization.

### `fsd-coach cache`

Inspect or clear the audit cache.

```bash
fsd-coach cache --stats
fsd-coach cache --clear
```

- Without flags it prints basic statistics (file count and total size).
- `--clear` wipes cached parse results.

### `fsd-coach list`

Enumerate slices already present in `src/features`, `src/entities`, and `src/widgets`.

```bash
fsd-coach list [--features] [--entities] [--widgets] [--json]
```

- Handy after running generators or during reviews to see how many slices exist.

---

## Dry-run mode

The commands `init`, `add:feature`, and `add:entity` accept `--dry-run`. When enabled:

- Directories/files are **not** created.
- The logger prints `[DRY RUN] Would create ...` messages.
- The summary still lists what would be created vs skipped, letting you preview work in CI or pull requests before applying.

---

## Recommended workflow

1. `fsd-coach init --template next-app` – establish the base layout.
2. For each feature, `fsd-coach add:feature <name>`, fill the README, and expose a clean public API.
3. Promote cross-cutting concepts to entities via `fsd-coach add:entity <name>`.
4. Run `fsd-coach list` to keep track of slices and `fsd-coach audit` before merging.
5. Customize defaults with `fsd-coach config` if your team prefers different root folders or segments.

---

## Development scripts

```powershell
pnpm install
pnpm -w run typecheck
pnpm -w run build
node packages/cli/dist/cli.js --help
```

- Rebuild (`pnpm -w run build`) whenever you change code in `packages/core` so the CLI consumes the latest output.
- Lint/test commands can be added as the project evolves.

---

## Roadmap & ideas

- Templates for FastAPI backends and full-stack mirrors (`frontend/` ↔ `backend/`).
- `add:entity`/`add:feature` presets (e.g., SaaS dashboard, marketplace, admin).
- Import lint auto-fixes and richer diagnostics in `fsd-coach audit`.
- VS Code integration and interactive guides.

---

## Learn more about Feature‑Sliced Design

- [feature-sliced.design](https://feature-sliced.design/)
- [feature-sliced.design/docs/get-started/overview](https://feature-sliced.design/docs/get-started/overview)
- Talks/articles about “vertical slices” and “modular frontends”.

Document every slice, ship features intentionally, and let the coach keep you honest. 🧠
