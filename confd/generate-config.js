const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const http = require('http');
const https = require('https');

let confdUrl =
  'https://github.com/kelseyhightower/confd/releases/download/v0.15.0/confd-0.15.0-windows-amd64.exe';
let confdExeExtension = '.exe';
const linuxConfdUrl =
  'https://github.com/kelseyhightower/confd/releases/download/v0.15.0/confd-0.15.0-linux-amd64';
const darwinConfdUrl =
  'https://github.com/kelseyhightower/confd/releases/download/v0.15.0/confd-0.15.0-darwin-amd64';

if (process.platform === 'linux') {
  confdUrl = linuxConfdUrl;
  confdExeExtension = '';
}

if (process.platform === 'darwin') {
  confdUrl = darwinConfdUrl;
  confdExeExtension = '';
}

const isInDocker = process.argv.indexOf('--indocker') !== -1;

const confdBasePath = __dirname;
const confdDevBasePath = path.join(confdBasePath, 'dev');
const confdPath = path.join(confdBasePath, `confd${confdExeExtension}`);

const confdTmplRelPath = 'production.tmpl';
const confdConfigPath = path.join(confdBasePath, 'production.toml');
const confdTmplPath = path.join(confdBasePath, confdTmplRelPath);
const devTmplPath = path.join(confdDevBasePath, '/templates/' + confdTmplRelPath);
const devConfigPath = path.join(confdDevBasePath, 'conf.d/development.toml');

const indexTmplRelPath = 'index.html';
const indexConfigPath = path.join(confdBasePath, 'index.toml');
const indexTmplPath = path.join(confdBasePath, !isInDocker ? '/../public/' : '/../html/', indexTmplRelPath);
const devIndexTmplPath = path.join(confdDevBasePath, '/templates/', indexTmplRelPath);
const devIndexConfigPath = path.join(confdDevBasePath, 'conf.d/index.toml');

const download = (uri, filename) => {
  console.log(`Downloading ${filename} from ${uri}`);

  const urlObj = new URL(uri);
  const client = urlObj.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const onError = (e) => {
      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }
      reject(e);
    };

    client
      .get(uri, (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          const fileStream = fs.createWriteStream(filename, { mode: 0o755 });
          fileStream.on('error', onError);
          fileStream.on('close', resolve);
          response.pipe(fileStream);
        } else if (response.headers.location) {
          resolve(download(response.headers.location, filename));
        } else {
          reject(
            new Error(`${response.statusCode} ${response.statusMessage}`)
          );
        }
      })
      .on('error', onError);
  });
};

const downloadIfNotExists = (uri, filename) => {
  console.log(`Checking if ${filename} exists`);
  return new Promise(resolve => {
    if (fs.existsSync(filename)) {
      console.log(`File ${filename} exists, proceeding to the next stage`);
      resolve();
      return;
    }
    console.log(`File ${filename} does not exist`);
    resolve(download(uri, filename));
  });
};

const copyFile = (src, dest, mutationFunc) => {
  const data = fs.readFileSync(src, 'utf8');
  const result = mutationFunc ? mutationFunc(data) : data;
  fs.writeFileSync(dest, result, {encoding: 'utf8'});
};

const createDirIfNotExists = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const createDevConfdConfigFile = async (env, isInDocker) => {
  createDirIfNotExists(confdDevBasePath);
  createDirIfNotExists(path.join(confdDevBasePath, 'conf.d'));
  createDirIfNotExists(path.join(confdDevBasePath, 'templates'));

  if (!env) {
    env = 'default';
  }
  console.log('Creating a development toml and tmpl files');
  const tmplCopy = copyFile(confdTmplPath, devTmplPath);
  const tomlCopy = copyFile(confdConfigPath, devConfigPath, data => {
    const target = 'dest = "' + path.join(confdBasePath, '..', 'html') + '/'; 
    return !isInDocker ? data : data.replace('dest = "public/', target);
  });
  const indexTmplCopy = copyFile(indexTmplPath, devIndexTmplPath);
  const indexTomlCopy = copyFile(indexConfigPath, devIndexConfigPath, data => {
    const target = 'dest = "' + path.join(confdBasePath, '..', 'html') + '/'; 
    return !isInDocker ? data : data.replace('dest = "public/', target);
  });

  return Promise.all([tmplCopy, tomlCopy, indexTmplCopy, indexTomlCopy]);
};

const replacePlaceHolders = () => {
  return copyFile(indexTmplPath, indexTmplPath, (content) => {
    console.log('**** Replace PLACEHOLDERS by CONFD syntax ****');
    return content
      .replace(/{PUBLIC_URL_PLACEHOLDER}/g, '{{ getv "/configuration/public/url" "." }}')
      .replace(/{APP_VERSION_PLACEHOLDER}/g, '{{ getv "/configuration/image/tag" "{APP_VERSION_PLACEHOLDER}" }}');
  });
};

const runConfd = () => {
  console.log('Running confd');
  execFile(
    `${confdPath}`,
    ['-backend', 'env', '-onetime', '-confdir', confdDevBasePath],
    (error, stdout, stderr) => {
      console.log(stdout);
      console.error(stderr);
      if (error !== null) {
        throw new Error(`execFile error: ${error}`);
      }
    }
  );
};

const help = () => {
  console.log('usage: "node <path to this script> [options]\n');
  console.log('options:');
  console.log(
    '--environment <environment name>			generate js config file instead of default.'
  );
  console.log(
    '--indocker			generate js config file in different location.'
  );
  console.log('--help			shows this help page.');
  console.log();
  process.exit(0);
};

const main = () => {
  if (process.argv.indexOf('--help') !== -1) {
    help();
  }
  const envIdx = process.argv.indexOf('--environment');
  const env = envIdx !== -1 ? process.argv[envIdx + 1] : null;
  downloadIfNotExists(confdUrl, confdPath)
    .then(() => {
      replacePlaceHolders();
      createDevConfdConfigFile(env, isInDocker);
    })
    .then(() => runConfd())
    .catch(err => {
      console.error('Failed to generate the configuration');
      console.error(err);
      process.exit(1);
    });
};

main();
