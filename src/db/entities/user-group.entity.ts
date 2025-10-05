import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Table,
} from "typeorm";
import { GroupEntity } from "./group.entity";
import { UserEntity } from "./user.entity";
import { Profile } from "@modules/auth/dto";
import { InvitationStatus } from "@modules/user-group";

const { TableName, ColumnName, IndexName } = DbConstants;
@Entity(TableName.UserGroup)
export class UserGroupEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.UserGroup.id })
	id: string;

	@ManyToOne(() => GroupEntity)
	@JoinColumn({ name: ColumnName.UserGroup.groupId })
	group: GroupEntity;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: ColumnName.UserGroup.userId })
	user: UserEntity;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: ColumnName.UserGroup.addedBy })
	addedBy: UserEntity;

	@Column({
		type: "datetime",
		name: ColumnName.UserGroup.joinedAt,
		nullable: true,
	})
	joinedAt: Date | null;

	@Column({
		name: ColumnName.UserGroup.status,
		type: "enum",
		enum: InvitationStatus,
		default: InvitationStatus.Pending,
	})
	status: InvitationStatus;

	@Column({ name: ColumnName.UserGroup.invitedAt, type: "datetime" })
	invitedAt: Date;
}
