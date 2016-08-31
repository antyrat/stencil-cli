var Async = require('async'),
    Fs = require('fs'),
    Fse = require('fs-extra'),
    Deepmerge = require("deepmerge");
    Path = require('path'),
    _ = require('lodash'),
    localeDirectory = 'lang',
    localeTmpDirectory = 'lang_tmp';

module.exports.assemble = assemble;
module.exports.localeDirectory = localeDirectory;

/**
 * Assembles together all of the lang files.
 * This simply loads the files from the lang directory and puts them in an object where
 * locale name is the key and locale data is the value
 *
 * @param callback
 * @param localeSetting
 */
function assemble(callback, localeSetting) {
    if( localeSetting ) {
      Async.waterfall([
        function(aCbck) {
          Fse.copy(localeDirectory, localeTmpDirectory, aCbck);
        },
        function(aCbck) {
          Fse.emptyDir(localeDirectory, aCbck);
        },
        function(aCbck) {
          var fileName = localeSetting;
          if( localeSetting.indexOf( '-' ) !== -1 ) {
            fileName = localeSetting.split('-')[0];
          }
          fileName += '.json'
          Fse.copy(localeTmpDirectory + '/' + fileName, localeDirectory + '/en.json', aCbck);
        },
        function(aCbck) {
          if( localeSetting.indexOf( '-' ) !== -1 ) {
            var src = JSON.parse(Fse.readFileSync(localeTmpDirectory + '/' + localeSetting + '.json', 'utf8'));
            var dst = JSON.parse(Fse.readFileSync(localeDirectory + '/en.json', 'utf8'));
            Fse.writeJson(localeDirectory + '/en.json', Deepmerge(dst, src), aCbck);
          } else {
            aCbck();
          }
        }
      ], function(err) {
        if( err ) {
          console.error(err);
        }
        assembleConcat(callback);
      });
    } else {
      assembleConcat(callback);
    }
}

function assembleConcat(callback) {
  Fs.readdir(localeDirectory, function (err, localeFiles) {
      var localesToLoad = {};

      // Ignore hidden files
      // @example: MAC generates .DS_STORE
      localeFiles = _.filter(localeFiles, function(fileName) {
          return fileName[0] !== '.';
      });

      if (err) {
          return callback(err);
      }

      _.each(localeFiles, function (localeFile) {
          var localeName = Path.basename(localeFile, '.json');

          localesToLoad[localeName] = function (callback) {
              var localeFilePath = localeDirectory + '/' + localeFile;

              Fs.readFile(localeFilePath, 'utf-8', callback);
          };
      });

      Async.parallel(localesToLoad, callback);
  });
}
