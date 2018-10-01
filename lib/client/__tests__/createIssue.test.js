const nock = require('nock');
const test = require('ava');

const Client = require('../');

const fixture = require('./fixtures/createIssue.json');

test('createIssue', async t => {
  const service = nock(fixture.scope)
    .post(fixture.path, { ...fixture.body })
    .reply(fixture.status, { ...fixture.response });

  const client = new Client({
    hostname: 'test.atlassian.net',
    port: 443,
    auth: { username: 'root', password: 'secret' },
  });

  const response = await client.createIssue({ ...fixture.body });

  t.notThrows(
    () => service.done(),
    'JIRA API client did not make the desired HTTP request'
  );

  t.deepEqual(response.id, '42875');
  t.deepEqual(response.key, 'TEST-641');
});
