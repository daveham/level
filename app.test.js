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

import _debug from 'debug';
const debug = _debug('lvl:app:test');

const debugOptions = { db: true, read: true, write: true, delete: false, batch: false };

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
    debug('mock simulation', s);
    return mgr.addSimulation(s)
      .then(sim => {
        debug('simulation', sim);
        expect(sim).toBeDefined();
        expect(sim.id).toEqual(s.id);
        expect(sim.sourceId).toEqual(sourceId);
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

  test('update simulation', () => {
    const s = createMockSimulation(sourceId);
    return mgr.addSimulation(s)
      .then((sim) => mgr.updateSimulation(sim.id, { name: 'modified' }))
      .then(() => mgr.getSimulation(s.id))
      .then((sim) => {
        expect(sim).toBeDefined();
        expect(sim.id).toEqual(s.id);
        expect(sim.name).toEqual('modified');
        expect(sim.created).toEqual(s.created);
        expect(sim.modified).not.toEqual(s.modified);
      });
  });

  test('update execution', () => {
    const s = createMockSimulation(sourceId);
    const e = createMockExecution(s.id);
    return mgr.addExecution(e)
      .then((exe) => mgr.updateExecution(exe.id, { name: 'modified' }))
      .then(() => mgr.getExecution(e.id))
      .then((exe) => {
        expect(exe).toBeDefined();
        expect(exe.id).toEqual(e.id);
        expect(exe.simulationId).toEqual(s.id);
        expect(exe.name).toEqual('modified');
        expect(exe.created).toEqual(e.created);
        expect(exe.modified).not.toEqual(e.modified);
      });
  });

  test('update rendering', () => {
    const s = createMockSimulation(sourceId);
    const e = createMockExecution(s.id);
    const r = createMockRendering(e.id);
    return mgr.addRendering(r)
      .then((ren) => mgr.updateRendering(ren.id, { name: 'modified' }))
      .then(() => mgr.getRendering(r.id))
      .then((ren) => {
        expect(ren).toBeDefined();
        expect(ren.id).toEqual(r.id);
        expect(ren.executionId).toEqual(e.id);
        expect(ren.name).toEqual('modified');
        expect(ren.created).toEqual(r.created);
        expect(ren.modified).not.toEqual(r.modified);
      });
  });
});
