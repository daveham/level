// import _debug from 'debug';
// const debug = _debug('lvl:abstract-iterator');

function AbstractIterator(db) {
  // debug('ctor', { db });
  if (typeof db !== 'object' || db === null) {
    throw new TypeError('First argument must be an abstract-leveldown compliant store');
  }

  this.db = db;
  this._ended = false;
  this._nexting = false;
}

AbstractIterator.prototype.next = function(callback) {
  // debug('next');
  var self = this;

  if (typeof callback !== 'function') {
    throw new Error('next() requires a callback argument');
  }

  if (self._ended) {
    process.nextTick(callback, new Error('cannot call next() after end()'));
    return self;
  }

  if (self._nexting) {
    process.nextTick(
      callback,
      new Error('cannot call next() before previous next() has completed'),
    );
    return self;
  }

  self._nexting = true;
  self._next(function() {
    self._nexting = false;
    // debug('next:callback', { args: arguments });
    callback.apply(null, arguments);
  });

  return self;
};

AbstractIterator.prototype._next = function(callback) {
  // debug('_next');
  process.nextTick(callback);
};

AbstractIterator.prototype.seek = function(target) {
  // debug('seek');
  if (this._ended) {
    throw new Error('cannot call seek() after end()');
  }
  if (this._nexting) {
    throw new Error('cannot call seek() before next() has completed');
  }

  target = this.db._serializeKey(target);
  this._seek(target);
};

// eslint-disable-next-line no-unused-vars
AbstractIterator.prototype._seek = function(target) {
  // debug('_seek');
};

AbstractIterator.prototype.end = function(callback) {
  // debug('end');
  if (typeof callback !== 'function') {
    throw new Error('end() requires a callback argument');
  }

  if (this._ended) {
    return process.nextTick(callback, new Error('end() already called on iterator'));
  }

  this._ended = true;
  // debug('end:invoking _end');
  this._end(callback);
  // debug('end:after_invoking _end');
};

AbstractIterator.prototype._end = function(callback) {
  // debug('_end');
  process.nextTick(callback);
};

module.exports = AbstractIterator;
