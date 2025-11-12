import { beforeAll, afterAll } from "vitest";
import { logger } from "../utils/logger";

// Desabilitar logs durante os testes para saída limpa
beforeAll(() => {
  logger.setEnabled(false);
});

afterAll(() => {
  logger.setEnabled(true);
});
