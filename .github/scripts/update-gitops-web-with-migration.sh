#!/usr/bin/env bash
set -euo pipefail

source_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
overlay_path="${GITOPS_OVERLAY_PATH:?missing GitOps overlay path}"
image="${WEB_IMAGE:?missing web image}"
tag="${WEB_IMAGE_TAG:?missing web image tag}"
job_manifest="allclear-web-prisma-migrate.yaml"

if [[ "$overlay_path" != "argocd/allclear-prod" ]]; then
  echo "This migration Job can only update the production overlay." >&2
  exit 1
fi

cd "$source_root/.gitops/$overlay_path"
git config user.name 'waffle-image-update[bot]'
git config user.email '260899885+waffle-image-update[bot]@users.noreply.github.com'

for attempt in 1 2 3 4 5; do
  git fetch --quiet origin main
  git reset --quiet --hard origin/main

  cp "$source_root/.github/gitops/allclear-prod-prisma-migrate.yaml" "$job_manifest"
  if ! yq e '.resources[] | select(. == "allclear-web-prisma-migrate.yaml")' kustomization.yaml | grep -qxF "$job_manifest"; then
    kustomize edit add resource "$job_manifest"
  fi
  kustomize edit set image "$image:$tag"

  rendered="$(kustomize build .)"
  job_image="$(printf '%s\n' "$rendered" | yq ea -N 'select(.kind == "Job" and .metadata.name == "allclear-web-prisma-migrate") | .spec.template.spec.containers[0].image')"
  web_image="$(printf '%s\n' "$rendered" | yq ea -N 'select(.kind == "Deployment" and .metadata.name == "allclear-web") | .spec.template.spec.containers[0].image')"
  if [[ "$job_image" != "$image:$tag" || "$web_image" != "$image:$tag" ]]; then
    echo "The migration Job and web Deployment must render with the same image tag." >&2
    exit 1
  fi

  git add -- kustomization.yaml "$job_manifest"
  if git diff --cached --quiet; then
    echo "Production GitOps image and migration Job are already up to date."
    exit 0
  fi

  git commit --quiet -m "build: update allclear-prod/allclear-web to $tag with Prisma migration Job"
  if git push --quiet origin HEAD:main; then
    exit 0
  fi

  echo "GitOps push attempt $attempt failed; retrying on the latest main."
  sleep $(( (RANDOM % 5) + 1 ))
done

echo "Could not update production GitOps after 5 attempts." >&2
exit 1
