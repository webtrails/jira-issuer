const fs = require('fs');
const util = require('util');
const _ = require('lodash');

const Client = require('./client');

const readFile = util.promisify(fs.readFile);

function addRefIdAsLabel(issueDescription) {
  return Object.assign(
    {},
    {
      fields: Object.assign({}, issueDescription.fields, {
        labels: _.compact([
          issueDescription.refId,
          ..._.get(issueDescription, 'fields.labels', []),
        ]),
      }),
    }
  );
}

function addProjectToIssue(project, issueDescription) {
  return Object.assign(
    {},
    {
      fields: Object.assign({}, issueDescription.fields, {
        project: { key: project },
        labels: _.compact([
          issueDescription.refId,
          ..._.get(issueDescription, 'fields.labels', []),
        ]),
      }),
    }
  );
}

const enhanceIssue = _.flow([addProjectToIssue, addRefIdAsLabel]);

async function processNewTemplatedIssue(
  client,
  issueTypeMeta,
  epicMap,
  project,
  issueDescription
) {
  const parentIssue = enhanceIssue(project, issueDescription);

  if (issueDescription.epicId) {
    const issueType = issueDescription.fields.issuetype.name;

    const propMeta = _.find(
      issueTypeMeta[issueType].fields,
      description =>
        description.schema.custom === 'com.pyxis.greenhopper.jira:gh-epic-link'
    );

    parentIssue.fields[propMeta.key] = epicMap.get(issueDescription.epicId);
  }

  const createdIssue = await client.createIssue(parentIssue);

  const subTasks = issueDescription.subTasks;

  let createdSubTasks = [];
  if (Array.isArray(subTasks) && subTasks.length > 0) {
    createdSubTasks = await Promise.all(
      subTasks.map(subTask => {
        const newSubIssue = enhanceIssue(project, subTask);
        newSubIssue.fields.parent = { id: createdIssue.id };

        return client
          .createIssue(newSubIssue)
          .then(createdSubTask => Object.assign({}, subTask, createdSubTask));
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

  const client = new Client(jiraConfig);

  const issueTypeMeta = await client.getProjectIssueTypeMeta(project);

  const createdEpics = await Promise.all(
    contents.epics.map(epicDescription => {
      const epicIssue = enhanceIssue(project, epicDescription);
      const propMeta = _.find(
        issueTypeMeta[epicIssue.fields.issuetype.name].fields,
        description =>
          description.schema.custom ===
          'com.pyxis.greenhopper.jira:gh-epic-label'
      );

      epicIssue.fields[propMeta.key] = epicIssue.fields.epicName;
      delete epicIssue.fields.epicName;

      return client
        .createIssue(epicIssue)
        .then(result => Object.assign({}, epicDescription, result));
    })
  );

  const epicMap = new Map();
  createdEpics.forEach(epic => epicMap.set(epic.refId, epic.key));

  const createdIssues = await Promise.all(
    contents.issues.map(issueDescription =>
      processNewTemplatedIssue(
        client,
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

      return client.createIssueLink(newLink).then(() => newLink);
    })
  );

  return {
    epics: createdEpics,
    issues: createdIssues,
    links: createdLinks,
  };
}

module.exports = execute;
