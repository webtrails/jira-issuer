/* eslint-disable no-console */
const program = require('commander');
const inquirer = require('inquirer');
const execute = require('../lib');

function isStringEmpty(value) {
  return !value || value.length === 0;
}

async function processUserInput(options) {
  const questions = [
    {
      type: 'input',
      name: 'host',
      message: 'JIRE host',
      when: () => isStringEmpty(options.host),
    },
    {
      type: 'input',
      name: 'port',
      message: 'JIRA port',
      validate(input) {
        const parsedInput = parseInt(input, 10);
        return !isNaN(parsedInput) && parsedInput > 0 && parsedInput <= 65535;
      },
      when: () => !options.port,
    },
    {
      type: 'input',
      name: 'project',
      message: 'jira project id',
      when: () => isStringEmpty(options.project),
    },
    {
      type: 'input',
      name: 'username',
      message: 'username',
      when: () => isStringEmpty(options.username),
    },
    {
      type: 'password',
      name: 'password',
      message: 'password',
      when: () => isStringEmpty(options.password),
    },
    {
      type: 'comfirm',
      name: 'submit',
      default: 'no',
      message({
        template = options.template,
        project = options.project,
        host = options.host,
        port = options.port,
        username = options.username,
      }) {
        const answers = {
          project,
          template,
          host,
          port,
          username,
        };

        return [
          'About to create JIRA issues with the parameters (password not shown)',
          JSON.stringify(answers, null, '  '),
          'Is this ok? (yes/no)',
        ].join('\n');
      },
    },
  ];

  const answers = await inquirer.prompt(questions);
  const {
    project = options.project,
    template = options.template,
    host = options.host,
    port = options.port,
    username = options.username,
    password = options.password,
    submit,
  } = answers;

  if (['n', 'N', 'no', 'No', 'nO', 'NO'].includes(submit)) {
    console.log('Aborted!');
  } else {
    try {
      await execute({
        jiraConfig: { hostname: host, port, auth: { username, password } },
        project,
        template,
      });

      console.log(`Finished creating issues for the project ${project}`);
    } catch (error) {
      console.log('Aborted with error');
      console.dir(error, { depth: null, colors: true });
    }
  }
}

program
  .version('1.0.0')
  .option('-u, --username <username>', 'the user to authenticate as')
  .option('-p, --password <password>', "the user's password")
  .option('--host <host>', 'the JIRA host, e.g. company.jira.com')
  .option(
    '--port <port>',
    'the port used to connect to the host, e.g. 443',
    parseInt
  )
  .option(
    '-t, --template <template.json>',
    'the template file in JSON format to be used in JIRA issue generation'
  )
  .option('--project <project_id>', 'the JIRA project id, e.g. TEST')
  .parse(process.argv);

processUserInput(program);
