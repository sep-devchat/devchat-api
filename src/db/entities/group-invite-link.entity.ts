import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Index,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { GroupEntity } from "./group.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.GroupInviteLink)
export class GroupInviteLinkEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.GroupInviteLink.id })
	id: string;

	@Column({ name: ColumnName.GroupInviteLink.groupId })
	groupId: string;

	@JoinColumn({ name: ColumnName.GroupInviteLink.groupId })
	@ManyToOne(() => GroupEntity)
	group: GroupEntity;

	@Column({ name: ColumnName.GroupInviteLink.createdBy })
	createdBy: string;

	@JoinColumn({ name: ColumnName.GroupInviteLink.createdBy })
	@ManyToOne(() => UserEntity)
	creator: UserEntity;

	@Column({ name: ColumnName.GroupInviteLink.token, unique: true })
	@Index()
	token: string;

	@Column({ name: ColumnName.GroupInviteLink.name, nullable: true })
	name?: string;

	@Column({ name: ColumnName.GroupInviteLink.description, nullable: true })
	description?: string;

	@Column({
		name: ColumnName.GroupInviteLink.expiresAt,
		type: "timestamp",
		nullable: true,
	})
	expiresAt?: Date;

	@Column({
		name: ColumnName.GroupInviteLink.maxUses,
		type: "int",
		nullable: true,
	})
	maxUses?: number;

	@Column({
		name: ColumnName.GroupInviteLink.usedCount,
		type: "int",
		default: 0,
	})
	usedCount: number;

	@Column({
		name: ColumnName.GroupInviteLink.isActive,
		type: "boolean",
		default: true,
	})
	isActive: boolean;

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
		onUpdate: "CURRENT_TIMESTAMP",
	})
	updatedAt: Date;
}
