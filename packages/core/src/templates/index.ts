import { templateRegistry } from "./registry";
import { NextAppTemplate } from "./next-app/NextAppTemplate";
// Import future templates here
// import { FastAPITemplate } from "./fastapi/FastAPITemplate";
// import { FullStackTemplate } from "./fullstack/FullStackTemplate";

// Register all built-in templates
templateRegistry.register(new NextAppTemplate());
// templateRegistry.register(new FastAPITemplate());
// templateRegistry.register(new FullStackTemplate());

// Export registry and types
export { templateRegistry } from "./registry";
export * from "./types";
export * from "./base/BaseTemplate";
export * from "./shared/ContentGenerator";
export * from "./shared/SegmentTemplates";
