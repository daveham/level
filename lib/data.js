import levelup from 'levelup';
import leveldown from 'leveldown';
import encode from 'encoding-down';
import charwise from 'charwise';
import uuid from 'uuid/v1';
import sub from '../down';
// import sub from 'subleveldown';

import { instrumentDatabase } from './utils';

// import _debug from 'debug';
// const debug = _debug('lvl:data');

export const dataDbOptions = { valueEncoding: 'json' };
export const indexDbOptions = { keyEncoding: charwise, valueEncoding: 'json' };

export function extendDatabase(db, debugOptions) {
  instrumentDatabase(db, 'db', debugOptions);

  const dataDbs = ['simulations', 'executions', 'renderings'];
  const indexDbs = ['simulationsSourceIdx', 'executionsSimulationIdx', 'renderingsExecutionSimulationIdx'];

  dataDbs.forEach(name => {
    db[name] = sub(db, name, dataDbOptions);
    instrumentDatabase(db[name], name, debugOptions);
  });

  indexDbs.forEach(name => {
    db[name] = sub(db, name, indexDbOptions);
    instrumentDatabase(db[name], name, debugOptions);
  });

  return db;
}

export function defineDatabase(path, debugOptions) {
  return new Promise(resolve => {
    const db = levelup(encode(leveldown(path)));
    resolve(extendDatabase(db, debugOptions));
  });
}

export function createMockSimulations() {
  const d = new Date();
  const s1 = {
    id: uuid(),
    created: d,
    modified: d,
    sourceId: '1001',
    name: 'Bright and Early',
  };
  return [s1];
}

export function createMockExecutions(simulation) {
  const d = new Date();
  const e1 = {
    id: uuid(),
    created: d,
    modified: d,
    name: 'First Exec',
    simulationId: simulation.id,
  };
  return [e1];
}

export function createMockRenderings(simulation, execution) {
  const d = new Date();
  const r1 = {
    id: uuid(),
    created: d,
    modified: d,
    name: 'First Rendering',
    simulationId: simulation.id,
    executionId: execution.id,
  };
  return [r1];
}

export function createMockSimulation(sourceId) {
  const created = new Date();
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
  const created = new Date();
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
  const created = new Date();
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
  const created = new Date();
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
  const created = new Date();
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
  const created = new Date();
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
