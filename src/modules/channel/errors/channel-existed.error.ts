import { ApiError } from "@errors";

export class ChannelExistedError extends ApiError {
	constructor() {
		super({
			code: "channel_existed_err",
			message: "Channel already exists",
			detail: null,
			status: 400,
		});
	}
}
