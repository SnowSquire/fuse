import Fuse, { ENOENT } from "./";

const directory = 0o40000;
const regularFile = 0o100000;

const ops = {
	readdir: (path, cb) => {
		console.log("readdir(%s)", path);
		if (path === "/")
			return process.nextTick(
				cb,
				0,
				["test"],
				[
					{
						mtime: new Date(),
						atime: new Date(),
						ctime: new Date(),
						nlink: 1,
						size: 12,
						mode: regularFile | 0o777,
						uid: process.getuid ? process.getuid() : 0,
						gid: process.getgid ? process.getgid() : 0,
					},
				],
			);
		return process.nextTick(cb, 0);
	},
	/*
  access: function (path, cb) {
    return process.nextTick(cb, 0)
  },
  */
	getattr: (path, cb) => {
		console.log("getattr(%s)", path);
		if (path === "/") {
			return process.nextTick(cb, 0, {
				mtime: new Date(),
				atime: new Date(),
				ctime: new Date(),
				nlink: 1,
				size: 100,
				mode: directory | 0o777,
				uid: process.getuid ? process.getuid() : 0,
				gid: process.getgid ? process.getgid() : 0,
			});
		}

		if (path === "/test") {
			return process.nextTick(cb, 0, {
				mtime: new Date(),
				atime: new Date(),
				ctime: new Date(),
				nlink: 1,
				size: 12,
				mode: regularFile | 0o777,
				uid: process.getuid ? process.getuid() : 0,
				gid: process.getgid ? process.getgid() : 0,
			});
		}

		return process.nextTick(cb, ENOENT);
	},
	open: (path, flags, cb) => {
		console.log("open(%s, %d)", path, flags);
		return process.nextTick(cb, 0, 42); // 42 is an fd
	},
	read: (path, fd, buf, len, pos, cb) => {
		console.log("read(%s, %d, %d, %d)", path, fd, len, pos);
		const str = "hello world\n".slice(pos);
		if (!str) return process.nextTick(cb, 0);
		buf.write(str);
		return process.nextTick(cb, str.length);
	},
};

// Examples:

// Mount as drive letter on Windows.
// const fuse = new Fuse("M:", ops, { debug: true, displayFolder: true, volname: "Test Drive" });

// Mount as path on Windows (folder must not exist).
// const fuse = new Fuse("C:\\Test\\Drive", ops, { debug: true, displayFolder: true, volname: "Test Drive" });

// Mount as path on POSIX systems.
const fuse = new Fuse("./mnt", ops, { debug: true, displayFolder: true });

fuse.mount((err) => {
	if (err) throw err;
	console.log(`filesystem mounted on ${fuse.mnt}`);
});

process.once("SIGINT", () => {
	fuse.unmount((err) => {
		if (err) {
			console.log(`filesystem at ${fuse.mnt} not unmounted`, err);
		} else {
			console.log(`filesystem at ${fuse.mnt} unmounted`);
		}
	});
});
