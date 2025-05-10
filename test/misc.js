const os = require("node:os");
const fs = require("node:fs");
const tape = require("tape");
const { spawnSync, exec } = require("node:child_process");

const createMountpoint = require("./fixtures/mnt");

const Fuse = require("../");
const { unmount } = require("./helpers");
const simpleFS = require("./fixtures/simple-fs");

const mnt = createMountpoint();

tape("mount", (t) => {
	const fuse = new Fuse(mnt, {}, { force: true });
	fuse.mount((err) => {
		t.error(err, "no error");
		t.ok(true, "works");
		unmount(fuse, () => {
			t.end();
		});
	});
});

tape("mount + unmount + mount", (t) => {
	const fuse1 = new Fuse(mnt, {}, { force: true, debug: false });
	const fuse2 = new Fuse(mnt, {}, { force: true, debug: false });

	fuse1.mount((err) => {
		t.error(err, "no error");
		t.ok(true, "works");
		unmount(fuse1, () => {
			fuse2.mount((err) => {
				t.error(err, "no error");
				t.ok(true, "works");
				unmount(fuse2, () => {
					t.end();
				});
			});
		});
	});
});

tape("mount + unmount + mount with same instance fails", (t) => {
	const fuse = new Fuse(mnt, {}, { force: true, debug: false });

	fuse.mount((err) => {
		t.error(err, "no error");
		t.pass("works");
		unmount(fuse, () => {
			fuse.mount((err) => {
				t.ok(err, "had error");
				t.end();
			});
		});
	});
});

tape("(not win32) mnt point must exist", (t) => {
	if (os.platform() === "win32") return t.end();
	const fuse = new Fuse(".does-not-exist", {}, { debug: false });
	fuse.mount((err) => {
		t.ok(err, "had error");
		t.end();
	});
});

tape("(not win32) mnt point must be directory", (t) => {
	if (os.platform() === "win32") return t.end();
	const fuse = new Fuse(__filename, {}, { debug: false });
	fuse.mount((err) => {
		t.ok(err, "had error");
		t.end();
	});
});

tape("mounting twice without force fails", (t) => {
	const fuse1 = new Fuse(mnt, {}, { force: true, debug: false });
	const fuse2 = new Fuse(mnt, {}, { force: false, debug: false });

	fuse1.mount((err) => {
		t.error(err, "no error");
		t.pass("works");
		fuse2.mount((err) => {
			t.true(err, "cannot mount over existing mountpoint");
			unmount(fuse1, () => {
				// FIXME: On Windows, although the test succeeds,
				// it prevents the FUSE loop from stopping after
				// unmounting all FS's.
				t.end();
			});
		});
	});
});

tape("mounting twice with force fail if mountpoint is not broken", (t) => {
	const fuse1 = new Fuse(mnt, {}, { force: true, debug: false });
	const fuse2 = new Fuse(mnt, {}, { force: true, debug: false });

	fuse1.mount((err) => {
		t.error(err, "no error");
		t.pass("works");
		fuse2.mount((err) => {
			t.true(err, "cannot mount over existing mountpoint");
			unmount(fuse1, () => {
				t.end();
			});
		});
	});
});

tape("mounting over a broken mountpoint with force succeeds", (t) => {
	createBrokenMountpoint(mnt);

	const fuse = new Fuse(mnt, {}, { force: true, debug: false });
	fuse.mount((err) => {
		t.error(err, "no error");
		t.pass("works");
		unmount(fuse, (err) => {
			t.end();
		});
	});
});

tape("(not win32) mounting with a nonexistent mountpoint fails", (t) => {
	if (os.platform() === "win32") return t.end();
	const nonexistentMnt = createMountpoint({ doNotCreate: true });

	const fuse = new Fuse(nonexistentMnt, {}, { debug: false });
	fuse.mount((err) => {
		t.true(err, "could not mount");
		t.end();
	});
});

tape("(osx only) unmount with Finder open succeeds", (t) => {
	if (os.platform() !== "darwin") return t.end();
	const fuse = new Fuse(mnt, simpleFS(), { force: true, debug: false });
	fuse.mount((err) => {
		t.error(err, "no error");
		exec(`open ${mnt}`, (err) => {
			t.error(err, "no error");
			setTimeout(() => {
				fs.readdir(mnt, (err, list) => {
					t.error(err, "no error");
					t.same(list, ["test"]);
					unmount(fuse, (err) => {
						t.error(err, "no error");
						fs.readdir(mnt, (err, list) => {
							t.error(err, "no error");
							t.same(list, []);
							t.end();
						});
					});
				});
			}, 1000);
		});
	});
});

tape("(osx only) unmount with Terminal open succeeds", (t) => {
	if (os.platform() !== "darwin") return t.end();
	const fuse = new Fuse(mnt, simpleFS(), { force: true, debug: false });
	fuse.mount((err) => {
		t.error(err, "no error");
		exec(`open -a Terminal ${mnt}`, (err) => {
			t.error(err, "no error");
			setTimeout(() => {
				fs.readdir(mnt, (err, list) => {
					t.error(err, "no error");
					t.same(list, ["test"]);
					unmount(fuse, (err) => {
						t.error(err, "no error");
						fs.readdir(mnt, (err, list) => {
							t.error(err, "no error");
							t.same(list, []);
							t.end();
						});
					});
				});
			}, 1000);
		});
	});
});

tape("static unmounting", (t) => {
	t.end();
});

function createBrokenMountpoint(mnt) {
	spawnSync(
		process.execPath,
		[
			"-e",
			`
    const Fuse = require('..')
    const mnt = ${JSON.stringify(mnt)}
    const fuse = new Fuse(mnt, {}, { force: true, debug: false })
    fuse.mount(() => {
      process.exit(0)
    })
  `,
		],
		{
			cwd: __dirname,
			stdio: "inherit",
		},
	);
}
