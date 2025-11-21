# Feature-Sliced Design Principles

## 🎯 Core Concepts

FSD is a methodology for structuring frontend applications based on business logic and user needs, not technical implementation.

## 📊 Layer Hierarchy (Bottom to Top)

┌─────────────────────────────────────┐
│ app/ Application │ ← Providers, initialization
├─────────────────────────────────────┤
│ processes/ Business Processes │ ← Multi-feature flows
├─────────────────────────────────────┤
│ pages/ Pages │ ← Route compositions
├─────────────────────────────────────┤
│ widgets/ Widgets │ ← Composite UI blocks
├─────────────────────────────────────┤
│ features/ Features │ ← User interactions
├─────────────────────────────────────┤
│ entities/ Entities │ ← Business entities
├─────────────────────────────────────┤
│ shared/ Shared │ ← Reusable code
└─────────────────────────────────────┘

## ✅ Import Rules

### Allowed

- **Lower → Higher**: `features` can import `entities`, `shared`
- **Same Layer**: Only via public API (`index.ts`)
- **Shared**: Can be imported from anywhere

### Forbidden

- **Higher → Lower**: `entities` CANNOT import `features`
- **Cross-Feature**: `features/auth` CANNOT import `features/profile`
- **Direct Imports**: Must use public API, not internal files

## 🎨 Public API Pattern

Every module MUST have an `index.ts` that defines its public API:

```typescript
// ✅ GOOD - Clear public API
export { LoginForm } from "./ui/LoginForm";
export { useLogin } from "./model/useLogin";

// ❌ BAD - Exposing internals
export * from "./ui";
export * from "./model";
```

## 💡 Golden Rules

1. **One Feature = One Problem**
2. **Features are Isolated** (no cross-imports)
3. **Use Public APIs** (never import internals)
4. **Respect Layer Hierarchy** (only import from lower layers)
5. **Keep Shared Generic** (no business logic in shared)
