# My NestJS Template

## Set up

- Create and edit `.env` file base on `.env.example`
- Run `npm install` to install dependencies
- Run `npm run migration:generate` and `npm run migration:run` to generate and run database migration
- Run `npm run start:dev` to start in watch mode

## Project structure

### Overview

- `@db`: located at `src/db`, contains entities and other files relating to database.
- `@modules`: located at `src/modules`, contains modules that prepresents the features of the project.
- `@utils`: located at `src/utils`, contains utilities.
- `@errors`: located at `src/errors`, contains error definitions.
- `@providers`: located at `src/providers`, contains 3rd party services like AWS, Google, etc.

### `@db`

Inside `@db` module, we have the following files:

- `datasource.ts`: the TypeORM datasource file, which is the connection driver that connect our code and database.
- `database.module.ts`: NestJS module that import TypeORM root module with datasource config.

Guide for creating entity (example: `Sample` entity):

1. Create your `sample.entity.ts` file inside the `entities` folder:

```ts
@Entity()
export class Sample {
  // Your column definitions
}
```

2. Export entity in `index.ts`:

```ts
export * from './sample.entity'
```

3. Re-run migration to apply change to database:

```shell
npm run migration:generate
npm run migration:run
```

### `@modules`

The `@modules` module is the root folder of all the main feature modules in our project. Example for creating a new feature module (`Sample` module):

1. Create a module folder name `sample`

```
@modules
  | sample
    | Your files here...
```

2. Create module file and service file: `sample.module.ts`, `sample.service.ts`

```ts
// sample.service.ts
@Injectable()
export class SampleService {
  // your code...
}
```

```ts
// sample.module.ts
@Module({
  providers: [SampleService],
})
export class SampleModule {}
```

3. Export them in `index.ts` file:

```ts
export * from './sample.module'
export * from './sample.service'
```

4. Other folders and files convention:
   - `dto`: contains request/response DTOs
   - `errors`: contains module error
   - Other related files like `pipe`, `filter`, `guard`, etc.

### `@utils`

`@utils` module provides utilities to out project. These are some important files:

- `env.ts`: provides `Env` constants, edit this file whenever an environment variable change.
- `validation.pipe.ts`: provides global data transform & validation.
- `iaa-exception.filter.ts`: provides global error catching and filtering.
- `api-response.dto.ts`: provides a standardizing response DTO for app. Usage example:

```ts
@Get()
getSomething() {
  return new ApiResponseDto(something, pagination, mesasge);
}
```

### `@errors`

`@errors` module provides top-level error definition. Every error should inherit `ApiError`, which is located at `api-error.ts`. Usage example:

```ts
// sample.error.ts
export class SampleError extends ApiError<DataType> {
  constructor(data: DataType) {
    super({
      code: 'sample_err',
      message: 'Sample Error!',
      detail: data,
    })
  }
}
```

You can provide module scope error by creating an `errors` folder at your module and provide error definitions inside that folder.

```
@modules
  | sample
    | errors
      | your-error-name.error.ts
      | index.ts
    | sample.module.ts
    | ...
```

When throwing error, it is catched by the exception filter.

### `@providers`

`@providers` module adds a buffer layer to 3rd party services which enable us to customize their SDKs or APIs for easy usage. The structure of our provider is almost the same as the `@modules` module, except we will have a provider module and provider's service modules inside of it.

```
@providers
  | aws
    | modules
      | s3
        | s3.module.ts
        | s3.service.ts
        | index.ts
    | aws.module.ts
    | aws.service.ts
    | index.ts
```

## Audit Logging Guide

This project includes a reusable auditing system built with a decorator + interceptor pair to capture user actions (create/update/etc.) and persist structured change logs in the `audit_log` table.

### Components

- `AuditLogEntity`: Database entity storing audit entries
- `@AuditLog(...)` decorator: Declares audit metadata per endpoint / service method
- `AuditLogInterceptor`: Reads metadata, captures request/response and stores a record

### Enabling (Global Registration)

Add the interceptor provider (if not already) in `AppModule` or a dedicated `AuditModule`:

```ts
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
```

You can also apply it selectively:

```ts
@UseInterceptors(AuditLogInterceptor)
@Controller('admin-role')
export class AdminRoleController {}
```

### Decorator Usage

```ts
import { AuditLog } from '@utils';

@Post()
@AuditLog({
  action: 'ADMIN_ROLE_CREATE',
  entityType: 'AdminRole',
  captureResponse: true, // store created entity (response.data or response)
})
createRole(@Body() dto: CreateAdminRoleRequest) { ... }

@Put(':id')
@AuditLog({
  action: 'ADMIN_ROLE_UPDATE',
  entityType: 'AdminRole',
  entity: AdminRoleEntity,     // enables diffing old vs new values
  entityIdParam: 'id',          // route param to fetch original entity
  pickBodyFields: ['roleName','permissions'], // optional – limit fields captured
})
updateRole(@Param('id') id: string, @Body() dto: UpdateAdminRoleRequest) { ... }
```

### Options Reference

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `action` | `string` | Yes | High-level verb (e.g. `ADMIN_ROLE_UPDATE`) |
| `entityType` | `string` | No | Logical domain name (defaults to action / `Generic`) |
| `entity` | `Function` | No | Entity class; when provided with `entityIdParam` enables old/new diffing |
| `entityIdParam` | `string` | No | Name of the route param containing the entity id |
| `pickBodyFields` | `string[]` | No | Whitelist of fields to persist (applied after body capture) |
| `omitBodyFields` | `string[]` | No | Blacklist of fields to exclude |
| `captureResponse` | `boolean` | No | If true, uses handler response (prefers `response.data`) as `newValues` |

### What Gets Stored

| Column | Source |
|--------|--------|
| `userId` | From CLS `profile.id` (set in AuthGuard) |
| `action` | `action` option |
| `entityType` | `entityType` option or `'Generic'` |
| `oldValues` | Diffed original (only changed keys) when `entity` + `entityIdParam` present |
| `newValues` | Filtered body OR response (or diff-only if original found) |
| `createdBy` | Same as `userId` (fallback `system`) |
| `createdAt` | Auto timestamp |

### Update Diff Behavior

If `entity` and `entityIdParam` are supplied:
1. The interceptor loads the original record via repository.
2. After handler executes, it builds a shallow diff for keys present in captured new values.
3. `oldValues` contains only changed fields’ previous values; `newValues` replaced with only changed fields.

If the original entity can’t be fetched (not found or error), it silently falls back to storing full `newValues` without `oldValues`.

### Example Output (Update)

```json
{
  "action": "ADMIN_ROLE_UPDATE",
  "entityType": "AdminRole",
  "oldValues": { "roleName": "Moderator" },
  "newValues": { "roleName": "Senior Moderator" },
  "userId": "1c9f...",
  "createdAt": "2025-10-09T08:12:24.512Z"
}
```

### Best Practices

1. Keep `action` constants consistent (UPPER_SNAKE_CASE or dot.case). 
2. Avoid dumping entire large objects—use `pickBodyFields` to limit size. 
3. Redact secrets before they reach the interceptor (strip in DTO or use `omitBodyFields`). 
4. Add indexes for analytics queries (e.g. on `created_at`, `action`, `entity_type`). 
5. Consider a retention strategy (archive / prune old logs). 
6. Add a viewing endpoint (paginated) with permission gating, e.g. `audit.log.list` permission. 

### Extending Further

- Implement deep diffing (recursive) for nested configs.
- Publish audit events to a queue for async processing / external SIEM ingestion.
- Correlate requests using a trace ID in CLS and include it in the audit log entity.
- Add `oldValues` enrichment (e.g. include related entity names) in a background worker.

### Quick Checklist For Adding Audit To An Endpoint

1. Decide action name + entityType.
2. Add `@AuditLog({...})` decorator to the controller method.
3. For updates: include `entity` + `entityIdParam`.
4. Optionally whitelist or omit fields.
5. Confirm interceptor is globally registered.
6. Exercise endpoint and verify row in `audit_log` table.

---
Audit logging now ready for consistent, low-friction observability across mutations.
