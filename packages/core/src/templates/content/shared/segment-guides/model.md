# Model Segment

## Purpose

Business logic, state management, and data transformations.

## Responsibilities

- ✅ Custom hooks (React)
- ✅ State management (Zustand, Redux, Context)
- ✅ Data transformations
- ✅ Business rules
- ✅ Type definitions

## What NOT to do

- ❌ Render UI components
- ❌ Direct API calls (use `api/` segment)

## Examples

### Custom Hook (React)

```typescript
// model/useLogin.ts
import { useState } from "react";
import { loginAPI } from "../api/loginAPI";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await loginAPI(credentials);
      // Store user in global state or localStorage
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
```

### State Store (Zustand)

```typescript
// model/authStore.ts
import { create } from "zustand";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### Types

```typescript
// model/types.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}
```

## Testing

```typescript
import { renderHook, act } from "@testing-library/react";
import { useLogin } from "./useLogin";

test("handles login successfully", async () => {
  const { result } = renderHook(() => useLogin());

  expect(result.current.isLoading).toBe(false);

  await act(async () => {
    await result.current.login({ email: "test@test.com", password: "123" });
  });

  expect(result.current.error).toBeNull();
});
```
