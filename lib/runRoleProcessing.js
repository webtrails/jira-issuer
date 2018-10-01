const _ = require('lodash');

function validateField(prop, roles, issue) {
  const field = _.get(issue, `fields.${prop}`);

  if (field && field.role) {
    const role = roles[field.role];

    if (!role) {
      return {
        refId: issue.refId,
        field: prop,
        role: field.role,
      };
    }
  }

  return null;
}

function validateIssues(roles, issues) {
  return _.reduce(
    issues,
    (errors, issue) => {
      const assigneeError = validateField('assignee', roles, issue);
      if (assigneeError) {
        errors.push(assigneeError);
      }

      const reporterError = validateField('reporter', roles, issue);
      if (reporterError) {
        errors.push(reporterError);
      }

      return errors;
    },
    []
  );
}

function validateRoles(template) {
  const { roles, epics, issues } = template;
  return _.compact([
    ...validateIssues(roles, epics),
    ...validateIssues(roles, issues),
  ]);
}

function replaceRole(prop, roles, issue) {
  const field = _.get(issue, `fields.${prop}`);

  if (field && field.role) {
    return {
      ...issue,
      fields: {
        ...issue.fields,
        [prop]: { name: roles[field.role] },
      },
    };
  }

  return issue;
}

function processIssues(roles, issues) {
  return _.map(issues, issue =>
    replaceRole('reporter', roles, replaceRole('assignee', roles, issue))
  );
}

function processRoles(template) {
  const { roles, epics, issues, ...rest } = template;

  if (_.isEmpty(roles)) {
    return template;
  }

  return {
    roles,
    epics: processIssues(roles, epics),
    issues: processIssues(roles, issues),
    ...rest,
  };
}

function runRoleProcessing(template) {
  const errors = validateRoles(template);

  if (!_.isEmpty(errors)) {
    const err = new Error('Missing roles');
    err.errors = errors;
    throw err;
  }

  return processRoles(template);
}

module.exports = runRoleProcessing;
