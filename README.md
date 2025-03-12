# Agent Task Manager

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

## API Documentation

*   `/issues` - GET: list issues, POST: create an issue
*   `/issues/{issueKey}` - GET: get issue by key, PUT: update issue by key, DELETE: delete issue by key
*   `/issues/{issueKey}/transitions` - GET: list available transitions for an issue
*   `/issues/{issueKey}/transitions` - POST: perform a transition on an issue
*   `/webhooks` - POST: receive webhook events

More detailed documentation to follow.
