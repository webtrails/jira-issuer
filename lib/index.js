const url = require('url');
const fs = require('fs');
const util = require('util');

const _ = require('lodash');
const axios = require('axios');

const readFile = util.promisify(fs.readFile);

async function getProjectIssueTypeMeta(jiraConfig, projectKey) {
  const { hostname, port, auth } = jiraConfig;
  const uri = url.format({
    protocol: 'https',
    hostname,
    port,
    pathname: '/rest/api/2/issue/createmeta',
    query: {
      projectKeys: projectKey,
      expand: 'projects.issuetypes.fields',
    },
  });

  const response = await axios.get(uri, { auth });

  return response.data.projects[0].issuetypes.reduce(
    (indexByName, issueType) =>
      Object.assign(indexByName, { [issueType.name]: issueType }),
    {}
  );
}

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

async function processNewTemplatedIssue(
  jiraConfig,
  issueTypeMeta,
  epicMap,
  project,
  issueDescription
) {
  const parentIssue = addProjectToIssue(project, issueDescription);

  if (issueDescription.epicId) {
    const issueType = issueDescription.fields.issuetype.name;

    const propMeta = _.find(
      issueTypeMeta[issueType].fields,
      description =>
        description.schema.custom === 'com.pyxis.greenhopper.jira:gh-epic-link'
    );

    parentIssue.fields[propMeta.key] = epicMap.get(issueDescription.epicId);
  }

  const createdIssue = await createIssue(jiraConfig, parentIssue);

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

  if (createdSubTasks.length > 0) {
    return Object.assign({}, issueDescription, createdIssue, {
      subTasks: createdSubTasks,
    });
  }

  return Object.assign({}, issueDescription, createdIssue);
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

  const issueTypeMeta = await getProjectIssueTypeMeta(jiraConfig, project);

  const createdEpics = await Promise.all(
    contents.epics.map(epicDescription => {
      const epicIssue = addProjectToIssue(project, epicDescription);
      const propMeta = _.find(
        issueTypeMeta[epicIssue.fields.issuetype.name].fields,
        description =>
          description.schema.custom ===
          'com.pyxis.greenhopper.jira:gh-epic-label'
      );

      epicIssue.fields[propMeta.key] = epicIssue.fields.epicName;
      delete epicIssue.fields.epicName;

      return createIssue(jiraConfig, epicIssue).then(result =>
        Object.assign({}, epicDescription, result)
      );
    })
  );

  const epicMap = new Map();
  createdEpics.forEach(epic => epicMap.set(epic.refId, epic.key));

  const createdIssues = await Promise.all(
    contents.issues.map(issueDescription =>
      processNewTemplatedIssue(
        jiraConfig,
        issueTypeMeta,
        epicMap,
        project,
        issueDescription
      )
    )
  );

  const issueMap = createdIssues.reduce((map, issue) => {
    map.set(issue.refId, issue.key);

    if (Array.isArray(issue.subTasks)) {
      issue.subTasks.forEach(subTask => map.set(subTask.refId, subTask.key));
    }

    return map;
  }, new Map());

  const createdLinks = await Promise.all(
    contents.links.map(link => {
      const newLink = {
        type: link.type,
        comment: link.comment,
        inwardIssue: { key: issueMap.get(link.inwardIssue) },
        outwardIssue: { key: issueMap.get(link.outwardIssue) },
      };

      return createIssueLink(jiraConfig, newLink).then(() => newLink);
    })
  );

  return {
    epics: createdEpics,
    issues: createdIssues,
    links: createdLinks,
  };
}

module.exports = execute;
