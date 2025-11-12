import { createError } from "../utils/errors";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const RESERVED_WORDS = [
  "index",
  "test",
  "tests",
  "spec",
  "types",
  "interface",
  "type",
  "config",
  "const",
  "let",
  "var",
  "function",
  "class",
  "import",
  "export",
  "default",
];

export function validateSliceName(name: string): ValidationResult {
  // Check for empty name
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: "Name cannot be empty",
    };
  }

  const trimmedName = name.trim();

  // Check length
  if (trimmedName.length > 50) {
    return {
      valid: false,
      error: "Name cannot exceed 50 characters",
    };
  }

  // Check format: must be kebab-case (lowercase with hyphens)
  if (!/^[a-z][a-z0-9-]*$/.test(trimmedName)) {
    return {
      valid: false,
      error:
        "Name must be in kebab-case (lowercase letters, numbers, and hyphens only, starting with a letter)",
    };
  }

  // Check for consecutive hyphens
  if (trimmedName.includes("--")) {
    return {
      valid: false,
      error: "Name cannot contain consecutive hyphens",
    };
  }

  // Check if ends with hyphen
  if (trimmedName.endsWith("-")) {
    return {
      valid: false,
      error: "Name cannot end with a hyphen",
    };
  }

  // Check for reserved words
  if (RESERVED_WORDS.includes(trimmedName)) {
    return {
      valid: false,
      error: `"${trimmedName}" is a reserved word and cannot be used`,
    };
  }

  return { valid: true };
}

export function throwIfInvalidName(
  name: string,
  type: "feature" | "entity" | "widget"
): void {
  const validation = validateSliceName(name);
  if (!validation.valid) {
    throw createError(
      "INVALID_NAME",
      `Invalid ${type} name: ${validation.error}`,
      { providedName: name, type }
    );
  }
}
