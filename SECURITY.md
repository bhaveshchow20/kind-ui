# Security

## Current support status

Kind UI is experimental and unpublished. There are no supported production releases or security response-time guarantees. Do not use the placeholder packages as a production dependency.

## Reporting a suspected vulnerability

Do not put secrets, exploit details, or private user data in issues, pull requests, or logs. Contact the repository owner, [bhaveshchow20](https://github.com/bhaveshchow20), through an existing private channel and ask where to send the report. If you have no private channel, request one without disclosing vulnerability details.

This project has not yet designated a security email address or verified GitHub private vulnerability reporting. A working private reporting route and a supported-version policy are prerequisites to publishing supported packages; do not assume either is available today.

Once a private route is agreed, include the affected commit/version, impact, a minimal reproduction, and any suggested mitigation. Share only the information necessary to investigate.

## Development safeguards

Never commit credentials, tokens, user datasets, or environment secrets. Keep CI permissions minimal, avoid unreviewed install/release scripts, and review dependency changes. Publishing credentials and security/access settings require separate authorization.
