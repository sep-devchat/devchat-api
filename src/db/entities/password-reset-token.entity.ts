import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	JoinColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { DbConstants } from "@db/db-constants";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.PasswordResetToken)
export class PasswordResetTokenEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.PasswordResetToken.id })
	id: string;

	@Column({ name: ColumnName.PasswordResetToken.userId, type: "uuid" })
	@Index(IndexName.PasswordResetToken.userId)
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: ColumnName.PasswordResetToken.userId })
	user: UserEntity;

	@Column({ name: ColumnName.PasswordResetToken.verifyCode, length: 10 })
	@Index(IndexName.PasswordResetToken.verifyCode)
	verifyCode: string; // 6-digit numeric code or short token

	@Column({ name: ColumnName.PasswordResetToken.expiresAt, type: "datetime" })
	expiresAt: Date;

	@Column({
		name: ColumnName.PasswordResetToken.usedAt,
		type: "datetime",
		nullable: true,
		default: null,
	})
	usedAt: Date | null;

	@Column({
		name: ColumnName.PasswordResetToken.attempts,
		type: "int",
		default: 0,
	})
	attempts: number;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.Audit.updatedAt })
	updatedAt: Date;
}
