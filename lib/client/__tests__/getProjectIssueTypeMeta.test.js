const nock = require('nock');
const test = require('ava');

const Client = require('../');

const fixture = require('./fixtures/getProjectIssueTypeMeta.json');

test('getProjectIssueTypeMeta returns no projects', async t => {
  const service = nock('https://test.atlassian.net/rest/api/2')
    .get('/issue/createmeta')
    .query({
      projectKeys: 'TEST',
      expand: 'projects.issuetypes.fields',
    })
    .reply(200, {
      projects: [],
    });

  const client = new Client({
    hostname: 'test.atlassian.net',
    port: 443,
    auth: { username: 'root', password: 'secret' },
  });

  await client.getProjectIssueTypeMeta('TEST');

  t.notThrows(
    () => service.done(),
    'JIRA API client did not make the desired HTTP request'
  );
});

test('getProjectIssueTypeMeta returns meta about issue types', async t => {
  const service = nock(fixture.scope)
    .get(fixture.path)
    .reply(fixture.status, { ...fixture.response });

  const client = new Client({
    hostname: 'test.atlassian.net',
    port: 443,
    auth: { username: 'root', password: 'secret' },
  });

  const issueTypeMeta = await client.getProjectIssueTypeMeta('TEST');

  t.notThrows(
    () => service.done(),
    'JIRA API client did not make the desired HTTP request'
  );

  Object.keys(issueTypeMeta).forEach(key => {
    t.deepEqual(issueTypeMeta[key].name, key);
  });
});
