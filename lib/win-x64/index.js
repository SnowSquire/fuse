const fs = require("node:fs");
const path = require("node:path");

const WINFSP = path.join(process.env["ProgramFiles(x86)"], "WinFsp");
const lib = path.join(WINFSP, "bin/winfsp-x64.dll");

module.exports = {
	configure,
	unconfigure,
	beforeMount,
	beforeUnmount,
	isConfigured,
};

function beforeMount(cb) {
	if (!cb) cb = noop;
	process.nextTick(cb);
}

function beforeUnmount(cb) {
	if (!cb) cb = noop;
	process.nextTick(cb);
}

function unconfigure(cb) {
	if (!cb) cb = noop;
	process.nextTick(cb);
}

function configure(cb) {
	if (!cb) cb = noop;
	process.nextTick(cb);
}

function isConfigured(cb) {
	fs.stat(lib, (err) => {
		if (err) {
			if (err.code !== "ENOENT") return cb(null, false);

			return cb(err);
		}
		cb(null, true);
	});
}

function noop() {}
