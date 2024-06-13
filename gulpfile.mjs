import gulp from 'gulp'

export const copyAssets = () => {
  return gulp.src('plugins/**/*.{js,css,html,ttf,woff,data}')
    .pipe(gulp.dest('dist/plugins/'))
}

export const watchAssets = () => {
  copyAssets()
  return gulp.watch('plugins/**/*.{js,css,html,ttf,woff,data}', copyAssets)
}
