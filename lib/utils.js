import rimraf from 'rimraf';

import _debug from 'debug';
const debug = _debug('lvl:utils');

export function instrumentDatabase(db, label) {
  db.on('open', () => debug(`[log.${label}] open`));
  db.on('closed', () => debug(`[log.${label}] closed`));
  db.on('put', (key, value) => debug(`[log.${label}] put`, { key, value }));
  db.on('del', key => debug(`[log.${label}] del`, { key }));
  db.on('batch', (ops) => debug(`[log.${label}] batch`, ops));
}

export function cleanDatabase(path, skip) {
  if (skip) {
    debug('cleanDatabase', { skip });
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    rimraf(path, err => {
      if (err) {
        debug('cleanDatabase', { err });
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function readAll(db) {
  return new Promise((resolve) => {
    db.createReadStream()
    .on('data', d => debug('read stream: ', { d }))
    .on('close', () => { debug('stream closed'); resolve(); });
  });
}
