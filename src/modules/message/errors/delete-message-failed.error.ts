export class DeleteMessageFailedError extends Error {
	constructor(message?: string) {
		super(message ?? "Delete message failed");
	}
}
