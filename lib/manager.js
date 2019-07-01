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

  getExecutions(simulationId) {
    const rs = this.db.executionsSimulationIdx.createValueStream({
      ...this.indexOptions,
      gte: [simulationId],
      lt: [simulationId, '\xff'],
    });
    const getExecutionInStream = _.wrapCallback(this.db.executions.get.bind(this.db.executions));
    return _(rs)
      .map(getExecutionInStream)
      .sequence();
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

  getRenderings(executionId) {
    const rs = this.db.renderingsExecutionIdx.createValueStream({
      ...this.indexOptions,
      gte: [executionId],
      lt: [executionId, '\xff'],
    });
    const getRenderingInStream = _.wrapCallback(this.db.renderings.get.bind(this.db.renderings));
    return _(rs)
      .map(getRenderingInStream)
      .sequence();
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
    return this.db.renderings.del(id)
      .catch((err) => {
        debug('deleteRendering', err.toString());
        throw err;
      });
  }
}

export default Manager;
