export type FSDLayer =
    | "app"
    | "processes"
    | "pages"
    | "widgets"
    | "features"
    | "entities"
    | "shared";

export type Segment =
    | "ui"
    | "model"
    | "api"
    | "lib"
    | "config"
    | "types";

export interface GeneratorOptions {
    name: string;
    segments?: Segment[];
    rootDir?: string;
    withTests?: boolean;
    dryRun?: boolean;
    cwd?: string;
}

export interface GeneratorResult {
    name: string;
    basePath: string;
    segments: Segment[];
    created: string[];
    skipped: string[];
    errors?: string[];
}

export interface FSDConfig {
    template?: "next-app" | "fastapi" | "fullstack";
    defaultSegments?: {
        features?: Segment[];
        entities?: Segment[];
        widgets?: Segment[];
    };
    rootDir?: {
        features?: string;
        entities?: string;
        widgets?: string;
    };
    naming?: "kebab-case" | "camelCase" | "PascalCase";
    lint?: {
        enforcePublicApi?: boolean;
        checkCircularDeps?: boolean;
    };
    locale?: "en" | "pt-BR";
}