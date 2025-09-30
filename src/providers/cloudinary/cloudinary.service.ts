import { Inject, Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import { error } from "console";

@Injectable()
export class CloudinaryService {
	constructor(@Inject("CLOUDINARY") private cloudinary) {}

	async uploadFile(
		file: Express.Multer.File,
		folder: string,
	): Promise<UploadApiResponse | UploadApiErrorResponse> {
		return new Promise((resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
						folder: folder || "devchat",
						quality: "auto",
						fetch_format: "auto",
					},
					async (error, result) => {
						if (error) reject(error);
						else resolve(result);
					},
				)
				.end(file.buffer);
		});
	}

	async deleteFile(publicId: string): Promise<any> {
		return new Promise((resolve, reject) => {
			cloudinary.uploader.destroy(publicId, (error, result) => {
				if (error) reject(error);
				else resolve(result);
			});
		});
	}

	getOptimizedUrl(publicId: string, options?: any) {
		return cloudinary.url(publicId, {
			quality: "auto",
			fetch_format: "auto",
			...options,
		});
	}
}
