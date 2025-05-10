const fs = require("node:fs");
const { exec } = require("node:child_process");
const { unmount } = require("./helpers");
const tape = require("tape");

const Fuse = require("../");
const createMountpoint = require("./fixtures/mnt");
const stat = require("./fixtures/stat");

const mnt = "k:"; // createMountpoint();

tape("statfs", (t) => {
	const ops = {
		force: true,
		statfs: (path, cb) =>
			cb(0, {
				bsize: 1000,
				frsize: 1000,
				blocks: 2000,
				bfree: 1000,
				bavail: 1000,
				files: 1000,
				ffree: 1000,
				favail: 1000,
				fsid: 1000,
				flag: 1000,
				namemax: 1000,
			}),
	};
	const fuse = new Fuse(mnt, ops, { debug: true });
	fuse.mount((err) => {
		t.error(err, "no error");
		fs.statfs(mnt, {}, (err, stats) => {
			t.error(err, "no error");
			t.equals(
				stats.blocks * stats.bsize,
				1000 * 2000,
				"correct total device capacity returned",
			);
			t.equals(
				stats.bfree * stats.bsize,
				1000 * 1000,
				"correct free device capacity returned",
			);
			t.equals(
				stats.bavail * stats.bsize,
				1000 * 1000,
				"correct available device capacity returned",
			);
			unmount(fuse, () => {
				t.end();
			});
		});
	});
});
