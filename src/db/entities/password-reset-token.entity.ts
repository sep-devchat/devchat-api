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

@Entity("password_reset_token")
export class PasswordResetTokenEntity {
	@PrimaryGeneratedColumn("uuid", { name: "password_reset_token_id" })
	id: string;

	@Column({ name: "user_id" })
	@Index("idx_password_reset_user")
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: "user_id" })
	user: UserEntity;

	@Column({ name: "code", length: 10 })
	@Index("idx_password_reset_code")
	code: string; // 6-digit numeric code or short token

	@Column({ name: "expires_at", type: "datetime" })
	expiresAt: Date;

	@Column({ name: "used_at", type: "datetime", nullable: true, default: null })
	usedAt: Date | null;

	@Column({ name: "attempts", type: "int", default: 0 })
	attempts: number;

	@CreateDateColumn({ name: "created_at" })
	createdAt: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt: Date;
}
