import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({
	build: {
		command: "pnpm run build:worker",
		watchDir: "src",
	},
});
