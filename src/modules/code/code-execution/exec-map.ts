import { ProgrammingLanguageEnum } from "@utils";
import {
	javaExecFunction,
	javascriptExecFunction,
	pythonExecFunction,
} from "./exec-functions";
import { CodeExecutionFunction } from "./types";

export const execMap: Record<ProgrammingLanguageEnum, CodeExecutionFunction> = {
	[ProgrammingLanguageEnum.JAVASCRIPT]: javascriptExecFunction,
	[ProgrammingLanguageEnum.JAVA]: javaExecFunction,
	[ProgrammingLanguageEnum.PYTHON]: pythonExecFunction,
};
