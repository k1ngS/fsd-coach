export interface BootstrapOptions {
  cwd: string;
  dryRun?: boolean;
  packageManager?: "pnpm" | "npm" | "yarn" | "bun";
  projectName?: string;
}

/**
 * Strategy interface for app bootstrapping
 * Follows Strategy Pattern + Open/Closed Principle
 */
export interface IAppBootstrapper {
  readonly frameworkName: string;

  /**
   * Check if framework is already installed
   */
  isInstalled(cwd: string): Promise<boolean>;

  /**
   * Create app using official tool (create-next-app, create-vite, etc)
   */
  create(options: BootstrapOptions): Promise<void>;
}
