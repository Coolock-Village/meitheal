# Operations Runbook

## Logging Pipeline Health

1. Confirm app emits JSON logs to stdout.
2. Confirm Alloy can read journal stream.
3. Confirm Loki receives labeled streams.
4. Confirm Grafana dashboards resolve data source.

## HA Ingress Login Failure

1. Verify `X-Ingress-Path` and `HASSIO_TOKEN` forwarding.
2. Check middleware rejection reason in auth logs.
3. Validate add-on ingress settings in `addons/meitheal-hub/config.yaml`.
