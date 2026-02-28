# Home Assistant Publishing Checklist

Source of truth:
- https://developers.home-assistant.io/docs/apps/publishing
- https://developers.home-assistant.io/docs/add-ons/presentation

## Repository-Level Requirements

1. Keep root `repository.yaml` present and valid.
2. Keep add-on folder with `config.yaml` + docs (`README.md`, `DOCS.md`).
3. Keep published container naming aligned with add-on `image` field and `{arch}` suffix.

## Add-on Metadata Requirements

1. `config.yaml` includes:
- `name`
- `slug`
- `version`
- `arch`
- `image`
- ingress/API permissions as needed
2. `build.json` maps each supported architecture to `build_from`.
3. Add-on documentation clearly states setup and runtime expectations.

## Release and CI Requirements

1. Publish architecture-specific images to GHCR.
2. Tag images with add-on `version`.
3. Keep CI checks green before release (`governance`, typechecks/tests, migration, drift, perf budgets).
4. Run optional live-HA verification workflow before publishing stable tags.
