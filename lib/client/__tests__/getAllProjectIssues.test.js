const nock = require('nock');
const test = require('ava');

const Client = require('../');

const fixture = require('./fixtures/getAllProjectIssues.json');

test('getAllProjectIssues returns no projects', async t => {
  const service = nock(fixture.scope)
    .get(fixture.path)
    .reply(fixture.status, { ...fixture.response });

  const client = new Client({
    hostname: 'test.atlassian.net',
    port: 443,
    auth: { username: 'root', password: 'secret' },
  });

  const issues = await client.getAllProjectIssues('TEST');

  t.notThrows(
    () => service.done(),
    'JIRA API client did not make the desired HTTP request'
  );

  t.deepEqual(issues, ['TEST-643', 'TEST-642']);
});
