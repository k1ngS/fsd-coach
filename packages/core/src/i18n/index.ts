/**
 * Internationalization support
 */

export type Locale = "en" | "pt-BR";

export interface I18nMessages {
  [key: string]: string | I18nMessages;
}

export const messages: Record<Locale, I18nMessages> = {
  en: {
    cli: {
      init: {
        success: "✅ Project initialized successfully!",
        template: "Template: {template}",
        location: "Location: {location}",
        readReadme: "📚 Read README.fsd.md for architecture guide!",
      },
      audit: {
        starting: "🔍 Auditing FSD architecture...",
        scanning: "Scanning files...",
        scanned: "Scanned {count} files",
        checking: "Checking FSD rules...",
        complete: "Audit complete",
        passed: "✅ Audit passed! FSD architecture is valid.",
        failed: "❌ Audit failed! Please fix the violations above.",
        summary: "📊 Audit Summary",
        filesScanned: "Files scanned: {count}",
        errors: "Errors: {count}",
        warnings: "Warnings: {count}",
        infos: "Infos: {count}",
      },
      feature: {
        created: "Feature created: {name}",
        dryRun: "[DRY RUN] Feature would be created: {name}",
      },
      entity: {
        created: "Entity created: {name}",
        dryRun: "[DRY RUN] Entity would be created: {name}",
      },
    },
    violations: {
      CROSS_LAYER_IMPORT:
        'Layer "{from}" cannot import from "{to}" (violates layer hierarchy)',
      CROSS_FEATURE_IMPORT:
        'Feature "{from}" cannot directly import from feature "{to}"',
      MISSING_PUBLIC_API: 'Slice "{slice}" is missing public API (index.ts)',
      DIRECT_SEGMENT_IMPORT:
        'Direct import from segment "{segment}" bypasses public API',
      CIRCULAR_DEPENDENCY: "Circular dependency detected: {cycle}",
      SHARED_IMPORTS_LAYER: 'Shared layer cannot import from "{layer}" layer',
    },
    suggestions: {
      CROSS_LAYER_IMPORT:
        "Move the code to layer {layer} or lower, or use dependency inversion",
      CROSS_FEATURE_IMPORT:
        "Extract shared logic to entities or shared layer. Features should be independent.",
      MISSING_PUBLIC_API:
        "Create an index.ts file to define the public API of this slice",
      DIRECT_SEGMENT_IMPORT:
        "Import from the slice's public API (index.ts) instead",
      CIRCULAR_DEPENDENCY:
        "Consider reorganizing code to break this cycle:\n1. Extract shared code to a new module\n2. Move one of the modules to a higher layer\n3. Use dependency injection to reduce coupling",
      SHARED_IMPORTS_LAYER:
        "Shared should only contain reusable code with no dependencies on business layers",
    },
  },
  "pt-BR": {
    cli: {
      init: {
        success: "✅ Projeto inicializado com sucesso!",
        template: "Template: {template}",
        location: "Localização: {location}",
        readReadme: "📚 Leia o README.fsd.md para o guia de arquitetura!",
      },
      audit: {
        starting: "🔍 Auditando arquitetura FSD...",
        scanning: "Escaneando arquivos...",
        scanned: "Escaneados {count} arquivos",
        checking: "Verificando regras FSD...",
        complete: "Auditoria completa",
        passed: "✅ Auditoria passou! Arquitetura FSD está válida.",
        failed: "❌ Auditoria falhou! Por favor, corrija as violações acima.",
        summary: "📊 Resumo da Auditoria",
        filesScanned: "Arquivos escaneados: {count}",
        errors: "Erros: {count}",
        warnings: "Avisos: {count}",
        infos: "Infos: {count}",
      },
      feature: {
        created: "Feature criada: {name}",
        dryRun: "[DRY RUN] Feature seria criada: {name}",
      },
      entity: {
        created: "Entity criada: {name}",
        dryRun: "[DRY RUN] Entity seria criada: {name}",
      },
    },
    violations: {
      CROSS_LAYER_IMPORT:
        'Camada "{from}" não pode importar de "{to}" (viola hierarquia de camadas)',
      CROSS_FEATURE_IMPORT:
        'Feature "{from}" não pode importar diretamente da feature "{to}"',
      MISSING_PUBLIC_API: 'Slice "{slice}" está sem API pública (index.ts)',
      DIRECT_SEGMENT_IMPORT:
        'Importação direta do segmento "{segment}" ignora a API pública',
      CIRCULAR_DEPENDENCY: "Dependência circular detectada: {cycle}",
      SHARED_IMPORTS_LAYER:
        'Camada shared não pode importar da camada "{layer}"',
    },
    suggestions: {
      CROSS_LAYER_IMPORT:
        "Mova o código para a camada {layer} ou inferior, ou use inversão de dependência",
      CROSS_FEATURE_IMPORT:
        "Extraia a lógica compartilhada para entities ou shared. Features devem ser independentes.",
      MISSING_PUBLIC_API:
        "Crie um arquivo index.ts para definir a API pública deste slice",
      DIRECT_SEGMENT_IMPORT:
        "Importe da API pública do slice (index.ts) em vez disso",
      CIRCULAR_DEPENDENCY:
        "Considere reorganizar o código para quebrar este ciclo:\n1. Extrair código compartilhado para um novo módulo\n2. Mover um dos módulos para uma camada superior\n3. Usar injeção de dependência para reduzir acoplamento",
      SHARED_IMPORTS_LAYER:
        "Shared deve conter apenas código reutilizável sem dependências em camadas de negócio",
    },
  },
};

export class I18n {
  private currentLocale: Locale = "en";

  setLocale(locale: Locale): void {
    this.currentLocale = locale;
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split(".");
    let value: any = messages[this.currentLocale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to key if not found
        return key;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    // Replace placeholders
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{${paramKey}}`);
      });
    }

    return value;
  }
}

export const i18n = new I18n();
