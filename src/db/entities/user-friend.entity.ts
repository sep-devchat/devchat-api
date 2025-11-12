import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Index,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { DbConstants } from "../db-constants";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.UserFriend)
@Index(["userId", "friendId"], { unique: true })
export class UserFriendEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.UserFriend.id })
	id: string;

	@Column({ name: ColumnName.UserFriend.userId })
	userId: string;

	@JoinColumn({ name: ColumnName.UserFriend.userId })
	@ManyToOne(() => UserEntity)
	user: UserEntity;

	@Column({ name: ColumnName.UserFriend.friendId })
	friendId: string;

	@JoinColumn({ name: ColumnName.UserFriend.friendId })
	@ManyToOne(() => UserEntity)
	friend: UserEntity;

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
}
