import { Injectable, OnApplicationBootstrap, Logger } from "@nestjs/common";
import { UserRepository } from "@db/repositories";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AiUserSeeder implements OnApplicationBootstrap {
	private readonly logger = new Logger(AiUserSeeder.name);

	constructor(private readonly users: UserRepository) {}

	async onApplicationBootstrap() {
		await this.ensureAiUser(
			{
				username: "openai-bot",
				email: "openai@devchat.local",
				firstName: "OpenAI",
				lastName: "Bot",
				avatarUrl:
					"https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/technology/openai-wi0oregrfui0s0fg1v899.png/openai-0fcdwnou9mjkm8ygsz64zp.png",
			},
			"OpenAI assistant bot user",
		);

		await this.ensureAiUser(
			{
				username: "gemini-bot",
				email: "gemini@devchat.local",
				firstName: "Gemini",
				lastName: "Bot",
				avatarUrl:
					"https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/dark/gemini-color.png",
			},
			"Gemini assistant bot user",
		);
	}

	private async ensureAiUser(
		base: {
			username: string;
			email: string;
			firstName: string;
			lastName: string;
			avatarUrl?: string | null;
		},
		logLabel: string,
	) {
		const existed = await this.users.findOne({
			where: [{ username: base.username }, { email: base.email }],
		});
		if (existed) {
			this.logger.log(`${logLabel} already exists: ${existed.username}`);
			return existed;
		}

		const randomPass = Math.random().toString(36).slice(-12);
		const hashed = bcrypt.hashSync(randomPass, 10);
		const insert = await this.users.insert({
			username: base.username,
			email: base.email,
			password: hashed,
			firstName: base.firstName,
			lastName: base.lastName,
			avatarUrl: base.avatarUrl || null,
			isActive: true,
			emailVerified: true,
			emailVerificationToken: null,
			timezone: null,
			adminRoleId: null,
		});
		const created = await this.users.findOne({
			where: { id: insert.identifiers[0].id },
		});
		this.logger.log(`${logLabel} created: ${created?.username}`);
		return created;
	}
}
