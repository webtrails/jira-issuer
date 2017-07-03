import test from 'ava';
import greet from '../lib';

test('foo', t => {
  t.is(greet({ firstName: 'john', lastName: 'smith'}), 'hello john, smith');
});

test('bar', async t => {
  const bar = Promise.resolve('bar');
  t.is(await bar, 'bar');
});

test.todo('this must be done');
