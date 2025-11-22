# UI Segment

## Purpose

Visual components that render user interface.

## Responsibilities

- ✅ Render JSX/HTML
- ✅ Receive data via props
- ✅ Emit events (callbacks)
- ✅ Handle form validation (UI-level)

## What NOT to do

- ❌ Make API calls directly
- ❌ Complex business logic
- ❌ Global state management

## Examples

### Good (Dumb Component)

```typescript
interface LoginFormProps {
onSubmit: (data: LoginData) => void;
isLoading: boolean;
error?: string;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleSubmit = (e: FormEvent) => {
e.preventDefault();
onSubmit({ email, password });
};

return (
<form onSubmit={handleSubmit}>
<input value={email} onChange={(e) => setEmail(e.target.value)} />
<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
{error && <div className="error">{error}</div>}
<button disabled={isLoading}>
{isLoading ? "Loading..." : "Login"}
</button>
</form>
);
}
```

### Bad (Smart Component - Too Much Logic)

```typescript
// ❌ Don't do this in UI
export function LoginForm() {
const [data, setData] = useState({});

const handleSubmit = async () => {
// ❌ API call in UI component
const response = await fetch("/api/login", {
method: "POST",
body: JSON.stringify(data),
});
// ❌ Business logic in UI
if (response.ok) {
localStorage.setItem("token", await response.text());
window.location.href = "/dashboard";
}
};

return <form>...</form>;
}
```

## Testing

```typescript
import { render, fireEvent } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

test("calls onSubmit with form data", () => {
const onSubmit = jest.fn();
const { getByLabelText, getByRole } = render(
<LoginForm onSubmit={onSubmit} isLoading={false} />
);

fireEvent.change(getByLabelText("Email"), { target: { value: "test@test.com" } });
fireEvent.click(getByRole("button"));

expect(onSubmit).toHaveBeenCalledWith({ email: "test@test.com", password: "" });
});
```
