import uuid from 'uuid/v1';

import _debug from 'debug';
const debug = _debug('lvl:manager');

function restoreDates(model) {
  model.created = new Date(model.created);
  model.modified = new Date(model.modified);
  return model;
}

class Manager {
  constructor(db) {
    this.db = db;
  }

  addSimulation({ id, sourceId, created, ...other }) {
    const key = id || uuid();
    const createdOn = created || new Date();
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
      .then((simulation) => restoreDates(simulation));
  }

  updateSimulation(id, changes) {
    const modified = new Date();
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
    const createdOn = created || new Date();
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
      .then((execution) => restoreDates(execution));
  }

  updateExecution(id, changes) {
    const modified = new Date();
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
    const createdOn = created || new Date();
    const rendering = {
      ...other,
      id: key,
      executionId,
      created: createdOn,
      modified: createdOn,
    };
    return this.db.renderings.put(key, rendering)
      .then(() => this.db.renderingsExecutionSimulationIdx.put([executionId, key], key))
      .then(() => rendering);
  }

  getRendering(id) {
    return this.db.renderings.get(id)
      .then((rendering) => restoreDates(rendering))
      .catch((err) => {
        debug('getRendering', err.toString());
      });
  }

  updateRendering(id, changes) {
    const modified = new Date();
    return this.db.renderings.get(id)
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
