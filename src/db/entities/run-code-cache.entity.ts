import { DbConstants } from "@db/db-constants";
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

const { ColumnName, IndexName, TableName } = DbConstants;

@Entity(TableName.RunCodeCache)
@Index(IndexName.RunCodeCache.typeAndTarget, ["runCodeType", "targetId"])
export class RunCodeCacheEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.RunCodeCache.id })
	id: string;

	@Column({ name: ColumnName.RunCodeCache.targetId })
	targetId: string;

	@Column({ name: ColumnName.RunCodeCache.runCodeType })
	runCodeType: number;

	@Column({ name: ColumnName.RunCodeCache.result, type: "text" })
	result: string;
}
