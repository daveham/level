import levelup from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';
import charwise from 'charwise';
import uuid from 'uuid';
import sub from '../down';
import _ from 'highland';

// import _debug from 'debug';
// const debug = _debug('lvl:lib:test');

describe('single db', () => {
  test('open database', () => {
    const db = levelup(encode(memdown()));
    return db.open(() =>
      expect(db.isOpen()).toBe(true));
  });

  test('put and get with default encoding', () => {
    const db = levelup(encode(memdown()));
    const key = 'key';
    const data = 'value';
    return db.put(key, data)
      .then(() => db.get(key))
      .then(data => expect(data).toEqual(data));
  });

  test('range with default encoding', () => {
    const db = levelup(encode(memdown()));
    return db.batch([
      { type: 'put', key: 'key1', value: 1 },
      { type: 'put', key: 'key2', value: 2 },
      { type: 'put', key: 'key3', value: 3 },
      { type: 'put', key: 'key4', value: 4 },
    ]).then(() => _(db.createReadStream({
      gte: 'key2',
      lt: 'key3\xff',
    })).toArray((rows) => {
      expect(rows.some((r) => r.value < 2)).toBe(false);
      expect(rows.some((r) => r.value > 3)).toBe(false);
    }));
  });

  describe('put and get with json', () => {
    test('value encoding', () => {
      const db = levelup(encode(memdown(), { valueEncoding: 'json' }));
      const key = 'key';
      const data = { value: 'value' };
      return db.put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });

    test('key encoding', () => {
      const db = levelup(encode(memdown(), { keyEncoding: 'json' }));
      const key = { key: 'key' };
      const data = 'value';
      return db.put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });

    test('key and value encoding', () => {
      const db = levelup(encode(memdown(), { keyEncoding: 'json', valueEncoding: 'json' }));
      const key = { key: 'key' };
      const data = { value: 'value' };
      return db.put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });
  });

  describe('put and get with charwise', () => {
    test('value encoding', () => {
      const db = levelup(encode(memdown(), { valueEncoding: charwise }));
      const key = 'key';
      const data = ['value'];
      return db.put(key, data)
        .then(() => db.get(key))
        .then(data => expect(data).toEqual(data));
    });

    test('key encoding', () => {
      const db = levelup(encode(memdown(), { keyEncoding: charwise }));
      const key = ['key'];
      const data = { value: 'value' };
      return db.put(key, data)
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
    return dbDown.put(key, data)
      .then(() => dbDown.get(key))
      .then(data => expect(data).toEqual(data));
  });

  describe('put and get with json', () => {
    test('value encoding', () => {
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', { valueEncoding: 'json' });
      const key = 'key';
      const data = { value: 'value' };
      const key2 = 'key2';
      const data2 = { value: 'value2' };
      return dbDown.put(key, data)
        .then(() => dbDown.put(key2, data2))
        .then(() => dbDown.get(key))
        .then(data => expect(data).toEqual(data));
    });

    test('key encoding', () => {
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', { keyEncoding: 'json' });
      const key = { key: 'key' };
      const data = 'value';
      const key2 = { key: 'key2' };
      const data2 = 'value2';
      return dbDown.put(key, data)
        .then(() => dbDown.put(key2, data2))
        .then(() => dbDown.get(key))
        .then(data => expect(data).toEqual(data));
    });
  });

  describe('put and get with charwise', () => {
    test('key encoding', () => {
      const db = levelup(encode(memdown()));
      const dbDown = sub(db, 'one', { keyEncoding: charwise, valueEncoding: 'json' });
      const key = 'key';
      const data = { value: 'value' };
      const key2 = 'key2';
      const data2 = { value: 'value2' };
      const key3 = ['key3'];
      const data3 = { value: 'value3' };
      return dbDown.put(key, data)
        .then(() => dbDown.put(key2, data2))
        .then(() => dbDown.put(key3, data3))
        .then(() => dbDown.get(key))
        .then(d => expect(d).toEqual(data));
    });
  });

  describe('range with charwise', () => {
    test('with string keys and values', () => {
      const db = levelup(encode(memdown()));
      const options = { keyEncoding: charwise, valueEncoding: 'json' };
      const dbDown = sub(db, 'one', options);
      return dbDown.batch([
        { type: 'put', key: 'key1', value: { data: 1 } },
        { type: 'put', key: 'key2', value: { data: 2 } },
        { type: 'put', key: 'key3', value: { data: 3 } },
        { type: 'put', key: 'key4', value: { data: 4 } },
      ]).then(() => _(dbDown.createReadStream({
        ...options,
        gte: 'key2',
        lt: 'key3~',
      })).toArray((rows) => {
        expect(rows.some((r) => r.value.data < 2)).toBe(false);
        expect(rows.some((r) => r.value.data > 3)).toBe(false);
      }));
    });

    test('with array keys and json values', () => {
      const db = levelup(encode(memdown()));
      const options = { keyEncoding: charwise, valueEncoding: 'json' };
      const dbDown = sub(db, 'one', options);
      return dbDown.batch([
        { type: 'put', key: ['key1'], value: { data: 1 } },
        { type: 'put', key: ['key2'], value: { data: 2 } },
        { type: 'put', key: ['key3'], value: { data: 3 } },
        { type: 'put', key: ['key4'], value: { data: 4 } },
      ]).then(() => _(dbDown.createReadStream({
        ...options,
        gte: ['key2'],
        lt: ['key3', '\xff'],
      })).toArray((rows) => {
        expect(rows.some((r) => r.value.data < 2)).toBe(false);
        expect(rows.some((r) => r.value.data > 3)).toBe(false);
      }));
    });

    test('with arrays of uuid keys and json values', () => {
      const db = levelup(encode(memdown()));
      const options = { keyEncoding: charwise, valueEncoding: 'json' };
      const dbDown = sub(db, 'one', options);
      const prefixKey = uuid();
      const targetKey = uuid();
      const keys = [uuid(), uuid(), uuid(), uuid()];

      return dbDown.batch([
        { type: 'put', key: [prefixKey, uuid(), keys[0]], value: { data: 1 } },
        { type: 'put', key: [prefixKey, targetKey, keys[1]], value: { data: 2 } },
        { type: 'put', key: [prefixKey, targetKey, keys[2]], value: { data: 3 } },
        { type: 'put', key: [prefixKey, uuid(), keys[3]], value: { data: 4 } },
      ]).then(() => _(dbDown.createReadStream({
        ...options,
        gte: [prefixKey, targetKey],
        lt: [prefixKey, targetKey, '\xff'],
      })).toArray((rows) => {
        expect(rows.some((r) => r.value.data < 2)).toBe(false);
        expect(rows.some((r) => r.value.data > 3)).toBe(false);
      }));
    });
  });
});
