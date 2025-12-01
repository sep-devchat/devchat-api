export type CodeExecutionResult = {
	output: string;
	timeout: boolean;
};

export type CodeExecutionFunction = (
	code: string,
) => Promise<CodeExecutionResult>;
