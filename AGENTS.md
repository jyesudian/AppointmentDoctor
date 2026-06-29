<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AppointmentDoctor Agent Instructions

## Repository Rules

This repository contains generated artifacts that must not be analyzed unless explicitly requested.

Ignore the following paths:

* node_modules/
* .next/
* coverage/
* scratch/screenshots/
* logs/
* build/
* dist/

These folders contain generated files and are not part of the application business logic.

## Primary Source Locations

Focus analysis on:

* src/
* migrations/
* public/
* package.json
* package-lock.json
* next.config.ts
* schema.sql

## Code Review Rules

When reviewing or modifying code:

* Read only the files required for the current task.
* Do not scan the entire repository unless explicitly requested.
* Prefer targeted analysis of affected modules.
* For Next.js questions, consult the latest Next.js documentation before suggesting framework-specific changes.

## Performance Rules

Avoid loading large generated folders into context.

Limit context gathering to files directly related to the user request.
