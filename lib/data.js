import levelup from 'levelup';
import leveldown from 'leveldown';
import charwise from 'charwise';
import uuid from 'uuid/v1';
import sub from 'subleveldown';

import { instrumentDatabase } from './utils';

// import _debug from 'debug';
// const debug = _debug('lvl:data');

export function defineDatabase(path) {
  return new Promise((resolve) => {
    const db = levelup(leveldown(path));
    instrumentDatabase(db, 'db');

    db.simulations = sub(db, 'simulations', { valueEncoding: 'json' });
    instrumentDatabase(db.simulations, 'simulations');

    db.executions = sub(db, 'executions', { valueEncoding: 'json' });
    instrumentDatabase(db.executions, 'executions');

    db.renderings = sub(db, 'renderings', { keyEncoding: charwise, valueEncoding: 'json' });
    instrumentDatabase(db.renderings, 'renderings');

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
