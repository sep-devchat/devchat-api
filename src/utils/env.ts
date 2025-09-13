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
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
	JWT_REFRESH_EXPIRES_IN: Number(process.env.JWT_REFRESH_EXPIRES_IN || "0"),
	APP_DOMAIN: process.env.APP_DOMAIN || "",
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
	GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
	GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
	PKCE_AUTH_CODE_JWT_SECRET: process.env.PKCE_AUTH_CODE_JWT_SECRET || "",
	PKCE_AUTH_CODE_JWT_EXPIRES_IN: Number(
		process.env.PKCE_AUTH_CODE_JWT_EXPIRES_IN || "0",
	),
} as const;

console.log(Env);
