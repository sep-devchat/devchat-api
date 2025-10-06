import { ApiProperty } from "@nestjs/swagger";

export class DeliverySignatureResponseDto {
	@ApiProperty({
		description: "Fully signed delivery URL",
		example:
			"https://res.cloudinary.com/your-cloud/image/upload/s--sig--/c_fill,w_256,h_256/devchat/avatars/user_123_avatar.webp",
	})
	url!: string;
	@ApiProperty({
		description: "Original public ID",
		example: "devchat/avatars/user_123_avatar",
	})
	publicId!: string;
}
