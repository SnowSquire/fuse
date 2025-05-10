#!/usr/bin/env node

const Fuse = require("./");
const cmd = process.argv[2];

switch (cmd) {
	case "configure":
		Fuse.configure(onError);
		break;

	case "unconfigure":
		Fuse.unconfigure(onError);
		break;

	case "is-configured":
		Fuse.isConfigured((error, bool) => {
			if (error) {
				return onError(error);
			}
			console.log(bool);
			process.exit(bool ? 0 : 1);
		});
		break;

	default:
		console.log("Expecting command!");
		break;
}

function onError(error) {
	if (error) {
		throw error;
	}
}
