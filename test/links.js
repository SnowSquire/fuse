const tape = require("tape");
const fs = require("node:fs");
const path = require("node:path");
const { unmount } = require("./helpers");

const Fuse = require("../");
const createMountpoint = require("./fixtures/mnt");
const stat = require("./fixtures/stat");

const mnt = createMountpoint();

tape("readlink", (t) => {
	const ops = {
		force: true,
		readdir: (path, cb) => {
			if (path === "/") return process.nextTick(cb, null, ["hello", "link"]);
			return process.nextTick(cb, Fuse.ENOENT);
		},
		readlink: (path, cb) => {
			process.nextTick(cb, 0, "hello");
		},
		getattr: (path, cb) => {
			if (path === "/")
				return process.nextTick(cb, null, stat({ mode: "dir", size: 4096 }));
			if (path === "/hello")
				return process.nextTick(cb, null, stat({ mode: "file", size: 11 }));
			if (path === "/link")
				return process.nextTick(cb, null, stat({ mode: "link", size: 5 }));
			return process.nextTick(cb, Fuse.ENOENT);
		},
		open: (path, flags, cb) => {
			process.nextTick(cb, 0, 42);
		},
		read: (path, fd, buf, len, pos, cb) => {
			const str = "hello world".slice(pos, pos + len);
			if (!str) return process.nextTick(cb, 0);
			buf.write(str);
			return process.nextTick(cb, str.length);
		},
	};

	const fuse = new Fuse(mnt, ops, { debug: true });
	fuse.mount((err) => {
		t.error(err, "no error");

		fs.lstat(path.join(mnt, "link"), (err, stat) => {
			t.error(err, "no error");
			t.same(stat.size, 5, "correct size");

			fs.stat(path.join(mnt, "hello"), (err, stat) => {
				t.error(err, "no error");
				t.same(stat.size, 11, "correct size");

				fs.readlink(path.join(mnt, "link"), (err, dest) => {
					t.error(err, "no error");
					t.same(dest, "hello", "link resolves");

					fs.readFile(path.join(mnt, "link"), (err, buf) => {
						t.error(err, "no error");
						t.same(buf, Buffer.from("hello world"), "can read link content");

						unmount(fuse, () => {
							t.end();
						});
					});
				});
			});
		});
	});
});
