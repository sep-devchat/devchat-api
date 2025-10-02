import { Env } from "@utils";
import { v2 as cloudinary } from "cloudinary";
import { ConfigService } from "@nestjs/config";

export const CloudinaryProvider = {
	provide: "CLOUDINARY",
	useFactory: () => {
		cloudinary.config({
			cloud_name: Env.CLOUDINARY_CLOUD_NAME,
			api_key: Env.CLOUDINARY_API_KEY,
			api_secret: Env.CLOUDINARY_API_SECRET,
		});
		return cloudinary;
	},
	inject: [ConfigService],
};
