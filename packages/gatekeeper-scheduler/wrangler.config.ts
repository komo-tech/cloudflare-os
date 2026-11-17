import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({
	rules: [
		{
			type: "Text",
			globs: [
				"**/*.txt",
			],
			fallthrough: false,
		},
	],
	build: {
		command: "pnpm exec capnweb-validate build --out .wrangler/validate",
		watchDir: "src",
	},
});
