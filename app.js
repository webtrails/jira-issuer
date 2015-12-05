'use strict'

require('node-jsx').install(); // make `.jsx` file requirable by node
var express = require('express');
var session = require('express-session');
var engine = require('react-engine');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');
var fs = require('fs');
var config = require('./config');
var utils = require('./utils.js');
var JiraApi = require('jira').JiraApi;
var jira = new JiraApi(config.jiraParams.protocol, config.jiraParams.host, config.jiraParams.port, config.jiraParams.user, config.jiraParams.pass, config.jiraParams.version);

var app = express();

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'WhatTheHack',
    key: 'sessionId',
    cookie: {maxAge:2592000}, // a month
    expires: new Date(Date.now() + 2592000), // a month
    // store: new MemcachedStore({
    //     hosts:[config.memcached_host]
    // }, {maxExpiration:2592000})
}));

var engineOptions = {
  // optional if not using react-router
  // reactRoutes: 'PATH_TO_REACT_ROUTER_ROUTE_DECLARATION'
};

// set `react-engine` as the view engine
app.engine('.jsx', engine.server.create(engineOptions));

// set the view directory
app.set('views', __dirname + '/public/views');

// set js as the view engine
app.set('view engine', 'jsx');

// finally, set the custom react-engine view for express
app.set('view', engine.expressView);

//expose public folder as static assets
app.use(express.static(__dirname + '/public'));

// Get JIRA project and issue prefix from params
app.use(function(req, res, next){
  var projectKey = req.query.projectKey;
  var issuePrefix = req.query.issuePrefix;
  if (projectKey && issuePrefix) {
    jira.getProject(projectKey, function (error, project) {
      if (error) {
        console.log(error);
        res.status(400).end();
      } else {
        req.session.jira = {
          project: project,
          issuePrefix: issuePrefix
        };
        next();
      }
    });
  } else {
    console.log('Missing project key or issue prefix.');
    res.status(400).end();
  }
});

// Get JIRA issue types
app.use(function(req, res, next){
  jira.listIssueTypes(function (error, issueTypes) {
    if (error) {
      console.log(error);
      res.status(400).end();
    } else {
      req.session.jira.issueTypes = issueTypes;
      next();
    }
  });
});

// Get JIRA issue priorities
app.use(function(req, res, next){
  jira.listPriorities(function (error, issuePriorities) {
    if (error) {
      console.log(error);
      res.status(400).end();
    } else {
      req.session.jira.issuePriorities = issuePriorities;
      next();
    }
  });
});

app.get('/', function (req, res, next) {

  var filename = __dirname + '/project-templates/sample.json';
  var issues = fs.readFileSync(filename, 'utf8');
  if (!_.isString(issues)) {
    console.log(filename, 'file not found');
    res.status(404).end();
  }

  try {
    issues = JSON.parse(issues);
  } catch (e) {
    console.log('Wrong JSON format');
    res.status(400).end();
  }

  async.each(issues, function (issue, callback) {
    issue.type = utils.getIssueTypeFromName(req.session.jira.issueTypes, issue.type);
    issue.priority = utils.getIssuePriorityFromName(req.session.jira.issuePriorities, issue.priority);
    utils.addNewIssue (issue, req.session.jira.project, req.session.jira.issuePrefix, function (error, issue){
      callback(error, issue);
    });
  }, function (error) {
    if (error) {
      console.log('Error while parsing issue data');
      res.status(400).end();
    } else {
      console.log('Successful processing');
      res.status(200).send('Success');
    }
  });

  // res.render('index', {
  //   title: 'JIRA Issuer'
  // });
});

var server = app.listen(process.env.PORT || config.port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('React starter app listening at http://%s:%s', host, port);
}).on("error", function(err){
    console.log("Error trying to claim port " + config.port);
    console.log(err);
});
