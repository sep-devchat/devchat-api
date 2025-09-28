import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "@modules/user";

@Module({
	providers: [AuthService],
	exports: [AuthService],
	controllers: [AuthController],
	imports: [UserModule],
})
export class AuthModule {}
