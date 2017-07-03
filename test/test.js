// @flow

import test from 'ava';
import add from '../src';

test('foo', t => {
  t.is(add(2, 2), 4);
});

test('bar', async t => {
  const bar = Promise.resolve('bar');
  t.is(await bar, 'bar');
});

test.skip('this must be done', t => {
  t.fail();
});
