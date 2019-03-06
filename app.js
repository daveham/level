import { cleanDatabase } from './lib/utils';
import {
  createMockSimulations,
  createMockExecutions,
  createMockRenderings,
  defineDatabase,
} from './lib/data';

import _debug from 'debug';
const debug = _debug('lvl:db');

const dbPath = process.env.DBPATH || './mydb';

const s1 = createMockSimulations()[0];
const e1 = createMockExecutions(s1)[0];
const r1 = createMockRenderings(s1, e1)[0];
debug('sample s1', s1);
debug('sample e1', e1);
debug('sample r1', r1);

let db;
cleanDatabase(dbPath, false)
  .then(() => defineDatabase(dbPath))
  .then(data => {
    db = data;
    return db.simulations.put(s1.id, s1);
  })
  .then(() => db.executions.put(e1.id, e1))
  .then(() => db.renderings.put(r1.id, r1))
  .then(() => db.simulations.get(s1.id))
  .then(value => debug('read from simulations: ' + JSON.stringify(value)))
  .then(() => db.executions.get(e1.id))
  .then(value => debug('read from executions: ' + JSON.stringify(value)))
  .then(() => db.renderings.get(r1.id))
  .then(value => debug('read from renderings: ' + JSON.stringify(value)))
  .then(() => db.close())
  .then(() => debug('finished'))
  .catch(err => debug('caught error', { err }));
