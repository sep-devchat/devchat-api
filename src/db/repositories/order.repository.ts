import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";
import { OrderEntity } from "@db/entities/order.entity";

@Injectable()
export class OrderRepository extends BaseRepository<OrderEntity> {
	constructor(private readonly dataSource: DataSource) {
		super(OrderEntity, dataSource.createEntityManager());
	}
}
