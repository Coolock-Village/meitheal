# WebMCP Integration

Meitheal exposes machine-readable discovery and contract metadata for agent/tool interoperability.

## Discovery Endpoints

- `/.well-known/mcp.json`
- `/.well-known/jsondoc.json`
- `/llms.txt`
- `/llms-full.txt`

## Design Rules

- Endpoints must remain public and versioned.
- Schemas must be deterministic and CI-validated.
- Authentication requirements for protected tools must be declared explicitly.
- Domain capabilities are documented by bounded context.

## Runtime Notes

- HA-hosted runtime serves discovery from `public/.well-known`.
- Cloudflare runtime mirrors the same artifacts.
- Any contract change requires a docs and test update in the same commit.
