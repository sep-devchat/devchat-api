import { config } from "dotenv";

config();

export const Env = {
	LISTEN_PORT: Number(process.env.LISTEN_PORT || "0"),
	DB_HOST: process.env.DB_HOST || "",
	DB_PORT: Number(process.env.DB_PORT || "0"),
	DB_NAME: process.env.DB_NAME || "",
	DB_USER: process.env.DB_USER || "",
	DB_PASS: process.env.DB_PASS || "",
	ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === "true",
	JWT_SECRET: process.env.JWT_SECRET || "",
	JWT_EXPIRES_IN: Number(process.env.JWT_EXPIRES_IN || "0"),
	JWT_ISSUER: process.env.JWT_ISSUER || "",
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
} as const;

console.log(Env);
