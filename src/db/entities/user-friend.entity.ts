import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { FriendRequestStatus } from "@utils";
import { DbConstants } from "../db-constants";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.UserFriend)
export class UserFriendEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.UserFriend.id })
	id: string;

	@Column({ name: ColumnName.UserFriend.senderId })
	senderId: string;

	@Column({ name: ColumnName.UserFriend.receiverId })
	receiverId: string;

	@JoinColumn({ name: ColumnName.UserFriend.senderId })
	@ManyToOne(() => UserEntity)
	sender: UserEntity;

	@JoinColumn({ name: ColumnName.UserFriend.receiverId })
	@ManyToOne(() => UserEntity)
	receiver: UserEntity;

	@Column({
		name: ColumnName.UserFriend.status,
		type: "int",
		unsigned: true,
		default: FriendRequestStatus.PENDING,
	})
	status: number;

	@Column({
		name: ColumnName.UserFriend.message,
		type: "text",
		nullable: true,
	})
	message: string | null;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "datetime",
		default: () => "CURRENT_TIMESTAMP",
	})
	createdAt: Date;

	@Column({
		name: ColumnName.Audit.updatedAt,
		type: "datetime",
		default: () => "CURRENT_TIMESTAMP",
		onUpdate: "CURRENT_TIMESTAMP",
	})
	updatedAt: Date;

	@Column({
		type: "datetime",
		name: ColumnName.UserFriend.respondedAt,
		nullable: true,
		default: null,
	})
	respondedAt: Date | null;
}
