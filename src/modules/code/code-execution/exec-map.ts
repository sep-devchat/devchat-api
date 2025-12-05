import { ProgrammingLanguageEnum } from "@utils";
import {
	cExecFunction,
	cppExecFunction,
	javaExecFunction,
	javascriptExecFunction,
	pythonExecFunction,
} from "./exec-functions";
import { CodeExecutionFunction } from "./types";

export const languageSandboxImageMap: Record<ProgrammingLanguageEnum, string> =
	{
		[ProgrammingLanguageEnum.JAVASCRIPT]: "node:22",
		[ProgrammingLanguageEnum.JAVA]: "openjdk:21-jdk",
		[ProgrammingLanguageEnum.PYTHON]: "python:3.14",
		[ProgrammingLanguageEnum.C]: "gcc:latest",
		[ProgrammingLanguageEnum.CPP]: "gcc:latest",
	};

export const execMap: Record<ProgrammingLanguageEnum, CodeExecutionFunction> = {
	[ProgrammingLanguageEnum.JAVASCRIPT]: javascriptExecFunction,
	[ProgrammingLanguageEnum.JAVA]: javaExecFunction,
	[ProgrammingLanguageEnum.PYTHON]: pythonExecFunction,
	[ProgrammingLanguageEnum.C]: cExecFunction,
	[ProgrammingLanguageEnum.CPP]: cppExecFunction,
};
