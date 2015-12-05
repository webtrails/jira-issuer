var _ = require('lodash');

var config = {
  default: {
    language: 'en',
    jiraParams: {
      protocol: 'https',
      host: 'company.atlassian.net',
      port: 443,
      user: 'company_user',
      pass: process.env.JIRA_PASSWORD,
      version: '2'
    }
  },
  local: {
    mode: 'local',
    port: 3001,
    memcached_host: '127.0.0.1:11211',
    deployType:'development'
  },
  staging: {
    mode: 'staging',
    port: 3001,
    language: 'en',
    memcached_host: "127.0.0.1:11211",
    deployType:'staging'
  },
  production: {
    mode: 'production',
    port: 3001,
    language: 'en',
    memcached_host: "127.0.0.1:11211",
    deployType:'production'
  }
}

module.exports = function(mode) {
    console.log("CONFIG MODE:", mode || process.env.NODE_ENV || 'local');
    return _.extend(config[mode || process.env.NODE_ENV || 'local'], config.default);
}();
