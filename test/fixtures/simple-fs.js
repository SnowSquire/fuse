const stat = require("./stat");
const Fuse = require("../../");

module.exports = (tests = {}) => ({
	readdir: (path, cb) => {
		if (tests.readdir) tests.readdir(path);
		if (path === "/") return process.nextTick(cb, null, ["test"]);
		return process.nextTick(cb, Fuse.ENOENT);
	},
	getattr: (path, cb) => {
		if (tests.getattr) tests.getattr(path);
		if (path === "/")
			return process.nextTick(cb, null, stat({ mode: "dir", size: 4096 }));
		if (path === "/test")
			return process.nextTick(cb, null, stat({ mode: "file", size: 11 }));
		return process.nextTick(cb, Fuse.ENOENT);
	},
	open: (path, flags, cb) => {
		if (tests.open) tests.open(path, flags);
		return process.nextTick(cb, 0, 42);
	},
	release: (path, fd, cb) => {
		if (tests.release) tests.release(path, fd);
		return process.nextTick(cb, 0);
	},
	read: (path, fd, buf, len, pos, cb) => {
		if (tests.read) tests.read(path, fd, buf, len, pos);
		const str = "hello world".slice(pos, pos + len);
		if (!str) return process.nextTick(cb, 0);
		buf.write(str);
		return process.nextTick(cb, str.length);
	},
});
