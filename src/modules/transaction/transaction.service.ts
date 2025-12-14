import { Injectable } from "@nestjs/common";
import { TransactionRepository } from "@db/repositories";
import { TransactionQuery } from "./dto";

@Injectable()
export class TransactionService {
	constructor(private readonly repo: TransactionRepository) {}

	async findMany(_query: TransactionQuery) {
		return this.repo.find();
	}

	async findOne(id: string) {
		return this.repo.findOneByOrFail({ id });
	}
}
