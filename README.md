# Model capability metadata

`models.json` may describe native, upstream model capabilities with an optional
per-model object:

```json
"native_capabilities": {
  "web_search": true
}
```

## Three-state semantics

`native_capabilities.web_search` is deliberately three-state:

- `true`: reliable model-level evidence says the exact model can invoke the
  provider's native web-search tool.
- `false`: reliable model-level evidence explicitly says the exact model cannot
  invoke that tool.
- absent: unknown. Absence must not be interpreted as `false`.

This is model metadata, not a provider-wide default. Do not infer support from a
provider name, model-family substring, nearby model, input modalities, or a
newer synthetic/future-looking model ID. Native support also does not guarantee
that every proxy, API protocol, account, plan, region, or request path exposes
or successfully executes the capability.

## Evidence and exact mappings

### OpenAI Codex catalog

The repository's [`codex_client_models.json`](./codex_client_models.json) is the
model-level Codex client template. An exact slug match with
`supports_search_tool: true` is the evidence for the following catalog entries:

| Catalog section | `web_search: true` model IDs |
| --- | --- |
| `codex-free` | `gpt-5.5`, `gpt-5.6-terra`, `gpt-5.6-luna`, `codex-auto-review` |
| `codex-team` | `gpt-5.5`, `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `codex-auto-review` |
| `codex-plus` | `gpt-5.3-codex-spark`, `gpt-5.5`, `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `codex-auto-review` |
| `codex-pro` | `gpt-5.3-codex-spark`, `gpt-5.5`, `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `codex-auto-review` |

`gpt-reserve` appears in the client template but not in `models.json`, so no
catalog entry is created for it. No model currently has an evidence-backed
`web_search: false` mapping.

### Official documented model examples

The exact assertions and provenance are recorded in
[`native-capabilities-evidence.json`](./native-capabilities-evidence.json):

| Catalog section | Exact model ID | Declaration | Evidence |
| --- | --- | --- | --- |
| `claude` | `claude-opus-5` | `true` | Anthropic's [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) documentation includes native search requests with this exact model, including `web_search_20250305`. |
| `xai` | `grok-4.6` | `true` | The [Grok 4.6 model page](https://docs.x.ai/developers/grok-4-6.md) lists web search; the [official Responses examples](https://docs.x.ai/developers/tools/advanced-usage.md) use this exact ID with `web_search`. |

These documentation excerpts were retrieved through Context7's indexes of the
first-party sites (`/websites/platform_claude_en` and `/websites/x_ai`). They are
not live upstream test results. Direct HTTP retrieval can redirect to unrelated
landing pages; such pages were not used as proof of model support.

Other Claude and xAI IDs remain unknown: these exact examples are not blanket
provider/family declarations. Gemini, Vertex, Gemini CLI, AI Studio, Antigravity,
and Kimi entries remain unknown until exact native-model evidence is curated.
Even a future `true` for native Gemini grounding would not by itself prove
availability through a CPA Responses path; that is a separate runtime check.
Missing evidence is never converted into a false capability claim.

## Validation

Run:

```sh
node scripts/validate-native-capabilities.mjs
node --test scripts/validate-native-capabilities.test.mjs
```

The validator checks the schema and requires every Codex plan annotation to be
an exact ID match for boolean `supports_search_tool` metadata in the local
Codex client template. Other annotations must match the exact documented
provider/model pair in the evidence file. It never infers support by prefix.

CPA must additionally check every registration's actual Responses path, including
aliases, prefixes, and mixed account/provider mappings. Publish this data before
upgrading CPA: a successfully fetched older catalog with no capability fields
must remain unknown, rather than silently restoring provider-level defaults.
