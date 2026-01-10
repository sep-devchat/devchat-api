export type SubscriptionRankable = {
	price?: number | string | null;
	limitMembers?: number | string | null;
	programmingLanguageInGroups?: number | string | null;
	runCodePerDay?: number | string | null;
};

const toFiniteNumber = (value: unknown, unlimitedToInfinity: boolean) => {
	const num = Number(value ?? 0);
	if (!Number.isFinite(num)) return 0;
	if (unlimitedToInfinity && num < 0) return Number.POSITIVE_INFINITY;
	return num;
};

/**
 * Compare subscriptions by criteria order:
 * price > limitMembers > programmingLanguageInGroups > runCodePerDay.
 *
 * Returns:
 * - `1` if `a` is better than `b`
 * - `-1` if `a` is worse than `b`
 * - `0` if equivalent on all criteria
 */
export const compareSubscriptions = (
	a?: SubscriptionRankable | null,
	b?: SubscriptionRankable | null,
): 1 | 0 | -1 => {
	const aPrice = toFiniteNumber(a?.price, false);
	const bPrice = toFiniteNumber(b?.price, false);
	if (aPrice !== bPrice) return aPrice > bPrice ? 1 : -1;

	const aMembers = toFiniteNumber(a?.limitMembers, true);
	const bMembers = toFiniteNumber(b?.limitMembers, true);
	if (aMembers !== bMembers) return aMembers > bMembers ? 1 : -1;

	const aLangs = toFiniteNumber(a?.programmingLanguageInGroups, true);
	const bLangs = toFiniteNumber(b?.programmingLanguageInGroups, true);
	if (aLangs !== bLangs) return aLangs > bLangs ? 1 : -1;

	const aRun = toFiniteNumber(a?.runCodePerDay, true);
	const bRun = toFiniteNumber(b?.runCodePerDay, true);
	if (aRun !== bRun) return aRun > bRun ? 1 : -1;

	return 0;
};
