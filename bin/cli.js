const program = require('commander');
const inquirer = require('inquirer');

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
      type: 'list',
      name: 'jiraType',
      message: 'Create JIRA issues',
      choices: ['wordpress', 'custom'],
    },
    {
      type: 'comfirm',
      name: 'submit',
      default: 'no',
      message({
        template = options.template,
        host = options.host,
        port = options.port,
        username = options.username,
        jiraType,
      }) {
        const answers = {
          jiraType,
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
    jiraType,
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
    console.log({
      jiraType,
      template,
      host,
      port,
      username,
      password,
      submit,
    });
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
  .parse(process.argv);

processUserInput(program);
