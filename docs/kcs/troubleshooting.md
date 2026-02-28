# Troubleshooting

## Symptom: Logs appear escaped in Grafana

- Cause: collector output stage missing.
- Fix: verify `stage.output` in Alloy pipeline.

## Symptom: Framework fields do not render

- Cause: schema mismatch in YAML.
- Fix: run content schema validation and inspect `apps/web/src/content/config.ts`.
