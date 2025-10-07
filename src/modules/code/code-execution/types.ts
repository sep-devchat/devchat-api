export type CodeExecutionResult = {
	output: string;
};

export type CodeExecutionFunction = (
	code: string,
) => Promise<CodeExecutionResult>;
