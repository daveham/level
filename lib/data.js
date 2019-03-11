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

export function defineDatabase(path, options) {
  return new Promise(resolve => {
    const db = levelup(encode(leveldown(path)));
    instrumentDatabase(db, 'db', options);

    db.simulations = sub(db, 'simulations', { valueEncoding: 'json' });
    instrumentDatabase(db.simulations, 'simulations', options);

    db.simulationsSourceIdx = sub(db, 'simulationsSourceIdx', {
      keyEncoding: charwise,
      valueEncoding: 'json',
    });
    instrumentDatabase(db.simulationsSourceIdx, 'simulationsSourceIdx', options);

    db.executions = sub(db, 'executions', { valueEncoding: 'json' });
    instrumentDatabase(db.executions, 'executions', options);

    db.executionsSimulationIdx = sub(db, 'executionsSimulationIdx', {
      keyEncoding: charwise,
      valueEncoding: 'json',
    });
    instrumentDatabase(db.executionsSimulationIdx, 'executionsSimulationIdx', options);

    db.renderings = sub(db, 'renderings', { valueEncoding: 'json' });
    instrumentDatabase(db.renderings, 'renderings', options);

    db.renderingsExecutionSimulationIdx = sub(db, 'renderingsExecutionSimulationIdx', {
      keyEncoding: charwise,
      valueEncoding: 'json',
    });
    instrumentDatabase(
      db.renderingsExecutionSimulationIdx,
      'renderingsExecutionSimulationIdx',
      options,
    );

    resolve(db);
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
