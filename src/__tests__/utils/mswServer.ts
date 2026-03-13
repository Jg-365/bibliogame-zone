/**
 * MSW server singleton for unit/integration tests.
 * Import and use in vitest setup or individual test files.
 */
import { setupServer } from "msw/node";
import { handlers } from "./mswHandlers";

export const server = setupServer(...handlers);
