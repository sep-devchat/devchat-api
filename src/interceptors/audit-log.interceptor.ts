import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { AUDIT_LOG_KEY, AuditMetadataOptions } from "@utils";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { DataSource } from "typeorm";
import { AuditLogEntity } from "@db/entities/audit-log.entity";

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
	constructor(
		private readonly reflector: Reflector,
		private readonly cls: ClsService<DevChatCls>,
		private readonly dataSource: DataSource,
	) {}

	async intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Promise<Observable<any>> {
		const auditMeta = this.reflector.getAllAndOverride<
			AuditMetadataOptions | undefined
		>(AUDIT_LOG_KEY, [context.getHandler(), context.getClass()]);

		if (!auditMeta) return next.handle();

		const http = context.switchToHttp();
		const request = http.getRequest();
		const bodyClone = { ...(request.body || {}) };

		// Pre-fetch original entity for diff if update scenario (entity + id param present)
		let originalEntity: any = null;
		let entityId: string | undefined;
		if (
			auditMeta.entity &&
			auditMeta.entityIdParam &&
			request.params?.[auditMeta.entityIdParam]
		) {
			entityId = request.params[auditMeta.entityIdParam];
			try {
				originalEntity = await this.dataSource
					.getRepository(auditMeta.entity)
					.findOne({ where: { id: entityId } as any });
			} catch (_) {
				// ignore fetch errors
			}
		}

		const userId = this.cls.get("profile")?.id ?? null;

		return next.handle().pipe(
			tap(async (response) => {
				try {
					// Filter body fields
					let newValues: any = undefined;
					if (auditMeta.captureResponse) {
						newValues = response?.data ?? response;
					} else {
						newValues = bodyClone;
					}
					if (auditMeta.pickBodyFields?.length) {
						newValues = auditMeta.pickBodyFields.reduce(
							(acc, f) => {
								if (
									newValues &&
									Object.prototype.hasOwnProperty.call(newValues, f)
								)
									acc[f] = newValues[f];
								return acc;
							},
							{} as Record<string, any>,
						);
					}
					if (auditMeta.omitBodyFields?.length) {
						for (const f of auditMeta.omitBodyFields) {
							if (newValues && typeof newValues === "object")
								delete newValues[f];
						}
					}

					// If we have an original entity, build shallow diffs limited to keys in newValues
					let oldValues: Record<string, any> | null = null;
					if (
						originalEntity &&
						newValues &&
						typeof newValues === "object" &&
						!Array.isArray(newValues)
					) {
						const diffOld: Record<string, any> = {};
						const diffNew: Record<string, any> = {};
						const candidateKeys = Object.keys(newValues);
						for (const k of candidateKeys) {
							if (["id", "createdAt", "updatedAt", "deletedAt"].includes(k))
								continue;
							const beforeVal = (originalEntity as any)[k];
							const afterVal = (newValues as any)[k];
							// shallow compare (stringify for objects to basic detect change)
							const changed =
								beforeVal instanceof Date && afterVal instanceof Date
									? beforeVal.getTime() !== afterVal.getTime()
									: JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
							if (changed) {
								diffOld[k] = beforeVal;
								diffNew[k] = afterVal;
							}
						}
						if (Object.keys(diffNew).length > 0) {
							oldValues = diffOld;
							newValues = diffNew; // replace with diff-only new values
						}
					}

					// Persist
					const repo = this.dataSource.getRepository(AuditLogEntity);
					const log = repo.create({
						userId: userId || undefined,
						action: auditMeta.action,
						entityType: auditMeta.entityType ?? "Generic",
						oldValues: oldValues,
						newValues: newValues ?? null,
						createdBy: userId || "system",
					} as any);
					await repo.insert(log);
				} catch (e) {
					// Swallow errors to not break main flow; optionally log
					// console.error('AuditLog write failed', e);
				}
			}),
		);
	}
}
