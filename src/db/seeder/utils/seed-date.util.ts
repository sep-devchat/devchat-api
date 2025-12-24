import * as fs from "fs";
import * as path from "path";

interface SeedDateRangeConfig {
	startDate: string;
	endDate: string;
}

interface SeedDateRange {
	start: Date;
	end: Date;
}

const DEFAULT_RANGE: SeedDateRange = (() => {
	const end = new Date();
	const start = new Date(end);
	start.setMonth(start.getMonth() - 3);
	return { start, end };
})();

let cachedRange: SeedDateRange | null = null;

function loadSeedDateRange(): SeedDateRange {
	if (cachedRange) {
		return cachedRange;
	}

	const filePath = path.join(
		__dirname,
		"../raw-data/data-create-update-date-range.json",
	);
	try {
		const raw = fs.readFileSync(filePath, "utf-8");
		const parsed = JSON.parse(raw) as SeedDateRangeConfig;
		const start = new Date(parsed.startDate);
		const end = new Date(parsed.endDate);
		if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())) {
			if (start.getTime() <= end.getTime()) {
				cachedRange = { start, end };
				return cachedRange;
			}
		}
		console.warn("Invalid seed date range config; using fallback window.");
	} catch (error) {
		console.warn("Unable to load seed date range config:", error);
	}

	cachedRange = DEFAULT_RANGE;
	return cachedRange;
}

export function getSeedDateRange(): SeedDateRange {
	return loadSeedDateRange();
}

export function randomDateInSeedRange(options?: {
	min?: Date | null;
	max?: Date | null;
}): Date {
	const { start, end } = loadSeedDateRange();
	const minCandidate = options?.min?.getTime();
	const maxCandidate = options?.max?.getTime();
	const hasMin =
		typeof minCandidate === "number" && Number.isFinite(minCandidate);
	const hasMax =
		typeof maxCandidate === "number" && Number.isFinite(maxCandidate);
	let min = Math.max(
		start.getTime(),
		hasMin ? (minCandidate as number) : start.getTime(),
	);
	let max = Math.min(
		end.getTime(),
		hasMax ? (maxCandidate as number) : end.getTime(),
	);

	if (min > max) {
		min = start.getTime();
		max = end.getTime();
	}

	if (min === max) {
		return new Date(min);
	}

	const ts = min + Math.random() * (max - min);
	return new Date(ts);
}

export function randomDateAfter(
	min?: Date | null,
	options?: { max?: Date | null },
): Date {
	return randomDateInSeedRange({
		min: min ?? null,
		max: options?.max ?? null,
	});
}

export function maybeDateInSeedRange(
	probability = 0.5,
	opts?: { min?: Date | null; max?: Date | null },
): Date | null {
	return Math.random() < probability
		? randomDateInSeedRange({ min: opts?.min ?? null, max: opts?.max ?? null })
		: null;
}

type TimestampMutable = { createdAt?: Date | null; updatedAt?: Date | null };

export function applySeedTimestamps<T>(
	entity: T,
	options?: {
		minCreatedAt?: Date | null;
		maxUpdatedAt?: Date | null;
	},
): T {
	const target = entity as T & TimestampMutable;
	const createdAt =
		target.createdAt ??
		randomDateInSeedRange({
			min: options?.minCreatedAt ?? null,
			max: options?.maxUpdatedAt ?? null,
		});
	const updatedAt =
		target.updatedAt ??
		randomDateInSeedRange({
			min: createdAt,
			max: options?.maxUpdatedAt ?? null,
		});
	target.createdAt = createdAt;
	target.updatedAt = updatedAt >= createdAt ? updatedAt : createdAt;
	return entity;
}

export function applySeedTimestampsBulk<T>(
	entities: T[],
	options?: {
		minCreatedAt?: Date | null;
		maxUpdatedAt?: Date | null;
	},
): T[] {
	entities.forEach((entity) => applySeedTimestamps(entity, options));
	return entities;
}
