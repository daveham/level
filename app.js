import charwise from 'charwise';

import levelup from 'levelup';
import leveldown from 'leveldown';

import uuid from 'uuid/v1';
import sub from 'subleveldown';

import rimraf from 'rimraf';

import _debug from 'debug';
const debug = _debug('lvl:db');

const dbPath = './mydb';

function instrumentDatabase(db, label) {
  db.on('open', () => debug(`[log.${label}] open`));
  db.on('closed', () => debug(`[log.${label}] closed`));
  db.on('put', key => debug(`[log.${label}] put`, { key }));
  db.on('del', key => debug(`[log.${label}] del`, { key }));
}

function clean(path, skip) {
  if (skip) return Promise.resolve();
  return new Promise((resolve, reject) => {
    rimraf(path, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function readAll(db) {
  return new Promise((resolve) => {
    db.createReadStream()
      .on('data', d => debug('read stream: ', { d }))
      .on('close', () => { debug('stream closed'); resolve(); });
  });
}

let db, sliceOne, sliceOneNestOne, sliceTwo, sliceTwoNestTwo;
const sliceOneKey = uuid();
const sliceTwoKey = uuid();
const sliceThreeKey = uuid();

clean(dbPath, true)
  .then(() => {
    db = levelup(leveldown(dbPath));
    instrumentDatabase(db, 'top');

    sliceOne = sub(db, 'sliceOne');
    instrumentDatabase(sliceOne, 'sliceOne');
    sliceOneNestOne = sub(sliceOne, 'nestOne', { keyEncoding: charwise, valueEncoding: 'json' });
    instrumentDatabase(sliceOneNestOne, 'sliceOneNestOne');

    sliceTwo = sub(db, 'sliceTwo');
    instrumentDatabase(sliceTwo, 'sliceTwo');
    sliceTwoNestTwo = sub(sliceTwo, 'nestTwo', { keyEncoding: charwise, valueEncoding: 'json' });
    instrumentDatabase(sliceTwoNestTwo, 'sliceTwoNestTwo');

    return db.put('root', 'rootValue');
  })
  .then(() =>
    sliceOneNestOne.put(sliceOneKey, {
      label: 'one',
      data: { raw: 1, text: 'one' },
    }),
  )
  .then(() =>
    sliceTwoNestTwo.put(sliceTwoKey, {
      label: 'two',
      data: { raw: 2, text: 'two' },
    }),
  )
  .then(() =>
    sliceTwoNestTwo.put(sliceThreeKey, {
      label: 'three',
      data: { raw: 3, text: 'three' },
    }),
  )
  .then(() => sliceOneNestOne.get(sliceOneKey))
  .then(value => debug('read from sliceOne: ' + JSON.stringify(value)))
  .then(() => sliceTwoNestTwo.get(sliceTwoKey))
  .then(value => debug('read from sliceTwo: ' + JSON.stringify(value)))
  .then(() => readAll(sliceOneNestOne))
  .then(() => readAll(sliceTwoNestTwo))
  .then(() => db.close())
  .then(() => sliceOne.close())
  .then(() => sliceOneNestOne.close())
  .then(() => sliceTwo.close())
  .then(() => sliceTwoNestTwo.close())
  .catch(err => debug('caught error', { err }));
