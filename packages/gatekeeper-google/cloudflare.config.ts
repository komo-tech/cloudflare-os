import { defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "gatekeeper-google",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"allow_irrevocable_stub_storage",
			"nodejs_als",
		],
		entrypoint: ".wrangler/validate/src/google.ts",
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
			GmailGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
			BigQueryGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
			GoogleCalendarGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
			GoogleSheetsGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});
