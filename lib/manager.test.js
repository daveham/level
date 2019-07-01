import memdown from 'memdown';
import _ from 'highland';

import {
  createManager,
  extendDatabase,
  createMockSimulation,
  createMockExecution,
  createMockRendering,
} from './data';

import _debug from 'debug';
const debug = _debug('lvl:manager:test');

describe('db manager', () => {
  const sourceId = '1001';
  let mgr;
  beforeEach(() => {
    mgr = createManager(extendDatabase(memdown()));
  });

  test('add simulation', () => {
    const s = createMockSimulation(sourceId);
    debug('mock simulation', s);
    return mgr.addSimulation(s)
      .then(sim => {
        debug('simulation', sim);
        expect(sim).toBeDefined();
        expect(sim.id).toEqual(s.id);
        expect(sim.sourceId).toEqual(sourceId);
      });
  });

  test('get simulation', () => {
    const s = createMockSimulation(sourceId);
    debug('mock simulation', s);
    return mgr.addSimulation(s)
      .then(() => mgr.getSimulation(s.id))
      .then(sim => {
        debug('simulation', sim);
        expect(sim).toBeDefined();
        expect(sim.id).toEqual(s.id);
      });
  });

  test('add execution', () => {
    const s = createMockSimulation(sourceId);
    debug('mock simulation', s);
    const e = createMockExecution(s.id);
    debug('mock execution', e);
    return mgr.addExecution(e)
      .then(exe => {
        debug('execution', exe);
        expect(exe).toBeDefined();
        expect(exe.id).toEqual(e.id);
        expect(exe.simulationId).toEqual(s.id);
      });
  });

  test('get execution', () => {
    const s = createMockSimulation(sourceId);
    debug('mock simulation', s);
    const e = createMockExecution(s.id);
    debug('mock execution', e);
    return mgr.addExecution(e)
      .then(() => mgr.getExecution(e.id))
      .then(exe => {
        debug('execution', exe);
        expect(exe).toBeDefined();
        expect(exe.id).toEqual(e.id);
        expect(exe.simulationId).toEqual(s.id);
      });
  });

  test('get executions', () => {
    const s = createMockSimulation(sourceId);
    debug('mock simulation', s);
    const e1 = createMockExecution(s.id);
    const e2 = createMockExecution(s.id);
    debug('mock executions', { e1, e2 });
    return mgr.addExecution(e1)
      .then(() => mgr.addExecution(e2))
      .then(() =>
        _(mgr.getExecutions(s.id))
          .toArray((rows) => {
            debug('executions', rows);
            expect(rows).toHaveLength(2);
            expect(rows[0].id).toEqual(e1.id);
            expect(rows[0].simulationId).toEqual(s.id);
            expect(rows[1].id).toEqual(e2.id);
            expect(rows[1].simulationId).toEqual(s.id);
          }));
  });

  test('add rendering', () => {
    const s = createMockSimulation(sourceId);
    debug('mock simulation', s);
    const e = createMockExecution(s.id);
    debug('mock execution', e);
    const r = createMockRendering(e.id);
    debug('mock rendering', r);
    return mgr.addRendering(r)
      .then(ren => {
        debug('rendering', ren);
        expect(ren).toBeDefined();
        expect(ren.id).toEqual(r.id);
        expect(ren.executionId).toEqual(e.id);
      });
  });

  test('get rendering', () => {
    const s = createMockSimulation(sourceId);
    debug('mock simulation', s);
    const e = createMockExecution(s.id);
    debug('mock execution', e);
    const r = createMockRendering(e.id);
    debug('mock rendering', r);
    return mgr.addRendering(r)
      .then(() => mgr.getRendering(r.id))
      .then(ren => {
        debug('rendering', ren);
        expect(ren).toBeDefined();
        expect(ren.id).toEqual(r.id);
        expect(ren.executionId).toEqual(e.id);
      });
  });

  test('get renderings', () => {
    const s = createMockSimulation(sourceId);
    debug('mock simulation', s);
    const e = createMockExecution(s.id);
    debug('mock execution', e);
    const r1 = createMockRendering(e.id);
    const r2 = createMockRendering(e.id);
    debug('mock renderings', { r1, r2 });
    return mgr.addRendering(r1)
      .then(() => mgr.addRendering(r2))
      .then(() =>
        _(mgr.getRenderings(e.id))
          .toArray((rows) => {
            debug('renderings', rows);
            expect(rows).toHaveLength(2);
            expect(rows[0].id).toEqual(r1.id);
            expect(rows[0].executionId).toEqual(e.id);
            expect(rows[1].id).toEqual(r2.id);
            expect(rows[1].executionId).toEqual(e.id);
          }));
  });

  test('update simulation', () => {
    const s = createMockSimulation(sourceId);
    return mgr.addSimulation(s)
      .then((sim) => {
        expect(sim.modified).toEqual(sim.created);
        return mgr.updateSimulation(sim.id, { name: 'modified' });
      })
      .then((sim) => {
        expect(sim).toBeDefined();
        expect(sim.id).toEqual(s.id);
        expect(sim.name).toEqual('modified');
        expect(sim.created).toEqual(s.created);
        expect(sim.modified).not.toEqual(sim.created);
      });
  });

  test('update execution', () => {
    const s = createMockSimulation(sourceId);
    const e = createMockExecution(s.id);
    return mgr.addExecution(e)
      .then((exe) => {
        expect(exe.modified).toEqual(exe.created);
        return mgr.updateExecution(exe.id, { name: 'modified' });
      })
      .then((exe) => {
        expect(exe).toBeDefined();
        expect(exe.id).toEqual(e.id);
        expect(exe.simulationId).toEqual(s.id);
        expect(exe.name).toEqual('modified');
        expect(exe.created).toEqual(e.created);
        expect(exe.modified).not.toEqual(exe.created);
      });
  });

  test('update rendering', () => {
    const s = createMockSimulation(sourceId);
    const e = createMockExecution(s.id);
    const r = createMockRendering(e.id);
    return mgr.addRendering(r)
      .then((ren) => {
        expect(ren.modified).toEqual(ren.created);
        return mgr.updateRendering(ren.id, { name: 'modified' });
      })
      .then((ren) => {
        expect(ren).toBeDefined();
        expect(ren.id).toEqual(r.id);
        expect(ren.executionId).toEqual(e.id);
        expect(ren.name).toEqual('modified');
        expect(ren.created).toEqual(r.created);
        expect(ren.modified).not.toEqual(ren.created);
      });
  });

  test('delete rendering', () => {
    const s = createMockSimulation(sourceId);
    const e = createMockExecution(s.id);
    const r = createMockRendering(e.id);
    let rid;
    return mgr.addRendering(r)
      .then((ren) => {
        rid = ren.id;
        debug('render id to delete', { rid });
        return mgr.deleteRendering(rid);
      })
      .then(() => mgr.getRendering(rid))
      .then((ren) => {
        expect(ren).toBeUndefined();
      });
  });
});
