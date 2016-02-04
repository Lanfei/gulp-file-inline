var gulp = require('gulp');
var fileInline = require('../');

gulp.task('default', function () {
	return gulp
		.src(['fixtures/index.html'])
		.pipe(fileInline())
		.pipe(gulp.dest('fixtures/dist'));
});
