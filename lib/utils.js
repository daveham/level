import rimraf from 'rimraf';

import _debug from 'debug';
const debug = _debug('lvl:utils');

const defaultInstrumentOptions = { db: true, read: true, write: true, delete: true, batch: true };
export function instrumentDatabase(db, label, options = {}) {
  const debugOptions = { ...defaultInstrumentOptions, ...options };
  debug('instrumentDatabase', label);
  if (debugOptions.db) {
    db.on('open', () => debug(`[log.${label}] open`));
    db.on('closed', () => debug(`[log.${label}] closed`));
  }
  if (debugOptions.write) {
    db.on('put', (key, value) => debug(`[log.${label}] put`, { key, value }));
  }
  if (debugOptions.delete) {
    db.on('del', key => debug(`[log.${label}] del`, { key }));
  }
  if (debugOptions.batch) {
    db.on('batch', (ops) => debug(`[log.${label}] batch`, ops));
  }
}

export function cleanDatabase(path, skip) {
  if (skip) {
    return Promise.resolve();
  }

  debug('cleanDatabase', { path });
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

export function readAll(db, options = {}) {
  const debugOptions = { ...defaultInstrumentOptions, ...options };
  return new Promise((resolve) => {
    let index = 0;
    db.createReadStream()
    .on('data', d => {
      if (debugOptions.read) {
        debug('read stream: ', { index: index++, ...d })
      }
    })
    .on('close', () => {
      if (debugOptions.read) {
        debug('stream closed');
      }
      resolve();
    });
  });
}
