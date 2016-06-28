# gulp-amp-svg-preview
> Gulp plugin for previewing Amplience substitutions in SVGs

## Installation

```sh
$ npm install --save gulp-amp-svg-preview
```

## Usage

To preview SVGs we pipe them into the plugin using `gulp.src`.  A preview url will be generated for each SVG.

```js
var ampSvgPreview = require('gulp-amp-svg-preview');
var previewOpts = {
  di: {
    clientName: '<your_client_name_here>'
  }
};

gulp.src('svg/merged/*.svg')
  .pipe(ampSvgPreview(previewOpts, function (err, url) {
    if(err) {
      // handle err
    }
    // handle url
  }))
```

## Options
Default options:

```js
var previewOpts = {
  auth: {
    protocol: 'https',
    host: 'auth.adis.ws',
    pathname: 'oauth/token'
  },
  preview: {
    protocol: 'https',
    host: 'dm-preview-service.adis.ws',
    pathname: 'preview'
  },
  di: {
    protocol: 'https',
    host: 'i1.adis.ws',
    companyName: 'testCompany123',
    namespace: 'preview'
  }
}
```

## License

Apache-2.0 © [Amplience](http://amplience.com/)
