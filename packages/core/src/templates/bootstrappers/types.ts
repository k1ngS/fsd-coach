export interface BootstrapOptions {
  cwd: string;
  packageManager?: string;
  dryRun?: boolean;
}

/**
 * Strategy pattern for app bootstrapping
 * Each framework has its own bootstrapper
 */
export interface IAppBootstrapper {
  readonly frameworkName: string;

  /**
   * Check if framework is already installed
   */
  isInstalled(cwd: string): Promise<boolean>;

  /**
   * Create app using official CLI tool
   */
  create(options: BootstrapOptions): Promise<void>;
}
