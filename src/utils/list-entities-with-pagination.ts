import { PaginationDto } from "./pagination.dto";

export class ListEntitiesWithPagination<T> {
	entities: T[];
	pagination: PaginationDto;
}
