# Jira Issuer
A helper web application to create bulk JIRA issues based on JSON template files.

## Configuration

Use config.js to import your JIRA params and create a file to store your JIRA password:
```bash
echo YOUR_JIRA_PASSWORD > .env
```

Create your JSON project template or modify the file:
```bash
/project-templates/sample.json
```

## Installation
```bash
npm install
```

```bash
npm run [dev|debug|start]
```

## Usage
On runtime you can choose the project key to apply your template on (projectKey) and use an issue prefix for each issue summary. Each issue will be named with {issuePrefix} - {issue.summary}.
```bash
wget -O- "http://localhost:3001?projectKey=TESTPROJECT&issuePrefix=Website"
```
