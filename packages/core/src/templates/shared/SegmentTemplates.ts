export interface SegmentTemplate {
  name: string;
  description: string;
  filePath?: string; // Path to load content from file
}

export const SEGMENT_TEMPLATES = {
  feature: {
    ui: {
      name: "ui",
      description: `# ui/

Componentes visuais específicos desta feature.

**Diretrizes:**
- Não coloque regras de negócio pesadas aqui
- Use props e dados vindos do model
- Se algo se tornar genérico, mova para shared/ui

**Exemplo:**
\`\`\`tsx
// LoginForm.tsx
export function LoginForm() {
  const { login, isLoading } = useLoginModel();
  return <form onSubmit={login}>...</form>;
}
\`\`\`
`,
    },
    model: {
      name: "model",
      description: `# model/

State management e lógica de negócio desta feature.

**Diretrizes:**
- Pode chamar APIs (via api/)
- Não renderiza nada diretamente
- Deve ser testável sem depender de UI

**Exemplo:**
\`\`\`ts
// useLoginModel.ts
export function useLoginModel() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials) => {
    setIsLoading(true);
    await loginAPI(credentials);
    setIsLoading(false);
  };

  return { login, isLoading };
}
\`\`\`
`,
    },
    api: {
      name: "api",
      description: `# api/

Chamadas HTTP relacionadas apenas a esta feature.

**Diretrizes:**
- Encapsule URLs, parâmetros e adaptação de dados
- Não use diretamente em componentes UI
- Use através do model

**Exemplo:**
\`\`\`ts
// loginAPI.ts
export async function loginAPI(credentials: Credentials) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return response.json();
}
\`\`\`
`,
    },
    lib: {
      name: "lib",
      description: `# lib/

Helpers e utilitários internos desta feature.

**Diretrizes:**
- Apenas código auxiliar específico da feature
- Se for genérico, mova para shared/lib
- Mantenha funções puras quando possível

**Exemplo:**
\`\`\`ts
// validators.ts
export function validateEmail(email: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}
\`\`\`
`,
    },
  },
  entity: {
    model: {
      name: "model",
      description: `# model/

Modelo de domínio e lógica relacionada à entidade.

**Diretrizes:**
- Defina tipos/interfaces da entidade
- Adicione funções de transformação
- Mantenha lógica de validação

**Exemplo:**
\`\`\`ts
// types.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// transforms.ts
export function toUserDTO(user: User): UserDTO {
  return { ... };
}
\`\`\`
`,
    },
    ui: {
      name: "ui",
      description: `# ui/

Componentes de apresentação da entidade.

**Diretrizes:**
- Componentes "burros" que apenas exibem dados
- Não contêm lógica de negócio
- Reutilizáveis em múltiplas features

**Exemplo:**
\`\`\`tsx
// UserCard.tsx
export function UserCard({ user }: { user: User }) {
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
\`\`\`
`,
    },
    lib: {
      name: "lib",
      description: `# lib/

Utilitários relacionados à entidade.

**Diretrizes:**
- Helpers para trabalhar com a entidade
- Validadores específicos
- Formatadores de dados

**Exemplo:**
\`\`\`ts
// formatters.ts
export function formatUserName(user: User): string {
  return \`\${user.firstName} \${user.lastName}\`.trim();
}
\`\`\`
`,
    },
  },
};

/**
 * Get segment template by type and segment name
 */
export function getSegmentTemplate(
  type: "feature" | "entity",
  segmentName: string
): SegmentTemplate | undefined {
  return SEGMENT_TEMPLATES[type][
    segmentName as keyof (typeof SEGMENT_TEMPLATES)[typeof type]
  ];
}
