export interface GetUserEmailsResponseItem {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility: string | null;
}

export type GetUserEmailsResponse = GetUserEmailsResponseItem[];
