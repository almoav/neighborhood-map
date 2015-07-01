var gulp = require('gulp'),
	sass = require('gulp-ruby-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	imagemin = require('gulp-imagemin'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	notify = require('gulp-notify'),
	cache = require('gulp-cache'),
	livereload = require('gulp-livereload'),
	$ = require('gulp-load-plugins')(),
	del = require('del');

gulp.task('scripts', function() {
	return gulp.src('view/*.js')
	.pipe(jshint('.jshintrc'))
	.pipe(jshint.reporter('default'))
	.pipe(concat('main.js'))
	.pipe(gulp.dest('dist/assets/js'))
	.pipe(rename({suffix: '.min'}))
	.pipe(uglify())
	.pipe(gulp.dest('dist/assets/js'))
	.pipe(notify({ message: 'Scripts task complete' }));
});

gulp.task('clean', function(cb) {
	del(['dist/assets/js'], cb)
});

gulp.task('default', ['clean'], function() {
	gulp.start('scripts');
});

gulp.task('watch', function() {

	// Watch .js files
	gulp.watch('view/*.js', ['scripts']);

});

gulp.task('jscs', function() {
	gulp.src('src/**/*.js')
		.pipe(jscs())
		.pipe(notify({
			title: 'JSCS',
			message: 'JSCS Passed. Let it fly!'
		}))
});