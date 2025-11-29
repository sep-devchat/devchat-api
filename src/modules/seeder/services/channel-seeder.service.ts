import { ChannelEntity, GroupEntity } from "@db/entities";
import { ChannelRepository, GroupRepository } from "@db/repositories";
import { faker } from "@faker-js/faker";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ChannelSeederService {
	private readonly logger = new Logger(ChannelSeederService.name);

	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly channelRepo: ChannelRepository,
	) {}

	async run() {
		const groups = await this.groupRepo.find();
		if (!groups.length) {
			this.logger.warn("No groups available. Skipping channel seeding.");
			return;
		}

		const channelsToCreate: ChannelEntity[] = [];
		for (const group of groups) {
			const existingChannels = await this.channelRepo.count({
				where: { groupId: group.id },
			});
			if (existingChannels > 0) {
				continue;
			}

			channelsToCreate.push(...this.buildChannelsForGroup(group));
		}

		if (!channelsToCreate.length) {
			this.logger.log(
				"Channels already exist for all groups. Nothing to seed.",
			);
			return;
		}

		await this.channelRepo.save(channelsToCreate);
		this.logger.log(`Seeded ${channelsToCreate.length} channels.`);
	}

	private buildChannelsForGroup(group: GroupEntity): ChannelEntity[] {
		const baseNames = ["general", "announcements", "random"];
		const extraCount = faker.number.int({ min: 0, max: 2 });
		const extraNames = Array.from({ length: extraCount }, () =>
			this.slugify(faker.commerce.department()),
		);
		const uniqueNames = Array.from(new Set([...baseNames, ...extraNames]));

		return uniqueNames.map((name) =>
			this.channelRepo.create({
				name,
				description: faker.lorem.sentence(),
				groupId: group.id,
				createdBy: group.createdBy,
			}),
		);
	}

	private slugify(value: string) {
		return (
			value
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "") || "channel"
		);
	}
}
