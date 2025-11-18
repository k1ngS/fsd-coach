# Feature: Example

Este é um exemplo de feature estruturada seguindo FSD.

## 📋 Antes de Escrever Código

Responda estas perguntas para clarificar a arquitetura:

### 1. Qual problema concreto esta feature resolve?

**Resposta:** _[Descreva o problema do usuário]_

### 2. Quais entidades do domínio ela utiliza?

**Resposta:** _[Liste as entidades, ex: User, Product]_

### 3. Esta feature precisa se comunicar com outras features?

**Resposta:** _[Sim/Não - Se sim, como?]_

### 4. Qual será a API pública exportada? (index.ts)

**Resposta:** _[Liste o que será exportado]_

## 🏗️ Estrutura Planejada

example/
├── index.ts # Public API (export apenas o necessário)
├── ui/ # Componentes visuais
├── model/ # State management e lógica de negócio
├── api/ # Client HTTP (se necessário)
└── lib/ # Helpers internos (se necessário)

## ✅ Checklist de Implementação

- [ ] Definir interface pública (index.ts)
- [ ] Implementar lógica de negócio (model/)
- [ ] Criar componentes UI (ui/)
- [ ] Adicionar testes
- [ ] Documentar uso no README

---

**Dica:** Mantenha a feature **focada** em resolver um único problema.
