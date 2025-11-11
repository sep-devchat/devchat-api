import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIRequestTypeEnum } from "@utils";

function systemInstruction(type: AIRequestTypeEnum): string {
	switch (type) {
		case AIRequestTypeEnum.SUGGEST:
			return [
				"You are an expert assistant that proposes practical, concise suggestions.",
				"Provide clear, actionable items. Use numbered lists when helpful.",
				"If code is relevant, include minimal self-contained code blocks.",
			].join(" ");
		case AIRequestTypeEnum.EXPLAIN:
			return [
				"You are a helpful explainer that breaks topics into simple terms.",
				"Explain step-by-step and include brief examples when useful.",
				"Prefer clarity over verbosity. Avoid unrelated tangents.",
			].join(" ");
		case AIRequestTypeEnum.REFACTOR:
			return [
				"You are a senior engineer who refactors code for readability, maintainability, and performance.",
				"Return the refactored result and a short rationale.",
				"Preserve behavior. Use idiomatic patterns of the language.",
			].join(" ");
		case AIRequestTypeEnum.CHAT:
		default:
			return [
				"You are a concise, friendly assistant.",
				"Answer directly and helpfully. Ask clarifying questions only if necessary.",
			].join(" ");
	}
}

/**
 * Build a ChatPromptTemplate for the given request type.
 * Variables:
 * - input: the user's prompt
 * - context: optional JSON string with extra context
 */
export function buildPrompt(type: AIRequestTypeEnum): ChatPromptTemplate {
	const sys = systemInstruction(type);
	return ChatPromptTemplate.fromMessages([
		["system", sys],
		[
			"user",
			["Context (JSON):\n{context}\n\n", "User input:\n{input}"].join("\n"),
		],
	]);
}
