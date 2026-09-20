# Restricted Local Test Data

## Source

- JAMA role-model STEP files:
	- https://www.jama.or.jp/operation/it/dg_egr/role_model_data.html
- Copyright holder: Japan Automobile Manufacturers Association
- Do not publish, distribute, or sell without permission.

## Rules

- Download manually only when needed.
- Store only in ignored `test-data/`.
- Use only for local development and verification.
- Do not copy, move, rename, modify, convert, archive, or upload.
- Do not commit or stage, including with `git add --force`.
- Do not include in fixtures, screenshots, builds, releases, or prompts.
- Do not send to AI or external services.
- Remove local copies when no longer needed.

## Application

- Read only after the user selects a local file or a CI cache restore point.
- Use the publicly released JAMA STEP files only as a cached test fixture, never as committed source data.
- Keep the downloaded file in the ignored `test-data/` directory or in the GitHub Actions cache.
- Never upload, redistribute, or republish the file.
- Never copy the cached asset into a repository commit or artifact.
