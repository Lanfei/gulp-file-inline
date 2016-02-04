# gulp-file-inline [![NPM version][npm-image]][npm-url]

> A gulp plugin to inline link, script or other tags into the file.

## Usage

First, install `gulp-file-inline` as a development dependency:

```shell
$ npm install --save-dev gulp-file-inline
```

Then, add it to your `gulpfile.js`:

```js
var gulp = require('gulp');
var fileInline = require('gulp-file-inline');

gulp.task('default', function() {
	return gulp
		.src('index.html')
		.pipe(fileInline())
		.pipe(gulp.dest('dist'));
});
```

## Example

### Using filter

```js
var gulp = require('gulp');
var fileInline = require('gulp-file-inline');

gulp.task('default', function() {
	return gulp
		.src('index.html')
		.pipe(fileInline({
			js: {
				filter: function(tag) {
					return tag.indexOf(' data-inline="true"') > 0;
				}
			}
		}))
		.pipe(gulp.dest('dist'));
});
```

### Custom inline type

This is an example to inline images:

```js
var fs = require('fs');
var mime = require('mime');
var gulp = require('gulp');
var fileInline = require('gulp-file-inline');

gulp.task('default', function () {
	return gulp
		.src(['index.html'])
		.pipe(fileInline({
			img: {
				tagPattern: /<img[^>]* src=[^>]+>/g,
				urlPattern: / src=['"]?([^'"]+)['"]?/,
				tagParser: function (codes, attrCodes) {
					return '<img' + attrCodes + ' src="' + codes + '">';
				},
				parser: function (base, filename, encoding, minify) {
					var content = fs.readFileSync(filename).toString('base64');
					var contentType = mime.lookup(filename);
					return 'data:' + contentType + ';base64,' + content;
				}
			}
		}))
		.pipe(gulp.dest('dist'));
});
```

## API

### fileInline(options)

#### options

Type: `Object`

Default:

```js
{
	css: {
		tagPattern: fileInline.CSS_TAG_PATTERN,
		urlPattern: fileInline.CSS_HREF_PATTERN,
		tagParser: fileInline.cssTagParser,
		parser: fileInline.cssParser,
		filter: null,
		minify: true
	},
	js: {
		tagPattern: fileInline.JS_TAG_PATTERN,
		urlPattern: fileInline.JS_SRC_PATTERN,
		tagParser: fileInline.jsTagParser,
		parser: fileInline.jsParser,
		filter: null,
		minify: true
	}
}
```

[npm-url]: https://npmjs.org/package/gulp-file-inline
[npm-image]: https://badge.fury.io/js/gulp-file-inline.svg
