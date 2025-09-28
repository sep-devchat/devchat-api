import { SetMetadata } from "@nestjs/common";

export const SKIP_AUTH_KEY = "skip-auth" as const;

/**
 * Marks a route as public so auth guards can bypass authentication.
 * Usage: `@SkipAuth()` on controller or handler.
 */
export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);
