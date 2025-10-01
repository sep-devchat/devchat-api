import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { PasswordResetTokenEntity } from "@db/entities";

@Injectable()
export class PasswordResetTokenRepository extends Repository<PasswordResetTokenEntity> {
	constructor(private dataSource: DataSource) {
		super(PasswordResetTokenEntity, dataSource.createEntityManager());
	}
}
