var _ = require('lodash');
var config = require('./config');
var JiraApi = require('jira').JiraApi;
var jira = new JiraApi(config.jiraParams.protocol, config.jiraParams.host, config.jiraParams.port, config.jiraParams.user, config.jiraParams.pass, config.jiraParams.version);

function getIssueTypeFromName(issueTypes, name) {
  return _.findWhere(issueTypes, { 'name': name });
}

function getIssuePriorityFromName(issuePriorities, name) {
  return _.findWhere(issuePriorities, { 'name': name });
}

function addNewIssue (issue, project, issuePrefix, cb) {
  var issueData = createJiraIssueData(issue, project, issuePrefix);
  jira.addNewIssue(issueData, function (error, issue) {
    cb(error, issue);
  });
}

function createJiraIssueData(issue, project, issuePrefix) {
  var data = {
    "update": {},
    "fields": {
      "project": {
        "id": project.id
      },
      "summary": issuePrefix + ' - ' + issue.summary,
      "issuetype": {
        "id": issue.type.id
      },
      "assignee": {
        "name": issue.assignee
      },
      "reporter": {
        "name": issue.reporter
      },
      "priority": {
        "id": issue.priority.id
      },
      "labels": issue.labels,
      "description": issue.description
    }
  };
  return data;
};

module.exports = {
  getIssueTypeFromName: getIssueTypeFromName,
  getIssuePriorityFromName: getIssuePriorityFromName,
  addNewIssue: addNewIssue
}
