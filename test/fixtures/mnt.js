const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");

function create(opts = {}) {
	if (os.platform() === "win32" && opts.doNotCreate == null) {
		opts.doNotCreate = true;
	}

	const mnt = path.join(
		os.tmpdir(),
		`fuse-bindings-${process.pid}-${Date.now()}`,
	);

	if (!opts.doNotCreate) {
		try {
			fs.mkdirSync(mnt);
		} catch (err) {
			// do nothing
		}
	}

	return mnt;
}

module.exports = create;
