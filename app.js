const levelup = require('levelup');
const leveldown = require('leveldown');
const sub = require('subleveldown');

const db = levelup(leveldown('./mydb'));

const sliceOne = sub(db, 'sliceOne');
const sliceOneNestOne = sub(sliceOne, 'nestOne', {  valueEncoding: 'json' });

const sliceTwo = sub(db, 'sliceTwo');
const sliceTwoNestTwo = sub(sliceTwo, 'nextTwo', {  valueEncoding: 'json' });

db.put('root', 'rootValue')
  .then(() => sliceOneNestOne.put('sliceOne', { label: 'one', data: { raw: 1, text: 'one' } }))
  .then(() => sliceTwoNestTwo.put('sliceTwo', { label: 'two', data: { raw: 2, text: 'two' } }))
  .then(() => sliceOneNestOne.get('sliceOne'))
  .then((value) => console.log('sliceOne: ' + JSON.stringify(value)))
  .then(() => sliceTwoNestTwo.get('sliceTwo'))
  .then((value) => console.log('sliceTwo: ' + JSON.stringify(value)))
  .then(() => console.log('finished'));
