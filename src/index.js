// through2 is a thin wrapper around node transform streams
import through from 'through2';
import fs from 'fs';
import os from 'os';
import bluebird from 'bluebird';
import gutil from 'gulp-util';
import request from 'request';

const Promise = bluebird.Promise;
const PluginError = gutil.PluginError;
const PLUGIN_NAME = 'gulp-amp-svg-preview';

function getAuthCredentials() {
  const homedir = os.homedir();
  let credentials;

  try {
    credentials = JSON.parse(fs.readFileSync(`${homedir}/.amplience/credentials.json`, 'utf8'));

    if (!credentials && !credentials.clientId && !credentials.username && !credentials.password) {
      throw new PluginError(PLUGIN_NAME, 'Missing details in credentials file');
    }
  } catch (e) {
    throw new PluginError(PLUGIN_NAME, 'Missing credentials file');
  }

  return credentials;
}

function requestToken(credentials, options) {
  return new Promise((resolve, reject) => {
    const tokenData = {
      username: credentials.username,
      password: credentials.password,
      client_id: credentials.clientId,
      grant_type: 'password'
    };

    request.post({
      url: `${options.protocol}://${options.host}/${options.pathname}`,
      form: tokenData
    }, (error, response) => {
      const jsonResponse = response && response.body ? JSON.parse(response.body) : null;

      if (error || jsonResponse.error) {
        let returnError = error ? error : jsonResponse;

        return reject(returnError);
      }

      return resolve(jsonResponse);
    });
  });
}

function postSvg(options, token, svgFile) {
  return new Promise((resolve, reject) => {
    const formData = {
      file: svgFile
    };

    request.post({
      url: `${options.protocol}://${options.host}/${options.pathname}`,
      headers: {
        Authorization: `Bearer ${token.access_token}`
      },
      formData: formData
    }, (error, response) => {
      const jsonResponse = response && response.body ? JSON.parse(response.body) : null;
      if (error || jsonResponse.errorMessage) {
        let returnError = error ? error : jsonResponse;

        return reject(returnError);
      }

      return resolve(jsonResponse.value);
    });
  });
}

// Plugin level function(dealing with files)
function gulpAmpSvgPreview(opts = {}, callback) {
  const options = {
    auth: {
      protocol: opts.auth && opts.auth.protocol || 'https',
      host: opts.auth && opts.auth.host || 'auth.adis.ws',
      pathname: opts.auth && opts.auth.pathname || 'oauth/token'
    },
    preview: {
      protocol: opts.preview && opts.preview.protocol || 'https',
      host: opts.preview && opts.preview.host || 'dm-preview-service.adis.ws',
      pathname: opts.preview && opts.preview.pathname || 'preview'
    },
    di: {
      protocol: opts.di && opts.di.protocol || 'https',
      host: opts.di && opts.di.host || 'i1.adis.ws',
      companyName: opts.di && opts.di.companyName || 'testCompany123',
      namespace: opts.di && opts.di.namespace || 'preview'
    }
  };

  return through.obj((file, enc, cb) => {
    if (file.isNull()) {
      // return empty file
      return cb(null, file);
    }

    const userCredentials = getAuthCredentials();

    if (file.isStream()) {
      throw new PluginError(PLUGIN_NAME, 'Streams not supported');
    }
    if (file.isBuffer()) {
      requestToken(userCredentials, options.auth)
        .then(token => {
          return postSvg(options.preview, token, file.contents.toString());
        })
        .done(id => {
          const previewUrl =
            `${options.di.protocol}://${options.di.host}/i/${options.di.companyName}:${options.di.namespace}/${id}`;

          gutil.log(`${PLUGIN_NAME} Preview: ${previewUrl}`);
          callback(null, previewUrl);
          cb(null, file);
        }, error => {
          gutil.log(`${PLUGIN_NAME} Error: ${JSON.stringify(error)}`);
          callback(error);
          cb(null, file);
        });
    }
  });
}

module.exports = gulpAmpSvgPreview;
