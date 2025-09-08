import { DynamicModule, Global, Module } from "@nestjs/common";
import { GitHubModuleParams } from "./types";
import { GITHUB_MODULE_PARAMS_TOKEN } from "./github.constants";
import { GitHubService } from "./github.service";

@Module({
	providers: [GitHubService],
	exports: [GitHubService],
})
@Global()
export class GitHubModule {
	static register(params: GitHubModuleParams): DynamicModule {
		return {
			module: GitHubModule,
			providers: [
				{
					provide: GITHUB_MODULE_PARAMS_TOKEN,
					useValue: params,
				},
			],
		};
	}
}
