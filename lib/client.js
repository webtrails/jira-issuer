const url = require('url');
const axios = require('axios');

const API_PREFIX = '/rest/api/2';
const PATH = Object.freeze({
  ISSUE: `${API_PREFIX}/issue`,
  ISSUE_CREATEMETA: `${API_PREFIX}/issue/createmeta`,
  ISSUE_LINK: `${API_PREFIX}/issueLink`,
  SEARCH: `${API_PREFIX}/search`,
});

function guard(config) {
  if (!config.hostname) {
    throw new Error('Cannot create JIRA client without a hostname');
  }

  if (!config.port) {
    throw new Error('Cannot create JIRA client without a port');
  }

  if (!config.auth || !config.auth.username || !config.auth.password) {
    throw new Error('Cannot create JIRA client without auth credentials');
  }
}

class Client {
  constructor(config) {
    guard(config);

    this.protocol = config.protocol || 'https';
    this.hostname = config.hostname;
    this.port = config.port;
    this.auth = config.auth;
  }

  formatURI({ pathname, query }) {
    return url.format({
      protocol: this.protocol,
      hostname: this.hostname,
      port: this.port,
      pathname,
      query,
    });
  }

  getProjectIssueTypeMeta(projectKey) {
    const uri = this.formatURI({
      pathname: PATH.ISSUE_CREATEMETA,
      query: {
        projectKeys: projectKey,
        expand: 'projects.issuetypes.fields',
      },
    });

    return axios
      .get(uri, { auth: this.auth })
      .then(response =>
        response.data.projects[0].issuetypes.reduce(
          (indexByName, issueType) =>
            Object.assign(indexByName, { [issueType.name]: issueType }),
          {}
        )
      );
  }

  createIssue(newIssue) {
    const uri = this.formatURI({
      pathname: PATH.ISSUE,
    });

    return axios.post(uri, newIssue, { auth: this.auth }).then(response => {
      const { id, key } = response.data;
      return Object.assign({}, newIssue, { id, key });
    });
  }

  createIssueLink(newLink) {
    const uri = this.formatURI({
      pathname: PATH.ISSUE_LINK,
    });

    return axios.post(uri, newLink, { auth: this.auth });
  }

  deleteIssue(issueId) {
    const uri = this.formatURI({
      pathname: `${PATH.ISSUE}/${issueId}`,
      query: { deleteSubtasks: true },
    });

    return axios.delete(uri, { auth: this.auth });
  }

  getAllProjectIssues(projectId) {
    const uri = this.formatURI({
      pathname: PATH.SEARCH,
      query: {
        jql: `project="${projectId}"`,
        fields: 'key',
      },
    });

    return axios
      .get(uri, { auth: this.auth })
      .then(response => response.data.issues.map(issue => issue.key));
  }
}

module.exports = Client;
