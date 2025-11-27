import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { GroupInviteLinkEntity } from "@db/entities";

@Injectable()
export class GroupInviteLinkRepository extends Repository<GroupInviteLinkEntity> {
	constructor(private dataSource: DataSource) {
		super(GroupInviteLinkEntity, dataSource.createEntityManager());
	}

	/**
	 * Find an active invite link by token
	 */
	async findByToken(token: string): Promise<GroupInviteLinkEntity | null> {
		return this.findOne({
			where: {
				token,
				isActive: true,
			},
			relations: ["group", "creator"],
		});
	}

	/**
	 * Find all active invite links for a group
	 */
	async findByGroupId(groupId: string): Promise<GroupInviteLinkEntity[]> {
		return this.find({
			where: {
				groupId,
				isActive: true,
			},
			relations: ["creator"],
			order: {
				createdAt: "DESC",
			},
		});
	}

	/**
	 * Check if a token is available (not already used)
	 */
	async isTokenAvailable(token: string): Promise<boolean> {
		const existing = await this.findOne({
			where: { token },
		});
		return !existing;
	}

	/**
	 * Increment the usage count for a link
	 */
	async incrementUsage(id: string): Promise<void> {
		await this.increment({ id }, "usedCount", 1);
	}

	/**
	 * Deactivate a link
	 */
	async deactivateLink(id: string): Promise<void> {
		await this.update(id, {
			isActive: false,
			updatedAt: new Date(),
		});
	}

	/**
	 * Find expired links
	 */
	async findExpiredLinks(): Promise<GroupInviteLinkEntity[]> {
		return this.createQueryBuilder("link")
			.where("link.expiresAt IS NOT NULL")
			.andWhere("link.expiresAt < :now", { now: new Date() })
			.andWhere("link.isActive = :isActive", { isActive: true })
			.getMany();
	}

	/**
	 * Find links that have reached max usage
	 */
	async findMaxUsedLinks(): Promise<GroupInviteLinkEntity[]> {
		return this.createQueryBuilder("link")
			.where("link.maxUses IS NOT NULL")
			.andWhere("link.usedCount >= link.maxUses")
			.andWhere("link.isActive = :isActive", { isActive: true })
			.getMany();
	}
}
