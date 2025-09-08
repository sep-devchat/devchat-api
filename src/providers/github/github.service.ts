import { Inject, Injectable } from "@nestjs/common";
import { GITHUB_MODULE_PARAMS_TOKEN } from "./github.constants";
import {
	GetAccessTokenResponse,
	GetUserEmailsResponse,
	GetUserInfoResponse,
	GitHubModuleParams,
} from "./types";
import axios from "axios";
import {
	GetAccessTokenError,
	GetUserEmailsError,
	GetUserInfoError,
} from "./errors";

@Injectable()
export class GitHubService {
	constructor(
		@Inject(GITHUB_MODULE_PARAMS_TOKEN)
		private readonly params: GitHubModuleParams,
	) {}

	async getAccessToken(code: string) {
		const url = "https://github.com/login/oauth/access_token";

		try {
			const res = await axios.post<GetAccessTokenResponse>(
				url,
				{
					client_id: this.params.clientId,
					client_secret: this.params.clientSecret,
					code: code,
					accept: "json",
				},
				{
					headers: {
						Accept: "application/json",
					},
				},
			);

			return res.data;
		} catch (err) {
			if (axios.isAxiosError(err) && err.response) {
				console.log(err.response.data);
			} else {
				console.log(err);
			}
			throw new GetAccessTokenError();
		}
	}

	async getUserInfo(accessToken: string) {
		const url = `https://api.github.com/user?access_token`;

		try {
			const res = await axios.get<GetUserInfoResponse>(url, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			return res.data;
		} catch (err) {
			if (axios.isAxiosError(err) && err.response) {
				console.log(err.response.data);
			} else {
				console.log(err);
			}
			throw new GetUserInfoError();
		}
	}

	async getUserEmails(accessToken: string) {
		const url = `https://api.github.com/user/emails`;

		try {
			const res = await axios.get<GetUserEmailsResponse>(url, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			return res.data;
		} catch (err) {
			if (axios.isAxiosError(err) && err.response) {
				console.log(err.response.data);
			} else {
				console.log(err);
			}
			throw new GetUserEmailsError();
		}
	}
}
