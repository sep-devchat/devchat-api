import { ObjectLiteral, Repository } from "typeorm";

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {}
