type ParsedOrderInfo = {
	groupId?: string;
	subscriptionId?: string;
	userId?: string;
	monthQuantity?: number;
};

const base64UrlEncode = (input: string): string => {
	return Buffer.from(input, "utf8")
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
};

const base64UrlDecode = (input: string): string => {
	let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
	const pad = base64.length % 4;
	if (pad) base64 += "=".repeat(4 - pad);
	return Buffer.from(base64, "base64").toString("utf8");
};

export const makeOrderInfo = (data: {
	uid: string;
	gid: string;
	sid: string;
	mq?: number;
}) => {
	// Keep order info URL-safe to avoid VNPay “Dữ liệu gửi sang không đúng định dạng”.
	// Prefix lets us version/identify our encoding.
	return `dc_${base64UrlEncode(JSON.stringify(data))}`;
};

export const normalizeIpAddr = (raw: unknown): string => {
	if (typeof raw !== "string") return "127.0.0.1";
	let ip = raw.trim();
	if (!ip) return "127.0.0.1";

	// If behind proxy, X-Forwarded-For can be: "client, proxy1, proxy2"
	if (ip.includes(",")) ip = ip.split(",")[0].trim();

	// IPv6-mapped IPv4: ::ffff:127.0.0.1
	if (ip.startsWith("::ffff:")) ip = ip.slice("::ffff:".length);

	// IPv4 with port: 1.2.3.4:5678
	if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.split(":")[0];

	// VNPay commonly expects IPv4; fall back if IPv6.
	if (ip.includes(":")) return "127.0.0.1";

	return ip;
};

export const parseOrderInfo = (raw: unknown): ParsedOrderInfo => {
	if (typeof raw !== "string" || raw.trim().length === 0) return {};
	const value = raw.trim();

	// Base64URL JSON format: dc_<base64url({uid,gid,sid})>
	if (value.startsWith("dc_")) {
		try {
			const decoded = base64UrlDecode(value.slice(3));
			const obj = JSON.parse(decoded);
			const mqRaw = obj?.mq ?? obj?.monthQuantity;
			const mq = Number.parseInt(String(mqRaw), 10);
			return {
				userId: obj?.uid ?? obj?.userId,
				groupId: obj?.gid ?? obj?.groupId,
				subscriptionId: obj?.sid ?? obj?.subscriptionId,
				monthQuantity: Number.isFinite(mq) ? mq : undefined,
			};
		} catch {
			return {};
		}
	}

	// JSON format: {"uid":"...","gid":"...","sid":"..."}
	if (value.startsWith("{") && value.endsWith("}")) {
		try {
			const obj = JSON.parse(value);
			const mqRaw = obj?.mq ?? obj?.monthQuantity;
			const mq = Number.parseInt(String(mqRaw), 10);
			return {
				userId: obj?.uid ?? obj?.userId,
				groupId: obj?.gid ?? obj?.groupId,
				subscriptionId: obj?.sid ?? obj?.subscriptionId,
				monthQuantity: Number.isFinite(mq) ? mq : undefined,
			};
		} catch {
			// fall through
		}
	}

	// KV format: gid=...&sid=...&uid=...
	if (value.includes("=") && value.includes("&")) {
		const parts = value.split("&");
		const map = new Map<string, string>();
		for (const part of parts) {
			const [k, ...rest] = part.split("=");
			if (!k) continue;
			map.set(k.trim(), rest.join("=").trim());
		}
		return {
			userId: map.get("uid") ?? map.get("user") ?? map.get("userId"),
			groupId: map.get("gid") ?? map.get("group") ?? map.get("groupId"),
			subscriptionId:
				map.get("sid") ?? map.get("subscription") ?? map.get("subscriptionId"),
			monthQuantity: (() => {
				const raw =
					map.get("mq") ?? map.get("monthQuantity") ?? map.get("months");
				if (!raw) return undefined;
				const n = Number.parseInt(raw, 10);
				return Number.isFinite(n) ? n : undefined;
			})(),
		};
	}

	// Legacy pipe format: group:<gid>|subscription:<sid>|user:<uid>
	const segments = value.split("|");
	const result: ParsedOrderInfo = {};
	for (const seg of segments) {
		const trimmed = seg.trim();
		if (!trimmed) continue;
		const idx = trimmed.indexOf(":");
		if (idx < 0) continue;
		const key = trimmed.slice(0, idx).trim().toLowerCase();
		const val = trimmed.slice(idx + 1).trim();
		if (!val) continue;
		if (key === "group" || key === "gid" || key === "groupid")
			result.groupId = val;
		if (key === "subscription" || key === "sid" || key === "subscriptionid")
			result.subscriptionId = val;
		if (key === "user" || key === "uid" || key === "userid")
			result.userId = val;
		if (key === "mq" || key === "monthquantity" || key === "months") {
			const n = Number.parseInt(val, 10);
			if (Number.isFinite(n)) result.monthQuantity = n;
		}
	}
	return result;
};

export const toVndAmountFromVnpay = (raw: unknown): string => {
	// vnp_Amount is usually sent as amount*100
	try {
		const value =
			typeof raw === "number" ? BigInt(Math.trunc(raw)) : BigInt(String(raw));
		return String(value);
	} catch {
		return String(raw ?? "0");
	}
};
