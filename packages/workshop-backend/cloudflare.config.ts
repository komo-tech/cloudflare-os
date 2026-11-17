import { bindings, defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "workshop-backend",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"allow_irrevocable_stub_storage",
			"enhanced_error_serialization",
			"global_fetch_strictly_public",
			"nodejs_compat",
		],
		entrypoint: ".wrangler/validate/src/server.ts",
		observability: {
			enabled: true,
			headSamplingRate: 1,
			logs: {
				invocationLogs: false,
			},
			traces: {
				enabled: true,
				headSamplingRate: 0.5,
			},
		},
		env: {
			BLUEPRINTS: bindings.kv({}),
			AVATARS: bindings.kv({}),
			BLUEPRINT_CONTENT: bindings.r2({
				name: "gadgets-blueprint-content",
			}),
			BROWSER: bindings.browser({}),
			LOADER: bindings.workerLoader(),
		},
		exports: {
			UserDurableObject: exports.durableObject({
				storage: "sqlite",
			}),
			OverseerDurableObject: exports.durableObject({
				storage: "sqlite",
			}),
			AdminSettings: exports.durableObject({
				storage: "sqlite",
			}),
			PendingLogin: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});