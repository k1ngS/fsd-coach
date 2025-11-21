# Import Rules Cheat Sheet

## ✅ Allowed Imports

```typescript
// features/ can import from:
import { User } from "@/entities/user"; // ✅ Entity
import { Button } from "@/shared/ui/Button"; // ✅ Shared
import { api } from "@/shared/api"; // ✅ Shared

// entities/ can import from:
import { formatDate } from "@/shared/lib/dates"; // ✅ Shared

// widgets/ can import from:
import { LoginForm } from "@/features/auth"; // ✅ Feature
import { UserCard } from "@/entities/user"; // ✅ Entity

// Any layer can import from shared:
import { config } from "@/shared/config"; // ✅ Shared
```

## ❌ Forbidden Imports

```typescript
// ❌ Cross-feature imports
import { logout } from "@/features/logout"; // In features/login

// ❌ Upward imports
import { LoginForm } from "@/features/auth"; // In entities/user

// ❌ Direct internal imports
import { LoginButton } from "@/features/auth/ui/LoginButton"; // Should use public API

// ❌ Business logic in shared
// shared/ should NOT import from features or entities
```

## 🎯 Best Practices

### Use Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/app/": ["./src/app/"],
      "@/features/": ["./src/features/"],
      "@/entities/": ["./src/entities/"],
      "@/shared/": ["./src/shared/"]
    }
  }
}
```

### Export via Public API

```typescript
// features/auth/index.ts (Public API)
export { LoginForm } from "./ui/LoginForm";
export { useLogin } from "./model/useLogin";

// ✅ Usage
import { LoginForm, useLogin } from "@/features/auth";

// ❌ Don't do this
import { LoginForm } from "@/features/auth/ui/LoginForm";
```
