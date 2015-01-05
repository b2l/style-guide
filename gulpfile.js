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
  gulp.start('bump', 'push', 'sass', 'hologram', 'gh-pages', 'rails-assets');
});

gulp.task('bump', function() {
  return release(gulp.env.type||'minor');
});

gulp.task('gh-pages', function() {
  return gulp.src('./public')
    .pipe(deploy());
});

gulp.task('rails-assets', function() {
  var deferred = Q.defer();

  request
    .post('https://rails-assets.org/components.json')
    .send( {components: {name: 'mnd-bootstrap', version: null}} )
    .end(function(res) {
      if (res.ok) {
        deferred.resolve();
        console.log('rails-assets gem updated');
      } else {
        deferred.reject();
        console.error('Error while updating the rails-assets component');
      }
    });

    return deferred.promise;
});

gulp.task('push', function() {
  return git.push('origin', 'master', {args: ' --tags'}, function (err) {
    if (err) throw err;
  });
});

function release(importance) {
  return gulp.src(['./package.json', './bower.json'])
    .pipe(bump({type: importance}))
    .pipe(gulp.dest('./'))
    .pipe(git.commit('bumps package version'))
    .pipe(filter('./package.json'))
    .pipe(tag_version());
}
