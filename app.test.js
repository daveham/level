import levelup from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';
import Manager from './lib/manager';

import {
  extendDatabase,
  createMockSimulation,
  createMockExecution,
  createMockRendering,
} from './lib/data';

// import _debug from 'debug';
// const debug = _debug('lvl:app:test');

const debugOptions = { db: false, read: false, write: false, delete: false, batch: false };

describe('db manager', () => {
  const sourceId = '1001';
  let mgr;
  beforeEach(() => {
    const db = levelup(encode(memdown()));
    extendDatabase(db, debugOptions);
    mgr = new Manager(db);
  });

  test('add simulation', () => {
    const s = createMockSimulation(sourceId);
    return mgr.addSimulation(s)
      .then(sim => {
        expect(sim).toBeDefined();
        expect(sim.id).toEqual(s.id);
        expect(sim.sourceId).toEqual(sourceId);
      });
  });

  test('add execution', () => {
    const s = createMockSimulation(sourceId);
    const e = createMockExecution(s.id);
    return mgr.addExecution(e)
      .then(exe => {
        expect(exe).toBeDefined();
        expect(exe.id).toEqual(e.id);
        expect(exe.simulationId).toEqual(s.id);
      });
  });

  test('add rendering', () => {
    const s = createMockSimulation(sourceId);
    const e = createMockExecution(s.id);
    const r = createMockRendering(e.id);
    return mgr.addRendering(r)
      .then(ren => {
        expect(ren).toBeDefined();
        expect(ren.id).toEqual(r.id);
        expect(ren.executionId).toEqual(e.id);
      });
  });
});
