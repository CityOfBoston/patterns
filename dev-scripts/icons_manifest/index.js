/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mkdirp = require('mkdirp');
const yamlLint = require('yaml-lint');
const prettyYaml = require('json-to-pretty-yaml');

const manifestUri = 'https://assets.boston.gov/manifest/icons_manifest.json';
const iconsDirPath = './components/icons';

const createDirectories = async pathname => {
  const __dirname = path.resolve();
  // eslint-disable-next-line no-useless-escape
  pathname = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ''); // Remove leading directory markers, and remove ending /file-name.extension
  fs.mkdir(path.resolve(__dirname, pathname), { recursive: true }, e => {
    if (e) {
      console.error(e);
    }
  });
};

const checkFileExistsSync = async filepath => {
  const e = { exists: false, message: 'File/directory does not exist' };

  if (fs.existsSync(filepath)) {
    return { exists: true };
  } else {
    return e;
  }
};

const sortManifest = data => {
  return data.sort((a, b) => {
    if (a.category === b.category) return 0;
    return a.category < b.category ? -1 : 1;
  });
};

const constructManifestYamlReadyObj = async icons => {
  let parsedManifest = {};
  icons.forEach(obj => {
    if (!parsedManifest[obj.category])
      parsedManifest[obj.category] = {
        title: obj.category,
        handle: obj.category.replace(/ /g, '_'),
        status: 'ready',
        context: {
          defaultIcon:
            'https://www.boston.gov/modules/custom/bos_content/modules/node_post/default_news.svg',
          icons: [],
        },
      };
    parsedManifest[obj.category].context.icons.push({
      file: obj.filename,
    });
  });

  return parsedManifest;
};

const manifest = async () => {
  console.log(
    'patterns.boston.gov - Dynamically fetch icons manifest and create yaml config for the Icon Buckets in s3'
  );
  await axios
    .get(manifestUri)
    .then(response => {
      let icons = sortManifest(response.data);

      constructManifestYamlReadyObj(icons)
        .then(async manifest => {
          const iconObj = { icons: manifest };

          if (yamlLint.lint(iconObj)) {
            const writeToFile = async (
              filepath,
              filename,
              filenameWithExt,
              contents
            ) => {
              await mkdirp(filepath);
              yamlLint
                .lint(contents)
                .then(() => {
                  fs.writeFile(
                    path.join(filepath, filenameWithExt),
                    prettyYaml.stringify(contents),
                    err => {
                      if (err) {
                        return console.log(err);
                      } else {
                        fs.readFile(
                          path.resolve(
                            './dev-scripts/icons_manifest/manifest.hbs'
                          ),
                          function(err, data) {
                            if (err) throw err;
                            const contents = data
                              .toString()
                              .replace(/directory_name/gim, `${filename}`);

                            fs.writeFile(
                              `${filepath}/${filename}.hbs`,
                              contents,
                              writeHbsErr => {
                                if (writeHbsErr) throw writeHbsErr;
                                console.log('Success on HBS');
                              }
                            );
                          }
                        );
                      }
                    }
                  );
                })
                .catch(error => {
                  console.error('Invalid YAML file.', error);
                });
            };

            const writeFileCall = async (
              filepath,
              filename,
              filenameWithExt,
              contents
            ) => {
              writeToFile(filepath, filename, filenameWithExt, contents)
                .then(() => {
                  //   console.log ('writeToFile success');
                })
                .catch(e => {
                  console.log('writeToFile error: ', e);
                });
            };

            for (const currArrObj of Object.entries(iconObj.icons)) {
              const thisIconGroupDirPath = `${iconsDirPath}/${
                currArrObj[1].handle
              }`;

              if (currArrObj[1] && typeof currArrObj[1] === 'object') {
                if (!(await checkFileExistsSync(thisIconGroupDirPath)).exists) {
                  createDirectories(thisIconGroupDirPath)
                    .then(() => {
                      writeFileCall(
                        `${thisIconGroupDirPath}`,
                        `${currArrObj[1].handle}`,
                        `${currArrObj[1].handle}.config.yml`,
                        currArrObj[1]
                      );
                    })
                    .catch(e => {
                      console.log('Error creating directory for icons: ', e);
                    });
                } else {
                  writeFileCall(
                    `${thisIconGroupDirPath}`,
                    `${currArrObj[1].handle}`,
                    `${currArrObj[1].handle}.config.yml`,
                    currArrObj[1]
                  );
                }
              }
            }
          } else {
            console.log('YAML File/Object is not Valid');
          }
        })
        .catch(error =>
          console.log('constructManifestYamlReadyObj > error: ', error)
        );
    })
    .catch(function(error) {
      // handle error
      console.log('Icons Manifest > File does not exists: ', error);
    })
    .then(function() {
      // always executed
      console.log('Icons Manifest > Script is DONE');
    });
};

manifest();
