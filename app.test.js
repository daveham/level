import levelup from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';
import charwise from 'charwise';
import uuid from 'uuid';
import sub from './down';
import { readAll } from './lib/utils';
import _debug from 'debug';
const debug = _debug('lvl:app:test');

describe('single db', () => {
  test('open database', () => {
    const db = levelup(encode(memdown()));
    return db.open(() => {
      expect(db.isOpen()).toBe(true);
    });
  });

  test('put and get with default encoding', () => {
    const db = levelup(encode(memdown()));
    const key = 'key';
    const data = 'value';
    return db
      .put(key, data)
      .then(() => db.get(key))
      .then(data => expect(data).toEqual(data));
  });

  test('range with default encoding', () => {
    const db = levelup(encode(memdown()));
    const lowerLimit = 'key2';
    const upperLimit = 'key3~';
    const streamOptions = {
      gte: lowerLimit,
      lt: upperLimit,
    };
    return db
      .put('key1', 'value1')
      .then(() => db.put('key2', 'value2'))
      .then(() => db.put('key3', 'value3'))
      .then(() => db.put('key4', 'value4'))
      .then(
        () =>
          new Promise(resolve => {
            let index = 0;
            db.createReadStream(streamOptions)
              .on('data', d => {
                debug('stream item', { index: index++, ...d });
                expect(d.value === 'value2' || d.value === 'value3').toBe(true);
              })
              .on('close', () => {
                debug('stream closed');
                resolve();
              });
          }),
      );
  });

  describe('put and get with json', () => {
    test('value encoding', () => {
      const options = { valueEncoding: 'json' };
      const db = levelup(encode(memdown(), options));
      const key = 'key';
      const data = { value: 'value' };
      return db
        .put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });

    test('key encoding', () => {
      const options = { keyEncoding: 'json' };
      const db = levelup(encode(memdown(), options));
      const key = { key: 'key' };
      const data = 'value';
      return db
        .put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });

    test('key and value encoding', () => {
      const options = { keyEncoding: 'json', valueEncoding: 'json' };
      const db = levelup(encode(memdown(), options));
      const key = { key: 'key' };
      const data = { value: 'value' };
      return db
        .put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });
  });

  describe('put and get with charwise', () => {
    test('value encoding', () => {
      const options = { valueEncoding: charwise };
      const db = levelup(encode(memdown(), options));
      const key = 'key';
      const data = ['value'];
      return db
        .put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });

    test('key encoding', () => {
      const options = { keyEncoding: charwise };
      const db = levelup(encode(memdown(), options));
      const key = ['key'];
      const data = { value: 'value' };
      return db
        .put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });
  });
});

describe('one down db', () => {
  test('open database', () => {
    const db = levelup(encode(memdown()));
    const dbDown = sub(db, 'one');
    return dbDown.open(() => {
      expect(dbDown.isOpen()).toEqual(true);
    });
  });

  test('put and get with default encoding', () => {
    const db = levelup(encode(memdown()));
    const dbDown = sub(db, 'one');
    const key = 'key';
    const data = 'value';
    return dbDown
      .put(key, data)
      .then(() => readAll(dbDown))
      .then(() => dbDown.get(key))
      .then(data => expect(data).toEqual(data));
  });

  describe('put and get with json', () => {
    test('value encoding', () => {
      const options = { valueEncoding: 'json' };
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', options);
      const key = 'key';
      const data = { value: 'value' };
      const key2 = 'key2';
      const data2 = { value: 'value2' };
      return dbDown
        .put(key, data)
        .then(() => dbDown.put(key2, data2))
        .then(() => readAll(db))
        .then(() => readAll(dbDown, options))
        .then(() => dbDown.get(key))
        .then(data => expect(data).toEqual(data));
    });

    test('key encoding', () => {
      const options = { keyEncoding: 'json' };
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', options);
      const key = { key: 'key' };
      const data = 'value';
      const key2 = { key: 'key2' };
      const data2 = 'value2';
      return dbDown
        .put(key, data)
        .then(() => dbDown.put(key2, data2))
        .then(() => readAll(db))
        .then(() => readAll(dbDown, options))
        .then(() => dbDown.get(key))
        .then(data => expect(data).toEqual(data));
    });
  });

  describe('put and get with charwise', () => {
    test('key encoding', () => {
      const options = { keyEncoding: charwise, valueEncoding: 'json' };
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', options);
      const key = 'key';
      const data = { value: 'value' };
      const key2 = 'key2';
      const data2 = { value: 'value2' };
      const key3 = ['key3'];
      const data3 = { value: 'value3' };
      return dbDown
        .put(key, data)
        .then(() => dbDown.put(key2, data2))
        .then(() => dbDown.put(key3, data3))
        .then(() => readAll(db))
        .then(() => readAll(dbDown, options))
        .then(() => dbDown.get(key))
        .then(data => expect(data).toEqual(data));
    });
  });

  describe('range with charwise', () => {
    test('with string keys and values', () => {
      const options = { keyEncoding: charwise, valueEncoding: 'json' };
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', options);
      const lowerLimit = 'key2';
      const upperLimit = 'key3~';
      const streamOptions = {
        ...options,
        gte: lowerLimit,
        lt: upperLimit,
      };
      return dbDown
        .put('key1', { data: 'value1' })
        .then(() => dbDown.put('key2', { data: 'value2' }))
        .then(() => dbDown.put('key3', { data: 'value3' }))
        .then(() => dbDown.put('key4', { data: 'value4' }))
        // .then(() => readAll(db))
        // .then(() => readAll(dbDown, options))
        .then(
          () =>
            new Promise(resolve => {
              let index = 0;
              dbDown.createReadStream(streamOptions)
                .on('data', d => {
                  debug('stream item', { index: index++, ...d });
                  expect(d.value.data === 'value2' || d.value.data === 'value3').toBe(true);
                })
                .on('close', () => {
                  debug('stream closed');
                  resolve();
                });
            }),
        );
    });

    test('with array keys and json values', () => {
      const options = { keyEncoding: charwise, valueEncoding: 'json' };
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', options);
      const lowerLimit = ['key2'];
      const upperLimit = ['key3', 0xff];
      const streamOptions = {
        gte: lowerLimit,
        lt: upperLimit,
      };
      return dbDown
        .put(['key1'], { data: 'value1' })
        .then(() => dbDown.put(['key2'], { data: 'value2' }))
        .then(() => dbDown.put(['key3'], { data: 'value3' }))
        .then(() => dbDown.put(['key4'], { data: 'value4' }))
        // .then(() => readAll(db))
        // .then(() => readAll(dbDown, options))
        .then(
          () =>
            new Promise(resolve => {
              let index = 0;
              let count = 0;
              dbDown.createReadStream(streamOptions)
                .on('data', d => {
                  debug('stream item', { index: index++, ...d });
                  count++;
                  expect(d.value.data === 'value2' || d.value.data === 'value3').toBe(true);
                })
                .on('close', () => {
                  debug('stream closed');
                  expect(count).toBe(2);
                  resolve();
                });
            }),
        );
    });

    test('with arrays of uuid keys and json values', () => {
      const options = { keyEncoding: charwise, valueEncoding: 'json' };
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', options);
      const prefixKey = uuid();
      const targetKey = uuid();
      const keys = [uuid(), uuid(), uuid(), uuid()];
      const lowerLimit = [prefixKey, targetKey];
      const upperLimit = [prefixKey, targetKey, '\x99'];
      const streamOptions = {
        gte: lowerLimit,
        lt: upperLimit,
      };
      return dbDown
        .put([prefixKey, uuid(), keys[0]], { data: 'value1' })
        .then(() => dbDown.put([prefixKey, targetKey, keys[1]], { data: 'value2' }))
        .then(() => dbDown.put([prefixKey, targetKey, keys[2]], { data: 'value3' }))
        .then(() => dbDown.put([prefixKey, uuid(), keys[3]], { data: 'value4' }))
        // .then(() => readAll(db))
        // .then(() => readAll(dbDown, options))
        .then(
          () =>
            new Promise(resolve => {
              let index = 0;
              let count = 0;
              dbDown.createReadStream(streamOptions)
                .on('data', d => {
                  debug('stream item', { index: index++, ...d });
                  count++;
                  expect(d.value.data === 'value2' || d.value.data === 'value3').toBe(true);
                })
                .on('close', () => {
                  debug('stream closed');
                  expect(count).toBe(2);
                  resolve();
                });
            }),
        );
    });
  });
});
