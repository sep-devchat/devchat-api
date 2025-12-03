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

const { TableName, ColumnName, IndexName } = DbConstants;
@Entity(TableName.UserGroup)
export class UserGroupEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.UserGroup.id })
	id: string;

	@Column({ name: ColumnName.UserGroup.groupId })
	groupId: string;

	@ManyToOne(() => GroupEntity, (group) => group.userGroups, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.UserGroup.groupId })
	group: GroupEntity;

	@Column({ name: ColumnName.UserGroup.userId })
	userId: string;

	@Column({ name: ColumnName.UserGroup.addedBy })
	addedById: string;

	@ManyToOne(() => UserEntity, (user) => user.userGroups, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.UserGroup.userId })
	user: UserEntity;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.UserGroup.addedBy })
	addedBy: UserEntity;

	@Column({
		type: "datetime",
		name: ColumnName.UserGroup.joinedAt,
		nullable: true,
	})
	joinedAt: Date | null;

	@Column({ name: ColumnName.UserGroup.invitedAt, type: "datetime" })
	invitedAt: Date;
}
