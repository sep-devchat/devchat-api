import { ProgrammingLanguageEnum } from "@utils";

export const imageMap: Record<ProgrammingLanguageEnum, string> = {
	[ProgrammingLanguageEnum.JAVASCRIPT]: "node:22",
	[ProgrammingLanguageEnum.PYTHON]: "python:3.14",
	[ProgrammingLanguageEnum.JAVA]: "eclipse-temurin:21",
	[ProgrammingLanguageEnum.C]: "gcc:latest",
	[ProgrammingLanguageEnum.CPP]: "gcc:latest",
};
