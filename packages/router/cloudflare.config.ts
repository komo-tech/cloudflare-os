import { bindings, defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "router",
		compatibilityDate: "2026-02-02",
		entrypoint: "src/index.ts",
		observability: {
			enabled: true,
			headSamplingRate: 1,
			logs: {
				invocationLogs: false,
			},
		},
		assets: {
			notFoundHandling: "single-page-application",
			runWorkerFirst: [
				"/api",
				"/api/*",
				"/blueprint-screenshot",
				"/blueprint-screenshot/*",
				"/gatekeeper/*",
			],
		},
		env: {
			WORKSHOP_BACKEND: bindings.worker({
				worker: "workshop-backend",
			}),
			ASSETS: bindings.assets(),
		},
	},
});
