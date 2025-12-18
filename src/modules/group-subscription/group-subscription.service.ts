import { Injectable } from "@nestjs/common";
import { GroupSubscriptionRepository } from "@db/repositories";
import {
	CreateGroupSubscriptionRequest,
	UpdateGroupSubscriptionRequest,
	GroupSubscriptionQuery,
} from "./dto";

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
		return this.repo.find();
	}

	async findOne(id: string) {
		return this.repo.findOneByOrFail({ id });
	}

	async deleteOne(id: string) {
		await this.repo.delete(id);
	}
}
