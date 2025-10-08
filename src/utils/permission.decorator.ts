import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "required_permissions" as const;

/**
 * Decorator to specify required permissions for a route.
 * Supports either: @RequirePermissions('a', 'b') OR @RequirePermissions(['a','b']).
 */
export function RequirePermissions(...perms: (string | string[])[]) {
	const flat: string[] = perms.flatMap((p) => (Array.isArray(p) ? p : [p]));
	return SetMetadata(PERMISSIONS_KEY, flat);
}
