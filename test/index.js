import chai from 'chai';
import path from 'path';
import fs from 'fs';
import nock from 'nock';
import File from 'vinyl';

import ampSvgPreview from '../src';

const expect = chai.expect;

describe('ampSvgPreview()', function() {
  describe('svg preview', function() {
    let previewOpts = {};

    beforeEach(function() {
      previewOpts = {
        di: {
          companyName: 'test_client'
        }
      };

      nock('https://auth.adis.ws:443')
        .filteringRequestBody(/.*/, '*')
        .post('/oauth/token', '*')
        .reply(200, {access_token: '341342x341x3423x42134vb3m564m56456456xvsdfs23'});
    });

    it('should return an preview url', function(done) {
      const expectedUrl = 'https://i1.adis.ws/i/test_client:preview/dbcb7e9c-e946-48d2-9456-13e97f74c38c';
      const svgPath = path.join(__dirname, 'fixtures', 'test-merged.svg');
      const file = new File({
        path: svgPath,
        contents: fs.readFileSync(svgPath)
      });

      const check = function(stream, done, cb) {
        stream.on('data', newFile => {
          cb(newFile);
          done();
        });

        stream.write(file);
        stream.end();
      };
      const stream = ampSvgPreview(previewOpts, (err, url) => {
        expect(url).to.equal(expectedUrl);
      });

      nock('https://dm-preview-service.adis.ws')
        .post('/preview')
        .reply(200, {value: 'dbcb7e9c-e946-48d2-9456-13e97f74c38c'});

      check(stream, done, file => {});
    });

    it('should return an error when invalid SVG provided', function(done) {
      const errorResponse = {
        errorMessage: 'something broke'
      };
      const svgPath = path.join(__dirname, 'fixtures', 'test-merged-error.svg');
      const file = new File({
        path: svgPath,
        contents: fs.readFileSync(svgPath)
      });

      const check = function(stream, done, cb) {
        stream.on('data', newFile => {
          cb(newFile);
          done();
        });

        stream.write(file);
        stream.end();
      };
      const stream = ampSvgPreview(previewOpts, err => {
        expect(err).to.deep.equal(errorResponse);
      });

      nock('https://dm-preview-service.adis.ws')
        .post('/preview')
        .reply(500, errorResponse);

      check(stream, done, file => {});
    });
  });
});
