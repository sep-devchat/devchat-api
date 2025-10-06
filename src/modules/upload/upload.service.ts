import { Injectable } from "@nestjs/common";
import { CreateUploadRequest, UpdateUploadRequest, UploadQuery } from "./dto";
import { CloudinaryService } from "@providers/cloudinary";
import { NoFileUploadedError, UploadedException } from "./errors";
import { AttachmentRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";

const commonFolderPath = "devchat";

@Injectable()
export class UploadService {
	constructor(
		private readonly cloudinaryService: CloudinaryService,
		private readonly attachmentRepo: AttachmentRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async uploadAttachment(
		file: Express.Multer.File,
		folder?: string,
		messageId?: string,
	) {
		if (!file) {
			throw new NoFileUploadedError();
		}

		const folderPath = folder
			? `${commonFolderPath}/${folder}`
			: commonFolderPath;

		try {
			const result = await this.cloudinaryService.uploadFile(file, folderPath);

			await this.attachmentRepo.insert({
				originalFileName: result.original_filename,
				filePath: result.secure_url,
				fileType: result.resource_type,
				fileSize: file.size,
				messageId: messageId || null,
				fileName: result.display_name,
				folder: folderPath,
				format: result.format,
				publicId: result.public_id,
				uploadedBy: this.cls.get("profile")?.id ?? null,
			});
		} catch (error) {
			throw new UploadedException(error?.message || error);
		}
	}

	async deleteAttachment(publicId: string) {
		try {
			await this.cloudinaryService.deleteFile(publicId);
			await this.attachmentRepo.delete({ publicId });
		} catch (error) {
			throw new UploadedException(error?.message || error);
		}
	}

	/**
	 * Persist a previously uploaded (direct client-side) Cloudinary asset response.
	 * Accepts sanitized subset of Cloudinary response.
	 */
	async saveCloudinaryUpload(payload: {
		public_id: string;
		original_filename: string;
		secure_url: string;
		resource_type: string;
		bytes: number;
		format: string;
		asset_folder?: string;
		display_name?: string;
		messageId?: string;
	}) {
		// Derive folder: prefer explicit asset_folder else parse from public_id before last segment
		let folder = payload.asset_folder;
		if (!folder) {
			const parts = payload.public_id.split("/");
			if (parts.length > 1) {
				folder = parts.slice(0, -1).join("/");
			} else {
				folder = commonFolderPath; // fallback to root common
			}
		}

		await this.attachmentRepo.insert({
			originalFileName: payload.original_filename,
			filePath: payload.secure_url,
			fileType: payload.resource_type,
			fileSize: payload.bytes,
			messageId: payload.messageId || null,
			fileName: payload.display_name || payload.original_filename,
			folder,
			format: payload.format,
			publicId: payload.public_id,
			uploadedBy: this.cls.get("profile")?.id ?? null,
		});

		return { publicId: payload.public_id };
	}
}
