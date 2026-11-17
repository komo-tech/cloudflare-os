import { defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "gatekeeper-scheduler",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"allow_irrevocable_stub_storage",
			"nodejs_als",
		],
		entrypoint: ".wrangler/validate/src/worker.ts",
		observability: {
			enabled: true,
			headSamplingRate: 1,
			logs: {
				invocationLogs: false,
			},
		},
		exports: {
			ScheduleDriver: exports.durableObject({
				storage: "sqlite",
			}),
			SchedulerGatekeeper: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});
