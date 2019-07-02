// import charwise from 'charwise';
import { cleanDatabase } from './lib/utils';
import {
  generateMockSimulation,
  defineDatabase,
  createManager,
} from './lib/data';

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

// const noOp = () => {};

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
      return db.renderingsExecutionIdx.batch(
        renderings.map(r => ({ type: 'put', key: [r.executionId, r.id], value: r.id })));
    });
};

const exploreDataTypes = (mgr) => {
  // read the first simulation
  return mgr.getSimulation(sims[0].id)
    .then(value => debug('read from simulations: ' + JSON.stringify(value)))
    // read the first execution of the simulation
    .then(() => mgr.getExecution(sims[0].executions[0].id))
    .then(value => debug('read from executions: ' + JSON.stringify(value)))
    // read the first rendering of the execution
    .then(() => mgr.getRendering(sims[0].executions[0].renderings[0].id))
    .then(value => debug('read from renderings: ' + JSON.stringify(value)));
};

const exploreDataFilters = (mgr) => {
  const e0 = sims[0].executions[0];
  const e1 = sims[1].executions[0];

  debug('query renderings for execution e0', e0.id);
  return mgr.getRenderings(e0.id)
    .then((rows) => {
      debug('via promise', rows);
      return rows;
    })
    .then(() => {
      debug('invoking with callback');
      return new Promise((resolve) => {
        mgr.getRenderings(e0.id, renderings => {
          debug('via callback', renderings);
          resolve();
        });
      });
    })
    .then(() => {
      debug('query renderings for execution e1', e1.id);
      return mgr.getRenderings(e1.id);
    })
    .then((rows) => {
      debug('via promise', rows);
      return new Promise((resolve) => {
        mgr.getRenderings(e1.id, renderings => {
          debug('via callback', renderings);
          resolve();
        });
      });
    });
};

cleanDatabase(dbPath)
  .then(() => defineDatabase(dbPath, debugOptions))
  .then(db => addMockData(db)
    .then(() => {
      const mgr = createManager(db);
      return exploreDataTypes(mgr)
        .then(() => exploreDataFilters(mgr))
        .then(() => db.close());
    }))
  .catch(err => debug('caught error', { err }));
