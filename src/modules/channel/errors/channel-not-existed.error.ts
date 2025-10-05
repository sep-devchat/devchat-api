import { ApiError } from "@errors";

export class ChannelNotExistedError extends ApiError {
	constructor() {
		super({
			code: "channel_not_existed_err",
			message: "Channel does not exist",
			detail: null,
			status: 404,
		});
	}
}
