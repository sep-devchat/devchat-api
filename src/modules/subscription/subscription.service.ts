import { Injectable } from "@nestjs/common";
import { SubscriptionRepository } from "@db/repositories";
import {
	CreateSubscriptionRequest,
	UpdateSubscriptionRequest,
	SubscriptionQuery,
} from "./dto";

@Injectable()
export class SubscriptionService {
	constructor(private readonly repo: SubscriptionRepository) {}

	async createOne(dto: CreateSubscriptionRequest) {
		const entity = this.repo.create({
			subscriptionCode: dto.subscriptionCode,
			subscriptionName: dto.subscriptionName,
			price: dto.price,
			limitMembers: dto.limitMembers,
			isAIActive: dto.isAIActive,
			runCodePerDay: dto.runCodePerDay,
			programmingLanguageInGroups: dto.programmingLanguageInGroups,
			allowUseAI: dto.allowUseAI ?? false,
			levelSubscription: dto.levelSubscription,
		});
		return this.repo.save(entity);
	}

	async findMany(_query: SubscriptionQuery) {
		return this.repo.find();
	}

	async findOne(id: string) {
		return this.repo.findOneByOrFail({ id });
	}

	async updateOne(id: string, dto: UpdateSubscriptionRequest) {
		await this.repo.update(id, dto);
		return this.findOne(id);
	}

	async deleteOne(id: string) {
		await this.repo.delete(id);
	}
}
