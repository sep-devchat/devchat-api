import { Controller, Get } from "@nestjs/common";
import { SkipAuth } from "@utils";

@Controller()
@SkipAuth()
export class AppController {
	@Get("/health")
	healthCheck() {
		return "OK";
	}
}
