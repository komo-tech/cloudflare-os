import { defineConfig, exports } from "cf/config";

export default defineConfig({
	worker: {
		name: "gatekeeper-slack",
		compatibilityDate: "2026-02-02",
		compatibilityFlags: [
			"allow_irrevocable_stub_storage",
		],
		entrypoint: ".wrangler/validate/src/slack.ts",
		exports: {
			UserAccount: exports.durableObject({
				storage: "sqlite",
			}),
			SlackWorkspaceGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
			SlackConversationGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
			SlackThreadGatekeeperImpl: exports.durableObject({
				storage: "sqlite",
			}),
		},
	},
});
