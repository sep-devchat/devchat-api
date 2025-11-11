import { AuthService } from "@modules/auth";
import { InvalidTokenError } from "@modules/auth/errors";
import { UserService } from "@modules/user";
import { Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { AuthenticateRequest, JoinRoomRequest } from "./dto";
import { SocketConstants } from "./socket.constants";
import { ChannelRepository, GroupRepository } from "@db/repositories";
import { JoinRoomFailedError } from "./errors";
import { constructRoomName, constructUserRoomName } from "@utils";
import { NotificationEntity } from "@db/entities";
import { NotificationResponse } from "@modules/notification/dto";

const { Events } = SocketConstants;

@Injectable()
export class SocketService {
	server: Server;
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly groupRepo: GroupRepository,
		private readonly channelRepo: ChannelRepository,
	) {}

	async authenticateSocket(client: Socket, payload: AuthenticateRequest) {
		try {
			console.log(`Client ${client.id} is trying to authenticate`);
			const token = payload.token;
			if (!token) throw new InvalidTokenError();
			const decoded = this.authService.verifyAccessToken(token);
			const user = await this.userService.findById(decoded.sub);
			client.data.user = user;
			client.data.exp = decoded.exp;
			console.log(
				"Client authenticated:",
				client.id,
				"User:",
				user.username,
				"Exp:",
				new Date(decoded.exp * 1000).toISOString(),
			);
			// Notify client of successful authentication
			client.join(constructUserRoomName(user.id));
			client.emit(Events.SOCKET_READY);
		} catch (err) {
			if (!err.message)
				console.error("Error during socket authentication:", err);
			client.emit(Events.AUTHENTICATE_FAILED, {
				message: "Authentication failed",
				detail: err.message ?? "Unknown error",
			});
			client.disconnect();
		}

		// Clear the timeout set for authentication
		clearTimeout(client.data.timeout);
	}

	async joinRoom(client: Socket, payload: JoinRoomRequest) {
		const { groupId, channelId } = payload;

		// Validate group exists
		const group = await this.groupRepo.findOne({
			where: [
				{
					id: groupId,
					createdBy: client.data.user.id,
				},
				{
					id: groupId,
					userGroups: {
						userId: client.data.user.id,
					},
				},
			],
		});
		if (!group) throw new JoinRoomFailedError("Group not found");

		// Validate that the channel belongs to the provided group
		const channel = await this.channelRepo.findOne({
			where: { id: channelId, groupId: group.id },
		});
		if (!channel) throw new JoinRoomFailedError("Channel not found in group");

		// Check for existing room and leave if present
		if (client.data.room) {
			await client.leave(client.data.room);
		}

		const room = constructRoomName(groupId, channelId);
		await client.join(room);

		// Store for future usage
		client.data.group = group;
		client.data.channel = channel;
		client.data.room = room;

		client.emit(Events.JOINED_ROOM, {
			room,
			groupId,
			channelId,
		});
	}

	sendNotification(notification: NotificationEntity) {
		this.server
			.to(constructUserRoomName(notification.toUserId))
			.emit(Events.NOTIFICATION, NotificationResponse.fromEntity(notification));
	}
}
