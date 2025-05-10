exports.unmount = (fuse, cb) => {
	// This only seems to be nessesary an the ancient osx we use on travis so ... yolo
	fuse.unmount((err) => {
		if (err) return cb(err);
		setTimeout(cb, 1000);
	});
};
