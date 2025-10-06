import { Inject, Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import {
	UploadApiErrorResponse,
	UploadApiResponse,
	TransformationOptions,
} from "cloudinary";
import { Env } from "@utils";

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

	/**
	 * Generate parameters & signature for client-side direct upload using Cloudinary unsigned request flow.
	 * The client will send these along with the file to Cloudinary upload endpoint.
	 */
	generateUploadSignature(params: {
		folder?: string;
		publicId?: string;
		eager?: string[]; // transformation strings like "c_fill,w_200,h_200"
		invalidate?: boolean;
	}) {
		const timestamp = Math.round(Date.now() / 1000);
		const toSign: Record<string, any> = { timestamp };
		if (params.folder) toSign.folder = params.folder;
		if (params.publicId) toSign.public_id = params.publicId;
		if (params.eager && params.eager.length)
			toSign.eager = params.eager.join("|");
		if (typeof params.invalidate === "boolean")
			toSign.invalidate = params.invalidate;

		const signature = cloudinary.utils.api_sign_request(
			toSign,
			Env.CLOUDINARY_API_SECRET,
		);

		return {
			cloudName: Env.CLOUDINARY_CLOUD_NAME,
			apiKey: Env.CLOUDINARY_API_KEY,
			timestamp,
			signature,
			...(params.folder ? { folder: params.folder } : {}),
			...(params.publicId ? { public_id: params.publicId } : {}),
			...(params.eager && params.eager.length ? { eager: toSign.eager } : {}),
		};
	}

	/**
	 * Generate a signed delivery URL (prevents tampering with transformation).
	 */
	generateSignedDeliveryUrl(args: {
		publicId: string;
		transformation?: TransformationOptions | TransformationOptions[];
		format?: string;
	}) {
		const { publicId, transformation, format } = args;
		const url = cloudinary.url(publicId, {
			secure: true,
			sign_url: true,
			format,
			transformation,
			quality: "auto",
			fetch_format: "auto",
		});
		return { url, publicId };
	}
}
