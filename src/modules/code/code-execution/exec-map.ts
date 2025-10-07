import { ProgrammingLanguageEnum } from "../code.enums";
import { javascriptExecFunction } from "./exec-functions";
import { CodeExecutionFunction } from "./types";

export const execMap: Record<ProgrammingLanguageEnum, CodeExecutionFunction> = {
	[ProgrammingLanguageEnum.JAVASCRIPT]: javascriptExecFunction,
};
