'use strict';

var fs = require('fs');
var mime = require('mime');
var gulp = require('gulp');
var through = require('through2');
var assert = require('chai').assert;
var fileInline = require('..');

describe('gulp-file-inline', function () {

	it('should inline js&css files', function (done) {
		gulp
			.src('test/fixtures/index.html')
			.pipe(fileInline())
			.pipe(through.obj(function (file, enc, cb) {
				var contents = file.contents.toString();
				assert.include(contents, '.avatar');
				assert.include(contents, 'console.log("gulp-file-inline")');
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
				assert.include(contents, 'url(img/avatar.jpg)');
				assert.include(contents, 'url(/path/to/image.jpg)');
				assert.include(contents, 'background:url(http://example.com/path/to/image.jpg)');
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
				assert.include(contents, '<link rel="stylesheet" href="http://example.com/css/style.css" class="absolute-url">');
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
				assert.include(contents, '\twidth:');
				assert.include(contents, '\tconsole');
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
				assert.notInclude(contents, '.avatar');
				assert.include(contents, 'console.log("gulp-file-inline")');
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
				assert.instanceOf(err, Error);
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
				assert.include(contents, '<img alt="avatar" src="data:image/jpeg;base64,');
				cb();
			}, function () {
				done();
			}));
	})

});