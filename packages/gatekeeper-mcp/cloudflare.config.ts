import { bindings, defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "gatekeeper-mcp",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"allow_irrevocable_stub_storage",
			"global_fetch_strictly_public",
		],
		entrypoint: ".wrangler/validate/src/mcp.ts",
		observability: {
			enabled: true,
			headSamplingRate: 1,
			logs: {
				invocationLogs: false,
			},
		},
		env: {
			MCP_ALLOW_INSECURE: bindings.text("false"),
		},
		exports: {
			McpAccount: exports.durableObject({
				storage: "sqlite",
			}),
			McpGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});
