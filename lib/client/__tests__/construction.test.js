const test = require('ava');

const Client = require('../');

test('will not construct if no hostname is given', t => {
  t.throws(
    () =>
      new Client({ port: 443, auth: { username: 'root', password: 'secret' } }),
    /hostname/
  );
});

test('will not construct if no port is given', t => {
  t.throws(
    () =>
      new Client({
        hostname: 'test.atlassian.net',
        auth: { username: 'root', password: 'secret' },
      }),
    /port/
  );
});

test('will not construct if no auth is given', t => {
  t.throws(
    () =>
      new Client({
        hostname: 'test.atlassian.net',
        port: 443,
      }),
    /credentials/
  );
});

test('will not construct if no auth.username is given', t => {
  t.throws(
    () =>
      new Client({
        hostname: 'test.atlassian.net',
        port: 443,
        auth: { password: 'secret' },
      }),
    /credentials/
  );
});

test('will not construct if no auth.password is given', t => {
  t.throws(
    () =>
      new Client({
        hostname: 'test.atlassian.net',
        port: 443,
        auth: { username: 'root' },
      }),
    /credentials/
  );
});

test('will construct the client if everything is provided', t => {
  t.notThrows(
    () =>
      new Client({
        hostname: 'test.atlassian.net',
        port: 443,
        auth: { username: 'root', password: 'secret' },
      })
  );
});
