import test from 'ava';

test('foo', t => {
  t.is(true, true);
});

test('bar', async t => {
  const bar = Promise.resolve('bar');
  t.is(await bar, 'bar');
});

test.todo('this must be done');
