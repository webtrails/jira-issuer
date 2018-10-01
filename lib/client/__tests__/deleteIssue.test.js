const nock = require('nock');
const test = require('ava');

const Client = require('../');

const fixture = require('./fixtures/deleteIssue.json');

test('deleteIssue', async t => {
  const service = nock(fixture.scope)
    .delete(fixture.path)
    .reply(fixture.status, { ...fixture.response });

  const client = new Client({
    hostname: 'test.atlassian.net',
    port: 443,
    auth: { username: 'root', password: 'secret' },
  });

  await client.deleteIssue('TEST-641');

  t.notThrows(
    () => service.done(),
    'JIRA API client did not make the desired HTTP request'
  );
});
