import { Injectable } from "@nestjs/common";
import {
	CreateMessageRequest,
	UpdateMessageRequest,
	MessageQuery,
} from "./dto";

@Injectable()
export class MessageService {
	async createOne(dto: CreateMessageRequest) {}

	async updateOne(id: string | number, dto: UpdateMessageRequest) {}

	async findMany(query: MessageQuery) {}

	async findOne(id: string | number) {}

	async deleteOne(id: string | number) {}
}
