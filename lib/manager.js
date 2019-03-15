import uuid from 'uuid/v1';

class Manager {
  constructor(db) {
    this.db = db;
  }

  addSimulation({ id, sourceId, ...other }) {
    const key = id || uuid();
    const simulation = { id: key, sourceId, ...other };
    return this.db.simulations.put(key, simulation)
      .then(() => this.db.simulationsSourceIdx.put([sourceId, key], key))
      .then(() => Promise.resolve(simulation));
  }

  addExecution({ id, simulationId, ...other }) {
    const key = id || uuid();
    const execution = { id: key, simulationId, ...other };
    return this.db.executions.put(key, execution)
      .then(() => this.db.executionsSimulationIdx.put([simulationId, key], key))
      .then(() => Promise.resolve(execution));
  }

  addRendering({ id, executionId, ...other }) {
    const key = id || uuid();
    const rendering = { id: key, executionId, ...other };
    return this.db.renderings.put(key, rendering)
      .then(() => this.db.renderingsExecutionSimulationIdx.put([executionId, key], key))
      .then(() => Promise.resolve(rendering));
  }
}

export default Manager;
