import uuid from 'uuid/v1';
import _ from 'highland';

import _debug from 'debug';
const debug = _debug('lvl:manager');

class Manager {
  constructor(db, dbOptions, indexOptions) {
    this.db = db;
    this.dbOptions = dbOptions;
    this.indexOptions = indexOptions;
  }

  addSimulation({ id, sourceId, created, ...other }) {
    const key = id || uuid();
    const createdOn = created || Date.now();
    const simulation = {
      ...other,
      id: key,
      sourceId,
      created: createdOn,
      modified: createdOn,
    };
    return this.db.simulations.put(key, simulation)
      .then(() => this.db.simulationsSourceIdx.put([sourceId, key], key))
      .then(() => simulation);
  }

  getSimulation(id) {
    return this.db.simulations.get(id)
      .catch((err) => {
        debug('getSimulation', err.toString());
      });
  }

  updateSimulation(id, changes) {
    const modified = Date.now();
    return this.getSimulation(id)
      .then((simulation) => {
        const newSimulation = {
          ...simulation,
          ...changes,
          modified,
        };
        return this.db.simulations.put(id, newSimulation)
          .then(() => newSimulation);
      });
  }

  addExecution({ id, simulationId, created, ...other }) {
    const key = id || uuid();
    const createdOn = created || Date.now();
    const execution = {
      ...other,
      id: key,
      simulationId,
      created: createdOn,
      modified: createdOn,
    };
    return this.db.executions.put(key, execution)
      .then(() => this.db.executionsSimulationIdx.put([simulationId, key], key))
      .then(() => execution);
  }

  getExecution(id) {
    return this.db.executions.get(id)
      .catch((err) => {
        debug('getExecution', err.toString());
      });
  }

  getExecutionsStream(simulationId) {
    const rs = this.db.executionsSimulationIdx.createValueStream({
      ...this.indexOptions,
      gte: [simulationId],
      lt: [simulationId, '\xff'],
    });
    const getExecutionInStream = _.wrapCallback(this.db.executions.get.bind(this.db.executions));
    return _(rs).map(getExecutionInStream).sequence();
  }

  getExecutions(simulationId, cb) {
    return cb
      ? this.getExecutionsStream(simulationId).toArray(cb)
      : new Promise((resolve) => this.getExecutionsStream(simulationId).toArray(resolve));
  }

  updateExecution(id, changes) {
    const modified = Date.now();
    return this.getExecution(id)
      .then((execution) => {
        const newExecution = {
          ...execution,
          ...changes,
          modified,
        };
        return this.db.executions.put(id, newExecution)
          .then(() => newExecution);
      });
  }

  addRendering({ id, executionId, created, ...other }) {
    const key = id || uuid();
    const createdOn = created || Date.now();
    const rendering = {
      ...other,
      id: key,
      executionId,
      created: createdOn,
      modified: createdOn,
    };
    return this.db.renderings.put(key, rendering)
      .then(() => this.db.renderingsExecutionIdx.put([executionId, key], key))
      .then(() => rendering);
  }

  getRendering(id) {
    return this.db.renderings.get(id)
      .catch((err) => {
        debug('getRendering', err.toString());
      });
  }

  getRenderingIndex(executionId, renderingId) {
    return this.db.renderingsExecutionIdx.get([executionId, renderingId])
      .catch((err) => {
        debug('getRenderingIndex', err.toString());
      });
  }

  getExecutionIndex(simulationId, executionId) {
    return this.db.executionsSimulationIdx.get([simulationId, executionId])
      .catch((err) => {
        debug('getExecutionIndex', err.toString());
      });
  }

  getRenderingsStream(executionId) {
    const rs = this.db.renderingsExecutionIdx.createValueStream({
      ...this.indexOptions,
      gte: [executionId],
      lt: [executionId, '\xff'],
    });
    const getRenderingInStream = _.wrapCallback(this.db.renderings.get.bind(this.db.renderings));
    return _(rs).map(getRenderingInStream).sequence();
  }

  getRenderings(executionId, cb) {
    return cb
      ? this.getRenderingsStream(executionId).toArray(cb)
      : new Promise((resolve) => this.getRenderingsStream(executionId).toArray(resolve));
  }

  updateRendering(id, changes) {
    const modified = Date.now();
    return this.getRendering(id)
      .then((rendering) => {
        const newRendering = {
          ...rendering,
          ...changes,
          modified,
        };
        return this.db.renderings.put(id, newRendering)
          .then(() => newRendering);
      });
  }

  deleteRendering(id) {
    return this.db.renderings.get(id)
      .then((ren) => Promise.all([
        this.db.renderingsExecutionIdx.del([ren.executionId, id]),
        this.db.renderings.del(id),
      ]))
      .catch((err) => {
        debug('deleteRendering', err.toString());
        throw err;
      });
  }

  deleteExecution(id) {
    return this.getRenderings(id)
      .then((rows) => Promise.all([
        this.db.renderingsExecutionIdx.batch(rows.map((rendering) => ({
          type: 'del',
          key: [id, rendering.id],
        }))),
        this.db.renderings.batch(rows.map((rendering) => ({
          type: 'del',
          key: rendering.id,
        }))),
      ]))
      .then(() => this.db.executions.get(id))
      .then((exe) => Promise.all([
        this.db.executionsSimulationIdx.del([exe.simulationId, exe.id]),
        this.db.executions.del(exe.id),
      ]))
      .catch((err) => {
        debug('deleteExecution', err.toString());
        throw err;
      });
  }
}

export default Manager;
