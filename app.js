// import charwise from 'charwise';
import { cleanDatabase, readAll } from './lib/utils';
import { generateMockSimulation, defineDatabase, indexDbOptions } from './lib/data';

import _debug from 'debug';
const debug = _debug('lvl:app');

const dbPath = process.env.DBPATH || './mydb';
const debugOptions = {
  // db: true,
  // read: true,
  // write: true,
  // delete: true,
  // batch: true,
};

const sims = [];
sims.push(generateMockSimulation('1001', [4, 3, 7]));
sims.push(generateMockSimulation('1001', [3, 2, 9, 6, 4]));

const noOp = () => {};

const addMockData = (db) => {
  // add simulations based on mock simulation data
  return db.simulations.batch(
    sims.map(({ executions: ignore, id, ...other }) =>
      ({ type: 'put', key: id, value: { id, ...other } }))
  )
    .then(() =>
      // add index for simulations
      db.simulationsSourceIdx.batch(
        sims.map(s => ({ type: 'put', key: [s.sourceId, s.id], value: s.id })))
    )
    .then(() => {
      const executions = sims.reduce((acc, s) => [...acc, ...s.executions], []);
      // add executions based on mock simulation data
      return db.executions.batch(
        executions.map(({ renderings: ignore, id, ...other }) =>
          ({ type: 'put', key: id, value: { id, ...other } })));
    })
    .then(() => {
      const executions = sims.reduce((acc, s) => [...acc, ...s.executions], []);
      // add index for executions
      return db.executionsSimulationIdx.batch(
        executions.map(e => ({ type: 'put', key: [e.simulationId, e.id], value: e.id })));
    })
    .then(() => {
      const renderings = sims
        .reduce((acc, s) => [...acc, ...s.executions], [])
        .reduce((acc, e) => [...acc, ...e.renderings], []);
      // add renderings based on mock rendering data
      return db.renderings.batch(
        renderings.map(({ id, ...other }) => ({ type: 'put', key: id, value: { id, ...other } })));
    })
    .then(() => {
      const renderings = sims
        .reduce((acc, s) => [...acc, ...s.executions], [])
        .reduce((acc, e) => [...acc, ...e.renderings], []);
      // add index for renderings
      return db.renderingsExecutionSimulationIdx.batch(
        renderings.map(r => ({ type: 'put', key: [r.executionId, r.id], value: r.id })));
    });
};

const exploreDataTypes = (db) => {
  // read the first simulation
  return db.simulations.get(sims[0].id)
    .then(value => debug('read from simulations: ' + JSON.stringify(value)))
    // read the first execution of the simulation
    .then(() => db.executions.get(sims[0].executions[0].id))
    .then(value => debug('read from executions: ' + JSON.stringify(value)))
    // read the first rendering of the execution
    .then(() => db.renderings.get(sims[0].executions[0].renderings[0].id))
    .then(value => debug('read from renderings: ' + JSON.stringify(value)))
    // read all simulation index entries (to produce debug output)
    .then(() => readAll(db.simulationsSourceIdx, noOp, indexDbOptions, debugOptions))
    // read all execution index entries (to produce debug output)
    .then(() => readAll(db.executionsSimulationIdx, noOp, indexDbOptions, debugOptions))
    // read all rendering index entries (to produce debug output)
    .then(() => readAll(db.renderingsExecutionSimulationIdx, noOp, indexDbOptions, debugOptions));
};

const exploreDataFilters = (db) => {
  const e0 = sims[0].executions[0];
  const e1 = sims[1].executions[0];

  const collectZero = [];
  const collectOne = [];

  debug('filter resIdx to first e.id', { idx: e0.id });
  return readAll(
    db.renderingsExecutionSimulationIdx,
    (d) => { collectZero.push(d.value); },
    {
      ...indexDbOptions,
      gte: [e0.id],
      lt: [e0.id, '\xff'],
    },
    debugOptions, // { read: true, db: true },
  )
    .then(() => {
      debug('filter resIdx to second e.id', { idx: e1.id });
      return readAll(
        db.renderingsExecutionSimulationIdx,
        (d) => {
          collectOne.push(d.value);
        },
        {
          ...indexDbOptions,
          gte: [e1.id],
          lt: [e1.id, '\xff'],
        },
        debugOptions, // { read: true, db: true },
      );
    })
    .then(() => {
      debug('filtered first results', collectZero);
      debug('filtered second results', collectOne);
    });
};

cleanDatabase(dbPath)
  .then(() => defineDatabase(dbPath, debugOptions))
  .then(db =>
    addMockData(db)
      .then(() => exploreDataTypes(db))
      .then(() => exploreDataFilters(db))
      .then(() => {
        debug('finished');
        return db.close();
      }))
  .catch(err => debug('caught error', { err }));
