import { config } from "dotenv";

config();

export const Env = {
	LISTEN_PORT: Number(process.env.LISTEN_PORT || "0"),
	DB_HOST: process.env.DB_HOST || "",
	DB_PORT: Number(process.env.DB_PORT || "0"),
	DB_NAME: process.env.DB_NAME || "",
	DB_USER: process.env.DB_USER || "",
	DB_PASS: process.env.DB_PASS || "",
	DB_LOGGING: process.env.DB_LOGGING === "true",
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
	EMAIL_HOST: process.env.EMAIL_HOST || "",
	EMAIL_PORT: Number(process.env.EMAIL_PORT || "0"),
	EMAIL_SECURE: process.env.EMAIL_SECURE === "true",
	EMAIL_USER: process.env.EMAIL_USER || "",
	EMAIL_PASS: process.env.EMAIL_PASS || "",
	FRONTEND_VERIFY_URL: process.env.FRONTEND_VERIFY_URL || "",
	EMAIL_FROM: process.env.EMAIL_FROM || "",
	CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
	USE_DOCKER_DIND: process.env.USE_DOCKER_DIND === "true",
	DOCKER_DIND_HOST: process.env.DOCKER_DIND_HOST || "",
	DOCKER_DIND_PORT: Number(process.env.DOCKER_DIND_PORT || "0"),
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
	OPENAI_MODEL: process.env.OPENAI_MODEL || "",
	GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
	GOOGLE_MODEL: process.env.GOOGLE_MODEL || "",
	CODE_RUNNER_SANDBOX_POOL_SIZE: Number(
		process.env.CODE_RUNNER_SANDBOX_POOL_SIZE || "0",
	),
} as const;

console.log(Env);
