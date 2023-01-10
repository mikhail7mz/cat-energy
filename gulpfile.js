import gulp from 'gulp';
import gulpif from 'gulp-if';
import browser from 'browser-sync';
import htmlmin from 'gulp-htmlmin';
import plumber from 'gulp-plumber';
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import csso from 'postcss-csso';
import autoprefixer from 'autoprefixer';
import rename from 'gulp-rename';
import terser from 'gulp-terser';
import squoosh from 'gulp-libsquoosh';
import svgo from 'gulp-svgmin';
import del from 'del';
import { stacksvg } from 'gulp-stacksvg';

let isDevelopment = true;

// Markup

const processMarkup = () => {
  return gulp.src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('build'));
}

// Styles

const processStyles = () => {
  return gulp.src('source/sass/style.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    .pipe(browser.stream());
}

// Scripts

const processScripts = () => {
  return gulp.src('source/js/*.js')
    .pipe(terser())
    .pipe(gulp.dest('build/js'));
}

// Images

const processImages = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(gulpif(!isDevelopment, squoosh()))
    .pipe(gulp.dest('build/img'));
}

const createWebp = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(squoosh({
      webp: {}
    }))
    .pipe(gulp.dest('build/img'));
}

const createAvif = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(squoosh({
      avif: {}
    }))
    .pipe(gulp.dest('build/img'));
}

// SVG

const optimizeSvg = () => {
  return gulp.src('source/img/favicons/*.svg')
    .pipe(svgo())
    .pipe(gulp.dest('build/img/favicons'));
}

const createSvgStack = () => {
  return gulp.src(['source/img/**/*.svg', '!source/img/favicons/*.svg'])
    .pipe(svgo())
    .pipe(stacksvg())
    .pipe(gulp.dest('build/img'));
}

// Coping assets

const copyAssets = (done) => {
  gulp.src([
    'source/fonts/*.{woff,woff2}',
    'source/*.ico',
    'source/manifest.webmanifest'
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'));
  done();
}

// Remove build

const removeBuild = () => {
  return del('build');
}

// CompileProject

const compileProject = (done) => {
  gulp.parallel(
    copyAssets,
    processMarkup,
    processStyles,
    processImages,
    processScripts,
    createWebp,
    createAvif,
    optimizeSvg,
    createSvgStack
  )(done);
}

// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

const serverReload = (done) => {
  browser.reload();
  done();
}

// Watcher

export const watcher = () => {
  gulp.watch('source/sass/**/*.scss', gulp.series(processStyles));
  gulp.watch('source/js/**/*.js', gulp.series(processScripts));
  gulp.watch('source/img/**/*.svg', gulp.series(createSvgStack));
  gulp.watch('source/*.html', gulp.series(processMarkup, serverReload));
}

// Npm run build

export const build = (done) => {
  isDevelopment = false;
  gulp.series(
    removeBuild,
    compileProject
  )(done);
}

// Npm run start

export default gulp.series(
  removeBuild,
  compileProject,
  server,
  watcher
);
