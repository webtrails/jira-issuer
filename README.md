# JIRA Issuer

A command line tool to create bulk JIRA issues based on JSON template files. It also supports epics, subtasks and links between the issues.

## Use cases

1. Does your company provide a solution or a service - a package - which requires a team of professionals in order to be prepared and implemented? For example "ERP system migration to newer servers". The price is fixed, the steps are well defined and you have to do the process for all your clients once a year. Jira-issuer provides a way to create the necessary tickets just by running a simple command on a predefined JSON template file. It's the fastest way to convert a new sale/contract/need/feature/package into action items for your team.
2. In case you need to follow the same process periodically you can simply add the command in a cron job and new tickets will be created, linked and assigned to your team in time.

## Usage

The tool accepts the following arguments which are all mandatory:

```text
  -V, --version                   output the version number
  -u, --username <username>       the user to authenticate as
  -p, --password <password>       the user's password
  --host <host>                   the JIRA host, e.g. company.jira.com
  --port <port>                   the port used to connect to the host, e.g. 443
  -t, --template <template.json>  the template file in JSON format to be used in JIRA issue generation
  --project <project_id>          the JIRA project id, e.g. TEST
  -h, --help                      output usage information
```

For example:

```bash
node bin/cli.js --host company.atlassian.net \
                --port 443 \
                -u user \
                -p secret \
                --project FANTASTICPROJECT \
                -t /path/to/template
```

## Creating a template

A JSON file that will as project template must be created. You can see an example in the folder `/project-templates`. The template consists of three parts, `epics`, `issues` and `links`.

The property `issues` holds an array of issues to be created. Each element of the array has the following properties:
* `refId`: This is a **unique** id given by you.
* `epicId` (optional): This holds as a value the `refId` of the epic that this issue belongs to.
* `fields`: Contains all the issue properties that are enabled in the JIRA platform. This follows the structure found in the atlassian documentation about [issue creation](https://docs.atlassian.com/jira/REST/7.4.0/#api/2/issue-createIssue).
* `subTasks`: This is an array containing issues with the `fields` and `refId` properties as described above. The issue described in the `fields`, sibling to `subTasks`, is the parent issue. It is an error if that issue is not of type *Task*.

The property `epics` holds and array of epic issues and each one has the following properties:
* `refId`: This is a **unique** id given by you.
* `fields`: Contains all the issue properties that are enabled in the JIRA platform. This follows the structure found in the atlassian documentation about [issue creation](https://docs.atlassian.com/jira/REST/7.4.0/#api/2/issue-createIssue).

The property `links` holds an array. The structure follows that found in the documentation about [link creation](https://docs.atlassian.com/jira/REST/7.4.0/#api/2/issueLink-linkIssues). The only difference is in the properties `inwardIssue` and `outwardIssue`. Since the JIRA issue keys are not known prior creation, the `refId` will be used.

## Installation

Clone the repository and execute `npm install` to install dependencies

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. The project automates these tasks through npm scripts.

* `npm run lint`: Static analysis and style check of the project code.
* `npm test`: Executes the test suite of the project.
* `npm run coverage`: Executes the test suite of the project and generates test coverage information.
