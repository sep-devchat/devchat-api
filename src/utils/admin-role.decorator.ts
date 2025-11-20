import { SetMetadata } from "@nestjs/common";

export const ADMIN_ROLE_KEY = "admin-role" as const;

export const AdminRole = () => SetMetadata(ADMIN_ROLE_KEY, true);
