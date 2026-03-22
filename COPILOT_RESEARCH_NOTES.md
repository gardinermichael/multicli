# Copilot Research Notes

Date: 2026-03-22

Prompts were run through Copilot CLI in non-interactive mode (`-p --no-ask-user --allow-all-tools -s`) to identify high-value improvements for Multi-CLI.

## Top Recommendations (Condensed)

1. Add provider circuit breakers to avoid repeated calls to failing backends.
2. Add health checks + failover routing per provider.
3. Enforce strict timeouts with exponential backoff + jitter.
4. Strengthen request/response schema validation and isolate validation errors.
5. Add structured observability with correlation IDs and latency/error metrics.

## JSONL Telemetry Schema (Recommended)

```json
{
  "timestamp": "ISO8601",
  "request_id": "uuid",
  "client": "string",
  "provider": "gemini|codex|claude|opencode|copilot|utility",
  "tool_name": "string",
  "status": "success|error|timeout|retry|fallback",
  "latency_ms": 123,
  "bottleneck": "provider_latency|routing_decision|schema_parsing|context_transfer|queue_wait|validation|unknown",
  "context_tokens_sent": 1200,
  "context_tokens_received": 450,
  "retry_count": 0,
  "cache_hit": false,
  "model": "string",
  "error": "string|null"
}
```

## Beads / Context Chunking Note

Copilot’s feedback: there is no direct equivalent to Claude “beads” inside the MCP bridge itself. The closest analog is routing-level context thinning and provider selection heuristics (capability + latency/success history + context budget) before dispatch.

