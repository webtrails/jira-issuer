const test = require('ava');
const runRoleProcessing = require('./runRoleProcessing');

// Validating roles ------------------------------------------------------------
[
  { type: 'epics', field: 'reporter' },
  { type: 'epics', field: 'assignee' },
  { type: 'issues', field: 'reporter' },
  { type: 'issues', field: 'assignee' },
].forEach(({ field, type }) => {
  test(`will throw an error if a ${field} role is not declared in ${type}`, t => {
    const template = {
      roles: { 'other-role': 'user-1' },
      [type]: [{ refId: 'id', fields: { [field]: { role: 'role-1' } } }],
    };

    const error = t.throws(() => {
      runRoleProcessing(template);
    }, Error);

    t.is(error.message, 'Missing roles');
    t.deepEqual(error.errors, [
      {
        refId: 'id',
        field,
        role: 'role-1',
      },
    ]);
  });
});

test('will throw an error roles are missing (example)', t => {
  const template = {
    roles: { 'role-1': 'user-1' },
    epics: [{ refId: 'id-1', fields: { assignee: { role: 'unknown-1' } } }],
    issues: [
      {
        refId: 'id-2',
        fields: {
          assignee: { role: 'role-1' },
          reporter: { role: 'unknown-2' },
        },
      },
      {
        refId: 'id-3',
        fields: {
          assignee: { name: 'user-1' },
          reporter: { name: 'user-2' },
        },
      },
    ],
  };

  const error = t.throws(() => {
    runRoleProcessing(template);
  }, Error);

  t.is(error.message, 'Missing roles');
  t.deepEqual(error.errors, [
    { refId: 'id-1', field: 'assignee', role: 'unknown-1' },
    { refId: 'id-2', field: 'reporter', role: 'unknown-2' },
  ]);
});

// Replacing valid roles  ------------------------------------------------------
test('will return initial input if no roles are present', t => {
  const template = { epics: [], issues: [], links: [] };

  const actual = runRoleProcessing(template);

  t.deepEqual(actual, { epics: [], issues: [], links: [] });
});

[
  { type: 'epics', field: 'reporter' },
  { type: 'epics', field: 'assignee' },
  { type: 'issues', field: 'reporter' },
  { type: 'issues', field: 'assignee' },
].forEach(({ field, type }) => {
  test(`will replace ${field} with the role in the ${type}`, t => {
    const template = {
      roles: { 'role-1': 'user-1' },
      [type]: [{ fields: { [field]: { role: 'role-1' } } }],
    };

    const actual = runRoleProcessing(template);

    t.deepEqual(actual[type], [{ fields: { [field]: { name: 'user-1' } } }]);
  });
});

[
  { type: 'epics', field: 'reporter' },
  { type: 'epics', field: 'assignee' },
  { type: 'issues', field: 'reporter' },
  { type: 'issues', field: 'assignee' },
].forEach(({ field, type }) => {
  test(`will ignore name if role is present in ${field} in ${type}`, t => {
    const template = {
      roles: { 'role-1': 'user-1' },
      [type]: [{ fields: { [field]: { role: 'role-1', name: 'username' } } }],
    };

    const actual = runRoleProcessing(template);

    t.deepEqual(actual[type], [{ fields: { [field]: { name: 'user-1' } } }]);
  });
});

test('will replace all roles (example)', t => {
  const template = {
    roles: {
      'role-111': 'user-111',
      'role-222': 'user-222',
      'role-333': 'user-333',
    },
    epics: [{ refId: 'id-1', fields: { assignee: { role: 'role-111' } } }],
    issues: [
      {
        refId: 'id-2',
        fields: {
          assignee: { role: 'role-222' },
          reporter: { role: 'role-333' },
        },
      },
      {
        refId: 'id-3',
        fields: {
          assignee: { name: 'user-1' },
          reporter: { name: 'user-2' },
        },
      },
    ],
  };

  const actual = runRoleProcessing(template);

  t.deepEqual(actual.epics, [
    { refId: 'id-1', fields: { assignee: { name: 'user-111' } } },
  ]);

  t.deepEqual(actual.issues, [
    {
      refId: 'id-2',
      fields: {
        assignee: { name: 'user-222' },
        reporter: { name: 'user-333' },
      },
    },
    {
      refId: 'id-3',
      fields: {
        assignee: { name: 'user-1' },
        reporter: { name: 'user-2' },
      },
    },
  ]);
});
