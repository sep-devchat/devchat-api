import { ProgrammingLanguageEnum } from "@utils";
import {
	cExecFunction,
	cppExecFunction,
	javaExecFunction,
	javascriptExecFunction,
	pythonExecFunction,
} from "./exec-functions";
import { CodeExecutionFunction } from "./types";

export const execMap: Record<ProgrammingLanguageEnum, CodeExecutionFunction> = {
	[ProgrammingLanguageEnum.JAVASCRIPT]: javascriptExecFunction,
	[ProgrammingLanguageEnum.JAVA]: javaExecFunction,
	[ProgrammingLanguageEnum.PYTHON]: pythonExecFunction,
	[ProgrammingLanguageEnum.C]: cExecFunction,
	[ProgrammingLanguageEnum.CPP]: cppExecFunction,
};
