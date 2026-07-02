/**
 * Argument list for user-provided event handlers.
 *
 * Handlers for heterogeneous runtime events cannot share a precise signature:
 * `unknown[]` would reject users' typed callbacks (contravariance) and
 * `never[]` would break contextual typing of their parameters. `any[]` is the
 * one place it is intentional — keep it centralized here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyArgs = any[]
