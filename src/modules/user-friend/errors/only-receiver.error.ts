import { ApiError } from "@errors";

export class OnlyReceiverError extends ApiError {
	constructor() {
		super({
			code: "only_receiver_allowed",
			message: "Only the receiver can accept or decline this friend request",
			detail: null,
		});
	}
}
