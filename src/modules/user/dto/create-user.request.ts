import { UserEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";
import { UserRequest } from "./user.request";

export class CreateUserRequest extends UserRequest {}
