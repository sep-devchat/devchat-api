export class EditMessageFailedError extends Error {
	constructor(message?: string) {
		super(message ?? "Edit message failed");
	}
}
