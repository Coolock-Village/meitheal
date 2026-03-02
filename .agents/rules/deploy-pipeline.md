

## HA Addon Deploy Pipeline — Critical Rule

**Pushing code to GitHub does NOT deploy to HA.**

The HA addon runs Docker images pulled from GHCR/Docker Hub. To deploy changes:

1. Bump `version` in `meitheal-hub/config.yaml`
2. Commit → `git tag v{version}` → `git push origin main --tags`
3. CI (`publish-addon-images.yml`) auto-builds Docker images on `v*` tag push
4. Restart the addon in HA: Settings → Add-ons → Meitheal Hub → Restart

**Never tell the user "it's deployed" just because code was pushed to `main`.** A version tag push is required to trigger the Docker build.

See `.planning/codebase/STACK.md` → "Deployment (HA Addon)" for full details.
