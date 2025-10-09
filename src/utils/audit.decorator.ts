import { SetMetadata, applyDecorators } from "@nestjs/common";

export const AUDIT_LOG_KEY = "audit_log_meta";

export interface AuditMetadataOptions {
	action: string; // e.g. ADMIN_ROLE_CREATE
	entityType?: string; // e.g. AdminRole (logical name)
	entityIdParam?: string; // name of route param containing entity id (e.g. 'id')
	entity?: Function; // actual entity class for fetching old record on update
	pickBodyFields?: string[]; // to record only subset of new values
	omitBodyFields?: string[]; // fields to omit
	captureResponse?: boolean; // if true, store response as newValues (filtered)
}

export function AuditLog(opts: AuditMetadataOptions) {
	return applyDecorators(SetMetadata(AUDIT_LOG_KEY, opts));
}
