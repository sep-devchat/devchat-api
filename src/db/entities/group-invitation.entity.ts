import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { GroupEntity } from "./group.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.GroupInvitation)
export class GroupInvitationEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.GroupInvitation.id })
	id: string;

	@Column({ name: ColumnName.GroupInvitation.fromUserId })
	fromUserId: string;

	@JoinColumn({ name: ColumnName.GroupInvitation.fromUserId })
	@ManyToOne(() => UserEntity)
	fromUser: UserEntity;

	@Column({ name: ColumnName.GroupInvitation.toUserId })
	toUserId: string;

	@JoinColumn({ name: ColumnName.GroupInvitation.toUserId })
	@ManyToOne(() => UserEntity)
	toUser: UserEntity;

	@Column({ name: ColumnName.GroupInvitation.groupId })
	groupId: string;

	@JoinColumn({ name: ColumnName.GroupInvitation.groupId })
	@ManyToOne(() => GroupEntity)
	group: GroupEntity;

	@Column({ name: ColumnName.GroupInvitation.message, nullable: true })
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
