var fs = require('fs');
var mime = require('mime');
var gulp = require('gulp');
var expect = require('expect.js');
var through = require('through2');
var fileInline = require('..');

describe('gulp-file-inline', function () {

	it('should inline js&css files', function (done) {
		gulp
			.src('test/fixtures/index.html')
			.pipe(fileInline())
			.pipe(through.obj(function (file, enc, cb) {
				var contents = file.contents.toString();
				expect(contents).to.contain('.avatar');
				expect(contents).to.contain('console.log("gulp-file-inline")');
				cb();
			}, function () {
				done();
			}));
	});

	it('should relocate relative urls in css files', function (done) {
		gulp
			.src('test/fixtures/index.html')
			.pipe(fileInline())
			.pipe(through.obj(function (file, enc, cb) {
				var contents = file.contents.toString();
				expect(contents).to.contain('url(img/avatar.jpg)');
				expect(contents).to.contain('url(/path/to/image.jpg)');
				expect(contents).to.contain('background:url(http://example.com/path/to/image.jpg)');
				cb();
			}, function () {
				done();
			}));
	});

	it('should ignore absolute urls', function (done) {
		gulp
			.src('test/fixtures/index.html')
			.pipe(fileInline())
			.pipe(through.obj(function (file, enc, cb) {
				var contents = file.contents.toString();
				expect(contents).to.contain('<link rel="stylesheet" href="http://example.com/css/style.css" class="absolute-url">');
				cb();
			}, function () {
				done();
			}));
	});

	it('should not minify if the `minify` option is false', function (done) {
		gulp
			.src('test/fixtures/index.html')
			.pipe(fileInline({css: {minify: false}, js: {minify: false}}))
			.pipe(through.obj(function (file, enc, cb) {
				var contents = file.contents.toString();
				expect(contents).to.contain('\twidth:');
				expect(contents).to.contain('\tconsole');
				cb();
			}, function () {
				done();
			}));
	});

	it('should not inline files if pass `null` as the option', function (done) {
		gulp
			.src('test/fixtures/index.html')
			.pipe(fileInline({css: null}))
			.pipe(through.obj(function (file, enc, cb) {
				var contents = file.contents.toString();
				expect(contents).to.not.contain('.avatar');
				expect(contents).to.contain('console.log("gulp-file-inline")');
				cb();
			}, function () {
				done();
			}));
	});

	it('should throw if there is any error', function (done) {
		gulp
			.src('test/fixtures/error.html')
			.pipe(fileInline())
			.on('error', function (err) {
				expect(err).to.be.an(Error);
				done();
			});
	});

	it('should work with custom inline type', function (done) {
		gulp
			.src('test/fixtures/index.html')
			.pipe(fileInline({
				img: {
					tagPattern: /<img[^>]* src=[^>]+>/g,
					urlPattern: / src=['"]?([^'"]+)['"]?/,
					tagParser: function (codes, attrCodes) {
						return '<img' + attrCodes + ' src="' + codes + '">';
					},
					parser: function (base, filename) {
						var content = fs.readFileSync(filename).toString('base64');
						var contentType = mime.getType(filename);
						return 'data:' + contentType + ';base64,' + content;
					}
				}
			}))
			.pipe(through.obj(function (file, enc, cb) {
				var contents = file.contents.toString();
				expect(contents).to.contain('<img alt="avatar" src="data:image/jpeg;base64,');
				cb();
			}, function () {
				done();
			}));
	})

});