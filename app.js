const levelup = require('levelup');
const leveldown = require('leveldown');
const sub = require('subleveldown');

const db = levelup(leveldown('./mydb'));

const sliceOne = sub(db, 'sliceOne');
const sliceOneNestOne = sub(sliceOne, 'nestOne');

const sliceTwo = sub(db, 'sliceTwo');
const sliceTwoNestTwo = sub(sliceTwo, 'nextTwo');

db.put('root', 'rootValue')
  .then(() => sliceOneNestOne.put('sliceOne', 'sliceOneValue'))
  .then(() => sliceTwoNestTwo.put('sliceTwo', 'sliceTwoValue'))
  .then(() => sliceOneNestOne.get('sliceOne'))
  .then((value) => console.log('sliceOne: ' + value))
  .then(() => sliceTwoNestTwo.get('sliceTwo'))
  .then((value) => console.log('sliceTwo: ' + value))
  .then(() => console.log('finished'));
