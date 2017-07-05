const url = require('url');
const axios = require('axios');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

function bulkCreateIssues(jiraConfig, newIssues) {
  const { hostname, port, auth } = jiraConfig;
  const uri = url.format({
    protocol: 'https',
    hostname,
    port,
    pathname: '/rest/api/2/issue/bulk',
  });

  return axios.post(uri, { issueUpdates: newIssues }, { auth });
}

async function execute(options) {
  const { template, project, jiraConfig } = options;

  const contents = await readFile(template);
  let issues = [];

  try {
    issues = JSON.parse(contents);
    issues = issues.map(issue =>
      Object.assign({}, issue, {
        fields: Object.assign({}, issue.fields, { project: { key: project } }),
      })
    );
  } catch (e) {
    return Promise.reject(new Error('Invalid formatted template file'));
  }

  return bulkCreateIssues(jiraConfig, issues);
}

module.exports = execute;
