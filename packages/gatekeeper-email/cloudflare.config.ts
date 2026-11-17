import { defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "gatekeeper-email",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"allow_irrevocable_stub_storage",
			"nodejs_als",
		],
		entrypoint: ".wrangler/validate/src/email.ts",
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
			EmailGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
			EmailAddress: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});
