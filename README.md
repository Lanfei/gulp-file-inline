# gulp-file-inline [![NPM version][npm-image]][npm-url]

> A gulp plugin to inline js/css files.

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
		.pipe(fileInline({
			js: {
				filter: function(tag) {
					return tag.indexOf(' data-inline="true"') > 0;
				}
			}
		}))
		.pipe(gulp.dest('build'));
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
		parser: fileInline.cssParser,
		filter: null,
		minify: true
	},
	js: {
		parser: fileInline.jsParser,
		filter: null,
		minify: true
	}
}
```

[npm-url]: https://npmjs.org/package/gulp-file-inline
[npm-image]: https://badge.fury.io/js/gulp-file-inline.svg
