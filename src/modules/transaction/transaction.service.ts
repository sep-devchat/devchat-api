import { Injectable } from "@nestjs/common";
import { TransactionRepository } from "@db/repositories";
import { TransactionQuery } from "./dto";
import { PaginationDto } from "@utils";

@Injectable()
export class TransactionService {
	constructor(private readonly repo: TransactionRepository) {}

	async findMany(query: TransactionQuery) {
		const page = Number.isFinite(query?.page) ? Number(query.page) : 1;
		const take = Number.isFinite(query?.take) ? Number(query.take) : 20;
		const skip = (page - 1) * take;
		const groupId = query?.groupId;

		const relations = {
			user: true,
			group: true,
			shareFund: { subscription: true, group: true },
			subscription: true,
		} as const;

		const where = groupId ? { groupId } : undefined;

		const [data, totalRecord] = await this.repo.findAndCount({
			relations,
			where,
			order: { transactionCode: "DESC" },
			skip,
			take,
		});

		return {
			data,
			pagination: new PaginationDto(page, take, totalRecord),
		};
	}

	async findOne(id: string) {
		const entity = await this.repo.findOne({
			where: { id },
			relations: {
				user: true,
				group: true,
				shareFund: { subscription: true, group: true },
				subscription: true,
			},
		});
		if (!entity) return this.repo.findOneByOrFail({ id });
		return entity;
	}
}
