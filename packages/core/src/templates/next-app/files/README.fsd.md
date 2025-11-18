# {{projectName}} - FSD Architecture

Este projeto foi estruturado usando **Feature-Sliced Design (FSD)** com Next.js App Router.

## 📁 Estrutura do Projeto

{{projectName}}/
├── app/ # Next.js App Router (entry points)
│ └── (public)/ # Public routes group
├── src/
│ ├── app/ # Application layer (providers, global config)
│ ├── processes/ # Multi-feature business processes
│ ├── pages/ # Page compositions (optional)
│ ├── widgets/ # Composite UI blocks
│ ├── features/ # Feature modules
│ │ └── example/ # Example feature
│ ├── entities/ # Business entities
│ └── shared/ # Shared utilities and components
│ ├── ui/ # Shared UI components
│ ├── lib/ # Utility functions
│ └── config/ # Configuration

## 🎯 Camadas FSD

### Shared (Compartilhado)

Código reutilizável sem lógica de negócio. UI components, helpers, configurações.

### Entities (Entidades)

Modelos de domínio e lógica relacionada a entidades do negócio.

### Features (Funcionalidades)

Interações completas do usuário. Cada feature resolve um problema específico.

### Widgets (Widgets)

Blocos de UI compostos por múltiplas features/entities.

### Processes (Processos)

Fluxos de negócio que atravessam múltiplas features.

### Pages (Páginas - Opcional)

Composição de widgets e features para páginas específicas.

### App (Aplicação)

Providers, configuração global, inicialização.

## 🚀 Próximos Passos

1. **Definir Entidades**: Crie entidades de domínio com `fsd-coach add:entity <name>`
2. **Criar Features**: Adicione features com `fsd-coach add:feature <name>`
3. **Documentar Decisões**: Preencha os READMEs de cada feature/entity

## 📚 Aprender Mais

- [Feature-Sliced Design Docs](https://feature-sliced.design)
- [Next.js Documentation](https://nextjs.org/docs)

---

Gerado por **FSD Coach** em {{timestamp}}
