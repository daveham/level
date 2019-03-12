// import charwise from 'charwise';
import { cleanDatabase, readAll } from './lib/utils';
import { generateMockSimulation, defineDatabase, indexDbOptions } from './lib/data';

import _debug from 'debug';
const debug = _debug('lvl:app');

const dbPath = process.env.DBPATH || './mydb';

const sims = [];
sims.push(generateMockSimulation('1001', [4, 3, 7]));
sims.push(generateMockSimulation('1001', [3, 2, 9, 6, 4]));

const debugOptions = { db: false, read: false, write: false, delete: false, batch: false };
let db;
cleanDatabase(dbPath, false)
  .then(() => defineDatabase(dbPath, debugOptions))
  .then(data => {
    db = data;
    return db.simulations.batch(
      sims.map(s => {
        const { executions: ignore, id, ...other } = s;
        return { type: 'put', key: id, value: { id, ...other } };
      }),
    );
  })
  .then(() =>
    db.simulationsSourceIdx.batch(
      sims.map(s => ({ type: 'put', key: [s.sourceId, s.id], value: s.id })),
    ),
  )
  .then(() => {
    const executions = sims.reduce((acc, s) => [...acc, ...s.executions], []);
    return db.executions.batch(
      executions.map(e => {
        const { renderings: ignore, id, ...other } = e;
        return { type: 'put', key: id, value: { id, ...other } };
      }),
    );
  })
  .then(() => {
    const executions = sims.reduce((acc, s) => [...acc, ...s.executions], []);
    return db.executionsSimulationIdx.batch(
      executions.map(e => {
        return { type: 'put', key: [e.simulationId, e.id], value: e.id };
      }),
    );
  })
  .then(() => {
    const renderings = sims
      .reduce((acc, s) => [...acc, ...s.executions], [])
      .reduce((acc, e) => [...acc, ...e.renderings], []);
    return db.renderings.batch(
      renderings.map(r => {
        const { id, ...other } = r;
        return { type: 'put', key: id, value: { id, ...other } };
      }),
    );
  })
  .then(() => {
    const renderings = sims
      .reduce((acc, s) => [...acc, ...s.executions], [])
      .reduce((acc, e) => [...acc, ...e.renderings], []);
    return db.renderingsExecutionSimulationIdx.batch(
      renderings.map(r => {
        return { type: 'put', key: [r.executionId, r.id], value: r.id };
      }),
    );
  })
  .then(() => db.simulations.get(sims[0].id))
  .then(value => debug('read from simulations: ' + JSON.stringify(value)))
  .then(() => db.executions.get(sims[0].executions[0].id))
  .then(value => debug('read from executions: ' + JSON.stringify(value)))
  .then(() => db.renderings.get(sims[0].executions[0].renderings[0].id))
  .then(value => debug('read from renderings: ' + JSON.stringify(value)))
  .then(() => readAll(db.simulationsSourceIdx, indexDbOptions, debugOptions))
  .then(() => readAll(db.executionsSimulationIdx, indexDbOptions, debugOptions))
  .then(() => readAll(db.renderingsExecutionSimulationIdx, indexDbOptions, debugOptions))
  .then(() => {
    const s = sims[0];
    const e = s.executions[0];
    // const r = e.renderings[0];
    debug('filter resIdx to e.id', { idx: e.id });
    return readAll(
      db.renderingsExecutionSimulationIdx,
      {
        ...indexDbOptions,
        gte: [e.id],
        lt: [e.id, '\xff'],
      },
      { read: true },
    );
  })
  .then(() => db.close())
  .then(() => debug('finished'))
  .catch(err => debug('caught error', { err }));
