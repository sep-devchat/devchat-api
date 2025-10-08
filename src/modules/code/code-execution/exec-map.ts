import { ProgrammingLanguageEnum } from "../code.enums";
import { javaExecFunction, javascriptExecFunction } from "./exec-functions";
import { CodeExecutionFunction } from "./types";

export const execMap: Record<ProgrammingLanguageEnum, CodeExecutionFunction> = {
	[ProgrammingLanguageEnum.JAVASCRIPT]: javascriptExecFunction,
	[ProgrammingLanguageEnum.JAVA]: javaExecFunction,
};
