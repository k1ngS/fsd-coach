import { NextAppTemplate } from "./next-app/NextAppTemplate";
import { ReactViteTemplate } from "./react-vite/ReactViteTemplate";
import { FastAPITemplate } from "./fastapi/FastAPITemplate";
import { FullstackTemplate } from "./fullstack/FullstackTemplate";
import { templateRegistry } from ".";

// Register all templates
templateRegistry.register(new NextAppTemplate());
templateRegistry.register(new ReactViteTemplate());
templateRegistry.register(new FastAPITemplate());
templateRegistry.register(new FullstackTemplate());

// Export registry and types
export { templateRegistry } from "./registry";
export * from "./types";
export * from "./fullstack/types";
