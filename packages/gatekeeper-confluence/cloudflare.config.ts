import { defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "gatekeeper-confluence",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"allow_irrevocable_stub_storage",
		],
		entrypoint: ".wrangler/validate/src/confluence.ts",
		observability: {
			enabled: true,
			headSamplingRate: 1,
			logs: {
				invocationLogs: false,
			},
		},
		exports: {
			UserAccount: exports.durableObject({
				storage: "sqlite",
			}),
			ConfluenceSiteGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
			ConfluenceSpaceGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
			ConfluenceContentGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});
