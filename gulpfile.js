import gulp from 'gulp';
import gulpif from 'gulp-if';
import data from './source/data.json' assert {type: 'json'}
import browser from 'browser-sync';
import htmlmin from 'gulp-htmlmin';
import htmlPrettify from 'gulp-html-prettify';
import plumber from 'gulp-plumber';
import twig from 'gulp-twig';
import { htmlValidator } from 'gulp-w3c-html-validator';
import bemlinter from 'gulp-html-bemlinter';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import csso from 'postcss-csso';
import autoprefixer from 'autoprefixer';
import rename from 'gulp-rename';
import terser from 'gulp-terser';
import squoosh from 'gulp-libsquoosh';
import svgo from 'gulp-svgmin';
import del from 'del';
import { stacksvg } from 'gulp-stacksvg';

data.isDevelopment = true;
const sass = gulpSass(dartSass);

// Markup

export const processMarkup = () => {
  return gulp.src('./source/*.html')
    .pipe(twig({
      data: data
    }))
    .pipe(gulpif(
      data.isDevelopment,
      htmlPrettify({indent_char: ' ', indent_size: 2}),
      htmlmin({ collapseWhitespace: true })))
    .pipe(gulp.dest('./build'));
}

export const validateMarkup = () => {
	return gulp.src('build/*.html')
		.pipe(htmlValidator.analyzer())
		.pipe(htmlValidator.reporter({ throwErrors: true }));
}

export const lintBem = () => {
	return gulp.src('build/*.html')
		.pipe(bemlinter());
}

// Styles

const processStyles = () => {
  const sassOptions = {
		functions: {
			'getbreakpoint($bp)': (bp) => new dartSass.types.Number(data.viewports[bp.getValue()]),
			'getext($name)': (name) => new dartSass.types.String(data.images[name.getValue()].ext),
			'getmaxdppx()': () => new dartSass.types.Number(data.maxdppx),
			'getviewports($name)': function (name) {
				let vps = data.images[name.getValue()].sizes.map((size) => size.viewport);
				let viewports = new dartSass.types.List(vps.length);
				vps.reverse().forEach((vp, i) => { viewports.setValue(i, new dartSass.types.String(vp)) });
				return viewports;
			}
		}
	}
  return gulp.src('source/sass/style.scss', { sourcemaps: data.isDevelopment })
    .pipe(plumber())
    .pipe(sass(sassOptions).on('error', sass.logError))
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
  return gulp.src('source/js/**/*.js')
    .pipe(terser())
    .pipe(gulp.dest('build/js'));
}

// Images

const processImages = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(gulpif(!data.isDevelopment, squoosh()))
    .pipe(gulp.dest('build/img'));
}

const createWebp = (done) => {
	if (!data.isDevelopment) {
    return gulp.src('source/img/**/*.{jpg,png}')
      .pipe(squoosh({ webp: {} }))
      .pipe(gulp.dest('build/img'));
  } else {
    done()
  }
}

const createAvif = (done) => {
  if (!data.isDevelopment) {
    return gulp.src('source/img/**/*.{jpg,png}')
      .pipe(squoosh({ avif: {} }))
      .pipe(gulp.dest('build/img'));
  } else {
    done()
  }
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

const copyAssets = () => {
  return gulp.src([
    'source/fonts/*.{woff,woff2}',
    'source/*.ico',
    'source/manifest.webmanifest'
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'));
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

const watcher = () => {
  gulp.watch('source/sass/**/*.scss', gulp.series(processStyles));
  gulp.watch('source/js/**/*.js', gulp.series(processScripts, serverReload));
  gulp.watch('source/img/**/*.svg', gulp.series(createSvgStack, serverReload));
  gulp.watch(['source/**/*.{html,twig}', 'source/data.json'], gulp.series(processMarkup, serverReload));
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
