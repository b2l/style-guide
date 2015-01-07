var gulp = require('gulp'),
  sass = require('gulp-ruby-sass'),
  hologram = require('gulp-hologram'),
  webserver = require('gulp-webserver'),
  bump = require('gulp-bump'),
  filter = require('gulp-filter'),
  git = require('gulp-git'),
  tag_version = require('gulp-tag-version'),
  notify = require('gulp-notify'),
  deploy = require('gulp-gh-pages')
  request = require('superagent')
  Q = require('q');

// Dev task: build, serve and watch
gulp.task('default', function() {
  gulp.start('sass', 'hologram', 'watch', 'webserver');
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.scss', ['sass', 'hologram']);
});

// Compile sass files
gulp.task('sass', function() {
  return gulp.src('src/style-guide.scss')
    .pipe(sass({ style: 'expanded', loadPath: ['./bower_components/'] }))
    .on('error', function (err) { console.log(err.message); })
    .pipe(gulp.dest('dist'))
    .pipe(notify({message: 'Sass task complete'}));
});

// Compile style-guide
gulp.task('hologram', ['sass'], function() {
  return gulp.src('hologram.yml')
    .pipe(hologram())
    .pipe(notify({message: 'Hologram task complete'}));
});

// Serve the style-guide
gulp.task('webserver', function() {
  gulp.src('public')
    .pipe(webserver({
      livereload: true
    }));
});

// Release: increase version number, commit, tag, push to master.
//  then compile the styleguide and push it to gh-pages
gulp.task('release', function() {
  gulp.start('gh-pages');
});

gulp.task('bump', function() {
  var importance = 'minor';
  return gulp.src(['./package.json', './bower.json'])
    .pipe(bump({type: importance}))
    .pipe(gulp.dest('./'))
    .pipe(git.commit('bump version number'));
});

gulp.task('tag', ['bump'], function() {
  var packageJson = require('./package.json');
  var v = packageJson.version;
  var message = 'release v'+v;

  git.tag(v, message, function(e) {
    if (e) throw e;
    git.push('origin', 'master', {args: '--tags'}, function(e) {
      if (e) throw e;
    });
  });
});

gulp.task('gh-pages', ['tag', 'sass', 'hologram'], function() {
  return gulp.src('./public/')
    .pipe(deploy());
});
