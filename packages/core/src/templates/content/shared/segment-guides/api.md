# API Segment

## Purpose

HTTP client functions for communicating with backend.

## Responsibilities

- ✅ API calls (fetch, axios)
- ✅ Request/response handling
- ✅ Data serialization (DTO ↔ Domain)
- ✅ Error handling

## What NOT to do

- ❌ UI rendering
- ❌ State management (use `model/`)

## Examples

### API Function

```typescript
// api/loginAPI.ts
import { apiClient } from "@/shared/api/client";
import type { LoginCredentials, User } from "../model/types";

export async function loginAPI(credentials: LoginCredentials): Promise<User> {
  const response = await apiClient.post("/auth/login", credentials);

  // Transform backend DTO to domain model
  return {
    id: response.data.user_id,
    email: response.data.email,
    name: response.data.full_name,
    role: response.data.role,
  };
}

export async function logoutAPI(): Promise<void> {
  await apiClient.post("/auth/logout");
}
```

### With Error Handling

```typescript
// api/loginAPI.ts
import { ApiError } from "@/shared/api/errors";

export async function loginAPI(credentials: LoginCredentials): Promise<User> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new ApiError("Login failed", response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Network error", 0);
  }
}
```

## Testing

```typescript
import { loginAPI } from "./loginAPI";

test("calls login endpoint correctly", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ user_id: "1", email: "test@test.com" }),
    })
  );

  const user = await loginAPI({ email: "test@test.com", password: "123" });

  expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.any(Object));
  expect(user.id).toBe("1");
});
```
