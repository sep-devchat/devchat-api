import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UUID } from "typeorm/driver/mongodb/bson.typings";
import { UserEntity } from "./user.entity";

const { TableName, ColumnName, IndexName } = DbConstants;
@Entity(TableName.FriendRequest)
export class FriendRequestEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.FriendRequest.id })
	id: string;

	@Column({ name: ColumnName.FriendRequest.fromUserId })
	fromUserId: string;

	@JoinColumn({ name: ColumnName.FriendRequest.fromUserId })
	@ManyToOne(() => UserEntity)
	fromUser: UserEntity;

	@Column({ name: ColumnName.FriendRequest.toUserId })
	toUserId: string;

	@JoinColumn({ name: ColumnName.FriendRequest.toUserId })
	@ManyToOne(() => UserEntity)
	toUser: UserEntity;

	@Column({ name: ColumnName.FriendRequest.message, nullable: true })
	message?: string;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "timestamp",
		default: () => "CURRENT_TIMESTAMP",
	})
	createdAt: Date;

	@Column({
		name: ColumnName.Audit.updatedAt,
		type: "timestamp",
		default: () => "CURRENT_TIMESTAMP",
	})
	updatedAt: Date;

	@Column({ name: ColumnName.Audit.createdBy, type: "uuid" })
	createdBy: string;
}
