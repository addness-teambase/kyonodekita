# Claude Instructions

This file contains instructions and context for Claude to better understand and work with this codebase.

## Project Overview

This is a monorepo containing applications for tracking daily achievements ("kyou no dekita" - today's accomplishments):

- `parent-app/`: Parent application for tracking children's daily achievements
- `admin-app/`: Admin application for teachers/administrators

## Project Structure

The project uses a monorepo structure with separate applications that may share common dependencies and configurations.

## Development Commands

When working on this project, use these commands for linting and type checking:

```bash
# Add your lint/typecheck commands here
# Example:
# npm run lint
# npm run typecheck
```

## Technology Stack

- Frontend: React/Next.js (inferred from package.json structure)
- Database: Supabase (evident from supabase.ts files)
- Package Manager: npm (package-lock.json present)

## Git Workflow

- Main branch: `main`
- Current working on chat functionality and UI/UX improvements

## Notes for Claude

- Always run lint and typecheck commands before completing tasks
- This is a Japanese application focused on daily achievement tracking
- Recent work includes chat functionality and monorepo separation
- Be mindful of the parent-child relationship context in the application