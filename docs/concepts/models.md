# Model Selection

This server supports multiple Gemini models, with **Gemini 3.1 Pro** as the default.

## Supported Models

### gemini-3.1-pro-preview (Default)
- **Best for**: Latest features, complex analysis, large codebases
- **Context**: 2M tokens
- **Identifier**: `gemini-3.1-pro-preview`

### gemini-3-pro-preview
- **Best for**: Stable analysis, large codebases
- **Context**: 2M tokens
- **Identifier**: `gemini-3-pro-preview`

### 3
- **Best for**: Quick selection of the standard Gemini 3 model
- **Identifier**: `3`

## Setting Models

The default model is `gemini-3.1-pro-preview`. You can override via environment variable:

### In Configuration
```json
{
  "mcpServers": {
    "gemini-cli": {
      "command": "gemini-mcp",
      "env": {
        "GEMINI_DEFAULT_MODEL": "gemini-3.1-pro-preview"
      }
    }
  }
}
```

## Token Limits

- **Gemini 3/3.1 Pro**: ~2 million tokens (~500k lines of code)

## Recommendations

- **Code Review**: gemini-3.1-pro-preview
- **Architecture Analysis**: gemini-3.1-pro-preview
- **Quick Fixes**: gemini-3.1-pro-preview
- **Documentation**: gemini-3.1-pro-preview
- **Security Audit**: gemini-3.1-pro-preview
- **Brainstorming**: gemini-3.1-pro-preview
