import { Injectable } from "@nestjs/common";

type Timestamp = number;

interface GroupViewContext {
	groupId: string;
	channelId: string;
	updatedAt: Timestamp;
}

interface DirectViewContext {
	peerUserId: string;
	updatedAt: Timestamp;
}

interface ThreadViewContext {
	channelId: string;
	threadId: string;
	updatedAt: Timestamp;
}

type ContextMap<T> = Map<string, Map<string, T>>; // userId -> socketId -> context

const PRESENCE_TTL_MS = 60_000;

@Injectable()
export class ChatPresenceService {
	private readonly groupViews: ContextMap<GroupViewContext> = new Map();
	private readonly directViews: ContextMap<DirectViewContext> = new Map();
	private readonly threadViews: ContextMap<ThreadViewContext> = new Map();

	setGroupView(
		userId: string,
		socketId: string,
		groupId: string,
		channelId: string,
	) {
		this.setContext(this.groupViews, userId, socketId, {
			groupId,
			channelId,
			updatedAt: Date.now(),
		});
	}

	clearGroupView(userId: string, socketId: string) {
		this.clearContext(this.groupViews, userId, socketId);
	}

	setDirectView(userId: string, socketId: string, peerUserId: string) {
		this.setContext(this.directViews, userId, socketId, {
			peerUserId,
			updatedAt: Date.now(),
		});
	}

	clearDirectView(userId: string, socketId: string) {
		this.clearContext(this.directViews, userId, socketId);
	}

	setThreadView(
		userId: string,
		socketId: string,
		channelId: string,
		threadId: string,
	) {
		this.setContext(this.threadViews, userId, socketId, {
			channelId,
			threadId,
			updatedAt: Date.now(),
		});
	}

	clearThreadView(userId: string, socketId: string) {
		this.clearContext(this.threadViews, userId, socketId);
	}

	clearAllForSocket(userId: string, socketId: string) {
		this.clearContext(this.groupViews, userId, socketId);
		this.clearContext(this.directViews, userId, socketId);
		this.clearContext(this.threadViews, userId, socketId);
	}

	isViewingGroupChannel(userId: string, groupId: string, channelId: string) {
		return this.hasActiveContext(
			this.groupViews,
			userId,
			(ctx) => ctx.groupId === groupId && ctx.channelId === channelId,
		);
	}

	isViewingDirectConversation(userId: string, peerUserId: string) {
		return this.hasActiveContext(
			this.directViews,
			userId,
			(ctx) => ctx.peerUserId === peerUserId,
		);
	}

	isViewingThread(userId: string, channelId: string, threadId: string) {
		return this.hasActiveContext(
			this.threadViews,
			userId,
			(ctx) => ctx.channelId === channelId && ctx.threadId === threadId,
		);
	}

	private setContext<T extends { updatedAt: Timestamp }>(
		store: ContextMap<T>,
		userId: string,
		socketId: string,
		context: T,
	) {
		let userContexts = store.get(userId);
		if (!userContexts) {
			userContexts = new Map();
			store.set(userId, userContexts);
		}
		userContexts.set(socketId, context);
	}

	private clearContext<T>(
		store: ContextMap<T>,
		userId: string,
		socketId: string,
	) {
		const userContexts = store.get(userId);
		if (!userContexts) return;
		userContexts.delete(socketId);
		if (userContexts.size === 0) {
			store.delete(userId);
		}
	}

	private hasActiveContext<T extends { updatedAt: Timestamp }>(
		store: ContextMap<T>,
		userId: string,
		predicate: (context: T) => boolean,
	) {
		const userContexts = store.get(userId);
		if (!userContexts) return false;
		const now = Date.now();
		let has = false;
		for (const [socketId, ctx] of userContexts) {
			if (now - ctx.updatedAt > PRESENCE_TTL_MS) {
				userContexts.delete(socketId);
				continue;
			}
			if (predicate(ctx)) {
				has = true;
				break;
			}
		}
		if (userContexts.size === 0) {
			store.delete(userId);
		}
		return has;
	}
}
