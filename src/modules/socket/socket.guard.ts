import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WsException } from "@nestjs/websockets";
import { SKIP_AUTH_KEY } from "@utils";
import { Socket } from "socket.io";
import { SocketConstants } from "./socket.constants";

const { Events } = SocketConstants;

@Injectable()
export class SocketGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	async canActivate(context: ExecutionContext) {
		const skip =
			this.reflector.get(SKIP_AUTH_KEY, context.getClass()) ||
			this.reflector.get<boolean>(SKIP_AUTH_KEY, context.getHandler());
		if (skip) return true;

		const client = context.switchToWs().getClient<Socket>();
		console.log("SocketGuard: Client attempting to check:", client.id);
		if (!client.data.user)
			throw new WsException("Unauthorized: No user data on socket");
		const exp = client.data.exp;
		const now = Math.floor(Date.now() / 1000);
		if (exp && exp < now) {
			client.emit(Events.REQUEST_AUTHENTICATION);
			throw new WsException("Unauthorized: Token expired");
		}
		console.log(
			"SocketGuard: Client authorized:",
			client.id,
			"User:",
			client.data.user.username,
		);
		return true;
	}
}
