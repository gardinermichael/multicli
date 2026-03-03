# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

Only the latest minor release receives security patches.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use [GitHub Private Vulnerability Reporting](https://github.com/osanoai/multicli/security/advisories/new) to submit a report. This ensures the details remain confidential until a fix is available.

### What to include

- Description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Affected version(s)
- Any suggested fix (optional)

### What to expect

- **Acknowledgment** within 3 business days
- **Triage and initial assessment** within 7 business days
- **Fix timeline** communicated once the issue is confirmed; we aim to release a patch within 30 days of confirmation for critical and high severity issues
- **Credit** in the release notes and advisory (unless you prefer to remain anonymous)

If the report is declined, we will provide an explanation.

## Security Practices

- Dependencies are monitored by Dependabot with automated security updates enabled
- All PRs are scanned by CodeQL static analysis and Shai-Hulud supply chain detection
- npm packages are published with OIDC trusted publishing and provenance attestation
- Secret scanning with push protection is enabled on this repository
