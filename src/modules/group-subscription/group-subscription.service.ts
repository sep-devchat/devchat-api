import { Injectable } from "@nestjs/common";
import { GroupSubscriptionRepository } from "@db/repositories";
import {
	CreateGroupSubscriptionRequest,
	UpdateGroupSubscriptionRequest,
	GroupSubscriptionQuery,
} from "./dto";
import { GroupSubscriptionResponse } from "./dto/response";

@Injectable()
export class GroupSubscriptionService {
	constructor(private readonly repo: GroupSubscriptionRepository) {}

	async createOne(dto: CreateGroupSubscriptionRequest) {
		const entity = this.repo.create({
			groupId: dto.groupId,
			subscriptionId: dto.subscriptionId,
			groupSubscriptionStatus: dto.groupSubscriptionStatus,
			monthQuantity: dto.monthQuantity,
			paymentBy: dto.paymentBy,
			isPaid: dto.isPaid,
			startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
			endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
		});
		return this.repo.save(entity);
	}

	async updateOne(id: string, dto: UpdateGroupSubscriptionRequest) {
		await this.repo.update(id, {
			groupId: dto.groupId,
			subscriptionId: dto.subscriptionId,
			groupSubscriptionStatus: dto.groupSubscriptionStatus,
			monthQuantity: dto.monthQuantity,
			paymentBy: dto.paymentBy,
			isPaid: dto.isPaid,
			startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
			endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
		});
		return this.findOne(id);
	}

	async findMany(_query: GroupSubscriptionQuery) {
		const entities = await this.repo.find({
			relations: { subscription: true },
			order: { startedAt: "DESC" },
		});
		return GroupSubscriptionResponse.fromEntities(entities);
	}

	async findOne(id: string) {
		const entity = await this.repo.findOne({
			where: { id },
			relations: { subscription: true },
		});
		if (!entity) {
			return this.repo.findOneByOrFail({ id });
		}
		return GroupSubscriptionResponse.fromEntity(entity);
	}

	async deleteOne(id: string) {
		await this.repo.delete(id);
	}
}
