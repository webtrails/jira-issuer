# Jira Issuer
A helper web application to create bulk JIRA issues based on JSON template files.

## Configuration

Use config.js to import your JIRA params and create a file to store your JIRA password:
```bash
echo YOUR_JIRA_PASSWORD > .env
```

## Installation
```bash
npm install
```

```bash
npm run [dev|debug|start]
```

## Usage
```bash
wget -O- "http://localhost:3001?projectKey=TESTPROJECT&issuePrefix=Website"
```
