import chalk from "chalk";

export type LogLevel = "success" | "error" | "warn" | "info" | "step" | "debug";

export interface Logger {
  success(msg: string): void;
  error(msg: string, error?: Error): void;
  warn(msg: string): void;
  info(msg: string): void;
  step(msg: string): void;
  debug(msg: string): void;
  list(items: string[], symbol?: string): void;
  setEnabled(enabled: boolean): void;
  setVerbose(verbose: boolean): void;
}

class ConsoleLogger implements Logger {
  private enabled: boolean = true;
  private verbose: boolean = false;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  success(msg: string): void {
    if (this.enabled) {
      console.log(chalk.green("✓"), msg);
    }
  }

  error(msg: string, error?: Error): void {
    if (this.enabled) {
      console.error(chalk.red("✗"), msg);
      if (error && this.verbose) {
        console.error(chalk.red(error.stack));
      }
    }
  }

  warn(msg: string): void {
    if (this.enabled) {
      console.log(chalk.yellow("⚠"), msg);
    }
  }

  info(msg: string): void {
    if (this.enabled) {
      console.log(chalk.blue("ℹ"), msg);
    }
  }

  step(msg: string): void {
    if (this.enabled) {
      console.log(chalk.cyan("→"), msg);
    }
  }

  debug(msg: string): void {
    if (this.enabled) {
      console.log(chalk.gray("[DEBUG]"), msg);
    }
  }

  list(items: string[], symbol: string = "+"): void {
    if (this.enabled && items.length > 0) {
      items.forEach((item) => {
        console.log(chalk.gray(` ${symbol}`), item);
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}

export const createLogger = (verbose: boolean = false): Logger => {
  return new ConsoleLogger(verbose);
};

export const logger = createLogger();
