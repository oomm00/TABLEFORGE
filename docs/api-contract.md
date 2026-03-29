# API Contract

This document outlines the API contract for the backend system built with Next.js 14 App Router.

## Endpoints

### 1. POST /api/connect

Establishes a connection to a database and returns a session ID along with the initial schema snapshot.

#### Request Body
```json
{
  "host": "string",
  "port": 5432,
  "database": "string",
  "user": "string",
  "password": "string"
}
```

#### Response
```json
{
  "sessionId": "string",
  "schemaSnapshot": {
    "tables": [
      {
        "name": "string",
        "columns": [
          {
            "name": "string",
            "type": "string",
            "constraints": ["PK", "FK", "NN", "U"],
            "fkRef": {
              "table": "string",
              "column": "string"
            }
          }
        ]
      }
    ]
  },
  "schemaStory": "string",
  "anomalies": ["string"]
}
```

### 2. GET /api/schema

Retrieves the current schema snapshot for an active session.

#### Headers
- `x-session-id`: string

#### Response
```json
{
  "schemaSnapshot": {
    "tables": [
      {
        "name": "string",
        "columns": [
          {
            "name": "string",
            "type": "string",
            "constraints": ["PK", "FK", "NN", "U"],
            "fkRef": {
              "table": "string",
              "column": "string"
            }
          }
        ]
      }
    ]
  }
}
```

### 3. POST /api/execute

Executes a SQL query and returns the results.

#### Request Body
```json
{
  "sessionId": "string",
  "sql": "string",
  "embedding": [0.1, 0.2, 0.3],
  "nlIntent": "string",
  "author": "string"
}
```

#### Response
```json
{
  "rows": [],
  "fields": [
    {
      "name": "string",
      "dataTypeID": 23
    }
  ],
  "rowCount": 0
}
```

### 4. POST /api/disconnect

Disconnects an active session.

#### Request Body
```json
{
  "sessionId": "string"
}
```

#### Response
```json
{
  "success": true
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "string"
}
```

## Notes

- Sessions are stored in memory.
- The system uses pgvector for vector operations.
- Schema is automatically refreshed after DDL operations.
- Schema story generation and anomaly detection are handled as fire-and-forget async tasks.