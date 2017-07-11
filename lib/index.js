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

function createIssueLink(jiraConfig, newLink) {
  const { hostname, port, auth } = jiraConfig;
  const uri = url.format({
    protocol: 'https',
    hostname,
    port,
    pathname: '/rest/api/2/issueLink',
  });

  return axios.post(uri, newLink, { auth });
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

        return createIssue(jiraConfig, newSubIssue).then(createdSubTask =>
          Object.assign({}, subTask, createdSubTask)
        );
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
    return Promise.reject(new Error('Invalid formatted template file'));
  }

  const result = await Promise.all(
    contents.issues.map(issue =>
      processNewTemplatedIssue(jiraConfig, project, issue)
    )
  );

  /* eslint-disable no-param-reassign */
  const issuesByRefId = result.reduce((index, issue) => {
    index[issue.refId] = issue.key;
    issue.subTasks.forEach(subTask => (index[subTask.refId] = subTask.key));
    return index;
  }, {});
  /* eslint-enable no-param-reassign */

  await Promise.all(
    contents.links.map(link => {
      const newLink = {
        type: link.type,
        comment: link.comment,
        inwardIssue: { key: issuesByRefId[link.inwardIssue] },
        outwardIssue: { key: issuesByRefId[link.outwardIssue] },
      };

      return createIssueLink(jiraConfig, newLink);
    })
  );

  return result;
}

module.exports = execute;
