import { defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "gatekeeper-homeassistant",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"allow_irrevocable_stub_storage",
		],
		entrypoint: ".wrangler/validate/src/homeassistant.ts",
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
			HomeAssistantGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});
