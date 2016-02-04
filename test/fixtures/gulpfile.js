var gulp = require('gulp');
var fileInline = require('../../');

gulp.task('default', function () {
	return gulp
		.src(['index.html'])
		.pipe(fileInline())
		.pipe(gulp.dest('dist'));
});
