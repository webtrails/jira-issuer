const url = require('url');
const axios = require('axios');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

async function createIssue(jiraConfig, newIssue) {
  const { hostname, port, auth } = jiraConfig;
  const uri = url.format({
    protocol: 'https',
    hostname,
    port,
    pathname: '/rest/api/2/issue',
  });

  const response = await axios.post(uri, newIssue, { auth });

  const { id, key } = response.data;
  return Object.assign({}, newIssue, { id, key });
}

function addProjectToIssue(project, issueDescription) {
  return Object.assign(
    {},
    {
      fields: Object.assign({}, issueDescription.fields, {
        project: { key: project },
      }),
    }
  );
}

async function processNewTemplatedIssue(jiraConfig, project, issueDescription) {
  const createdIssue = await createIssue(
    jiraConfig,
    addProjectToIssue(project, issueDescription)
  );

  const subTasks = issueDescription.subTasks;

  let createdSubTasks = [];
  if (Array.isArray(subTasks) && subTasks.length > 0) {
    createdSubTasks = await Promise.all(
      subTasks.map(subTask => {
        const newSubIssue = addProjectToIssue(project, subTask);
        newSubIssue.fields.parent = { id: createdIssue.id };

        return createIssue(jiraConfig, newSubIssue);
      })
    );
  }

  return Object.assign({}, issueDescription, createdIssue, {
    subTasks: createdSubTasks,
  });
}

async function execute(options) {
  const { template, project, jiraConfig } = options;

  const blob = await readFile(template);
  let contents = {};

  try {
    contents = JSON.parse(blob);
  } catch (e) {
    console.log(e);
    return Promise.reject(new Error('Invalid formatted template file'));
  }

  const result = await Promise.all(
    contents.issues.map(issue =>
      processNewTemplatedIssue(jiraConfig, project, issue)
    )
  );

  console.dir(result, { depth: null, colors: true });
  return result;
}

module.exports = execute;
