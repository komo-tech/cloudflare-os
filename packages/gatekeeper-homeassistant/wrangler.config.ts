import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({
	build: {
		command: "pnpm exec capnweb-validate build --out .wrangler/validate",
		watchDir: "src",
	},
});
