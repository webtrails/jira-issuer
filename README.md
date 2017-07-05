# Jira Issuer

A command line tool to create bulk JIRA issues based on JSON template files.

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

## Installation

Clone the repository and execute `npm install` to install dependencies

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. The project automates these tasks through npm scripts.

* `npm run lint`: Static analysis and style check of the project code.
* `npm test`: Executes the test suite of the project.
* `npm run coverage`: Executes the test suite of the project and generates test coverage information.
