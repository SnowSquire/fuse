const tape = require("tape");
const fs = require("node:fs");
const path = require("node:path");

const Fuse = require("../");
const createMountpoint = require("./fixtures/mnt");
const stat = require("./fixtures/stat");
const { unmount } = require("./helpers");

const mnt = createMountpoint();

tape("write", (t) => {
	let created = false;
	const data = Buffer.alloc(1024);
	let size = 0;

	const ops = {
		force: true,
		readdir: (path, cb) => {
			if (path === "/")
				return process.nextTick(cb, null, created ? ["hello"] : [], []);
			return process.nextTick(cb, Fuse.ENOENT);
		},
		truncate: (path, size, cb) => {
			process.nextTick(cb, 0);
		},
		getattr: (path, cb) => {
			if (path === "/")
				return process.nextTick(cb, null, stat({ mode: "dir", size: 4096 }));
			if (path === "/hello" && created)
				return process.nextTick(cb, 0, stat({ mode: "file", size: size }));
			return process.nextTick(cb, Fuse.ENOENT);
		},
		create: (path, flags, cb) => {
			t.ok(!created, "file not created yet");
			created = true;
			process.nextTick(cb, 0, 42);
		},
		release: (path, fd, cb) => {
			process.nextTick(cb, 0);
		},
		write: (path, fd, buf, len, pos, cb) => {
			buf.slice(0, len).copy(data, pos);
			size = Math.max(pos + len, size);
			process.nextTick(cb, buf.length);
		},
	};

	const fuse = new Fuse(mnt, ops, { debug: true });
	fuse.mount((err) => {
		t.error(err, "no error");

		fs.writeFile(path.join(mnt, "hello"), "hello world", (err) => {
			t.error(err, "no error");
			t.same(
				data.slice(0, size),
				Buffer.from("hello world"),
				"data was written",
			);

			unmount(fuse, () => {
				t.end();
			});
		});
	});
});
