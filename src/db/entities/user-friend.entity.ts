import { DbConstants } from "@db";
import { Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { FriendRequestStatus } from "@modules/user-friend";

const { TableName, ColumnName, IndexName } = DbConstants;

export class UserFriendEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.UserFriend.id })
	id: string;

	@Column({ name: ColumnName.UserFriend.senderId })
	@ManyToOne(() => UserEntity)
	sender: UserEntity;

	@Column({ name: ColumnName.UserFriend.receiverId })
	@ManyToOne(() => UserEntity)
	receiver: UserEntity;

	@Column({
		name: ColumnName.UserFriend.status,
		type: "enum",
		enum: FriendRequestStatus,
		default: FriendRequestStatus.Pending,
	})
	status: FriendRequestStatus;

	@Column({
		name: ColumnName.UserFriend.message,
		type: "text",
		nullable: true,
	})
	message: string | null;

	@Column({ type: "datetime", name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@Column({ type: "datetime", name: ColumnName.Audit.updatedAt })
	updatedAt: Date;

	@Column({
		type: "datetime",
		name: ColumnName.UserFriend.respondedAt,
		nullable: true,
		default: null,
	})
	respondedAt: Date | null;
}
