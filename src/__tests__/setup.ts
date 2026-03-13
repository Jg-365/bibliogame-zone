/**
 * Vitest global test setup — runs before every test file.
 * Extends jest-dom matchers (toBeInTheDocument, toHaveValue, etc.)
 */
import "@testing-library/jest-dom";
import { server } from "./utils/mswServer";

// Start MSW intercepts before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers after each test to avoid cross-test pollution
afterEach(() => server.resetHandlers());

// Shut down MSW after all tests
afterAll(() => server.close());

// Suppress noisy Supabase realtime WebSocket errors in test output
globalThis.WebSocket = class MockWebSocket {
  addEventListener() {}
  removeEventListener() {}
  close() {}
  send() {}
  readyState = 3; // CLOSED
} as unknown as typeof WebSocket;
