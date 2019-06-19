import rimraf from 'rimraf';

import _debug from 'debug';
const debug = _debug('lvl:utils');

const defaultInstrumentOptions = {
  // db: true,
  // read: true,
  // write: true,
  // delete: true,
  // batch: true,
};

export function instrumentDatabase(db, label, debugOptions = {}) {
  const traceOptions = { ...defaultInstrumentOptions, ...debugOptions };

  if (traceOptions.db || traceOptions.read || traceOptions.write ||
    traceOptions.delete || traceOptions.batch) {
    debug('instrumentDatabase', label);
  }
  if (traceOptions.db) {
    db.on('open', () => debug(`[log.${label}] open`));
    db.on('closed', () => debug(`[log.${label}] closed`));
  }
  if (traceOptions.write) {
    db.on('put', (key, value) => debug(`[log.${label}] put`, { key, value }));
  }
  if (traceOptions.delete) {
    db.on('del', key => debug(`[log.${label}] del`, { key }));
  }
  if (traceOptions.batch) {
    db.on('batch', ops => debug(`[log.${label}] batch`, ops));
  }
}

export function cleanDatabase(path, debugOptions = {}, skip = false) {
  if (debugOptions.db) {
    debug('cleanDatabase', { path });
  }

  return new Promise((resolve, reject) => {
    if (!skip) {
      rimraf(path, err => {
        if (err) {
          debug('cleanDatabase', { err });
          reject(err);
        } else {
          resolve();
        }
      });
    } else resolve();
  });
}

export function readAll(db, cb, streamOptions = {}, debugOptions = {}) {
  const traceOptions = { ...defaultInstrumentOptions, ...debugOptions };

  return new Promise(resolve => {
    let index = 0;
    db.createReadStream(streamOptions)
      .on('data', d => {
        if (traceOptions.read) {
          debug('stream item', { index: index++, ...d });
        }
        cb(d);
      })
      .on('close', () => {
        if (traceOptions.read) {
          debug('stream closed');
        }
        resolve();
      });
  });
}
