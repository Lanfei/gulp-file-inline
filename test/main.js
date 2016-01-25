var gulp = require('gulp');
var should = require('should');
var through = require('through2');
var fileInline = require('../');

describe('gulp-file-inline', function () {

	it('should inline js/css files', function (done) {
		gulp
			.src('test/fixtures/index.html')
			.pipe(fileInline())
			.pipe(through.obj(function (file, enc, cb) {
				var contents = file.contents.toString();
				contents.indexOf('.avatar').should.above(0);
				contents.indexOf('console.log("gulp-file-inline")').should.above(0);
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
				contents.indexOf('url(img/avatar.jpg)').should.above(0);
				contents.indexOf('url(/path/to/image.jpg)').should.above(0);
				contents.indexOf('background:url(http://example.com/path/to/image.jpg)').should.above(0);
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
				contents.indexOf('<link rel="stylesheet" href="http://example.com/css/style.css" class="absolute-url"/>').should.above(0);
				cb();
			}, function () {
				done();
			}));
	});

});