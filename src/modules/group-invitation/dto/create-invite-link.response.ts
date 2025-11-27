import { ApiProperty } from "@nestjs/swagger";

export class CreateGroupInviteLinkResponse {
	static readonly DEFAULT_BASE_URL = "https://devchat.api";

	@ApiProperty({
		description: "Unique token representing the invite link",
		example: "3f1a8c4d2e9b4a1d5c6f7b8a9e0d1c2b",
	})
	token: string;

	@ApiProperty({
		description: "Fully qualified invite URL derived from the token",
		example: "https://devchat.api/invite/3f1a8c4d2e9b4a1d5c6f7b8a9e0d1c2b",
	})
	link: string;

	static fromToken(token: string): CreateGroupInviteLinkResponse {
		const response = new CreateGroupInviteLinkResponse();

		response.token = token;
		response.link = CreateGroupInviteLinkResponse.buildInviteUrl(
			this.DEFAULT_BASE_URL,
			token,
		);

		return response;
	}

	private static buildInviteUrl(
		baseUrl: string | undefined,
		token: string,
	): string {
		const trimmedBaseUrl = baseUrl?.trim();
		const resolvedBaseUrl =
			trimmedBaseUrl && trimmedBaseUrl.length > 0
				? trimmedBaseUrl
				: CreateGroupInviteLinkResponse.DEFAULT_BASE_URL;
		const normalizedBaseUrl = resolvedBaseUrl.replace(/\/+$/, "");
		return `${normalizedBaseUrl}/invite/${token}`;
	}
}
