# Copilot MCP Setup

This folder keeps repository-local MCP examples for Copilot.

References:
- https://gh.io/copilot-coding-agent-mcp-docs
- https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-a-pr#asking-copilot-to-create-a-pull-request-from-the-github-mcp-server

Notes:
- For Copilot CLI, use `/mcp add` or `~/.copilot/mcp-config.json`.
- For Copilot coding agent, configure MCP servers in the repository Copilot environment.
- Keep secrets in repository/copilot environment secrets, not in committed files.
