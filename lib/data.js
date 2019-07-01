import levelup from 'levelup';
import leveldown from 'leveldown';
import encode from 'encoding-down';
import charwise from 'charwise';
import uuid from 'uuid/v1';
import sub from '../down';
// import sub from 'subleveldown';

import { instrumentDatabase } from './utils';
import Manager from './manager';

// import _debug from 'debug';
// const debug = _debug('lvl:data');

export const dataDbOptions = { valueEncoding: 'json' };
export const indexDbOptions = { keyEncoding: charwise, valueEncoding: 'json' };
const defaultDebugOptions = {
  // db: true,
  // read: true,
  // write: true,
  // delete: false,
  // batch: false,
};

export function extendDatabase(storage, debugOptions = {}) {
  const db = levelup(encode(storage));
  const loggingOptions = {
    ...defaultDebugOptions,
    ...debugOptions,
  };
  instrumentDatabase(db, 'db', loggingOptions);

  const dataDbs = ['simulations', 'executions', 'renderings'];
  const indexDbs = ['simulationsSourceIdx', 'executionsSimulationIdx', 'renderingsExecutionIdx'];

  dataDbs.forEach(name => {
    db[name] = sub(db, name, dataDbOptions);
    instrumentDatabase(db[name], name, loggingOptions);
  });

  indexDbs.forEach(name => {
    db[name] = sub(db, name, indexDbOptions);
    instrumentDatabase(db[name], name, loggingOptions);
  });

  return db;
}

export function createManager(db) {
  return new Manager(db, dataDbOptions, indexDbOptions);
}

export function defineDatabase(path, debugOptions = {}) {
  return Promise.resolve(extendDatabase(leveldown(path), debugOptions));
}

export function createMockSimulations() {
  const created = Date.now();
  const s1 = {
    id: uuid(),
    created,
    modified: created,
    sourceId: '1001',
    name: 'Bright and Early',
  };
  return [s1];
}

export function createMockExecutions(simulation) {
  const created = Date.now();
  const e1 = {
    id: uuid(),
    created,
    modified: created,
    name: 'First Exec',
    simulationId: simulation.id,
  };
  return [e1];
}

export function createMockRenderings(simulation, execution) {
  const created = Date.now();
  const r1 = {
    id: uuid(),
    created,
    modified: created,
    name: 'First Rendering',
    simulationId: simulation.id,
    executionId: execution.id,
  };
  return [r1];
}

export function createMockSimulation(sourceId) {
  const created = Date.now();
  const id = uuid();
  return {
    id,
    created,
    modified: created,
    sourceId,
    name: `This is the name of sim.${id}`,
  };
}

export function createMockExecution(simulationId) {
  const created = Date.now();
  const id = uuid();
  return {
    id,
    created,
    modified: created,
    simulationId,
    name: `This is the name of exe.${id}`,
  };
}

export function createMockRendering(executionId) {
  const created = Date.now();
  const id = uuid();
  return {
    id,
    created,
    modified: created,
    executionId,
    name: `This is the name of ren.${id}`,
  };
}

export function generateMockRendering(simulationId, executionId) {
  const created = Date.now();
  const id = uuid();
  return {
    id,
    created,
    modified: created,
    simulationId,
    executionId,
    name: `sim${simulationId}-ex${executionId}-ren${id}`,
  };
}

export function generateMockExecution(simulationId, renderingCount) {
  const created = Date.now();
  const id = uuid();
  const execution = {
    id,
    created,
    modified: created,
    simulationId,
    renderings: [],
    name: `sim${simulationId}-ex${id}`,
  };

  for (let i = 0; i < renderingCount; i++) {
    execution.renderings.push(generateMockRendering(simulationId, id));
  }
  return execution;
}

export function generateMockSimulation(sourceId, renderingCounts) {
  const created = Date.now();
  const id = uuid();
  return {
    id,
    created,
    modified: created,
    sourceId,
    executions: renderingCounts.map(n => generateMockExecution(id, n)),
    name: `This is the name of sim${id}`,
  };
}
