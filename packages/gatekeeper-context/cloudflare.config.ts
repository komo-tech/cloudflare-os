import { bindings, defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "gatekeeper-context",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"nodejs_compat",
			"allow_irrevocable_stub_storage",
		],
		entrypoint: ".wrangler/validate/src/index.ts",
		observability: {
			enabled: true,
			headSamplingRate: 1,
			logs: {
				invocationLogs: false,
			},
		},
		env: {
			CONTEXT_COLLECTIONS: bindings.kv({}),
		},
		exports: {
			ContextCollectionDurableObject: exports.durableObject({
				storage: "sqlite",
			}),
			UserLibraryDurableObject: exports.durableObject({
				storage: "sqlite",
			}),
			LibraryRegistryDurableObject: exports.durableObject({
				storage: "sqlite",
			}),
			ContextGatekeeper: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});