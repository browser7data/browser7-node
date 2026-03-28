#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

CURRENT=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT"

# Determine bump type (default: prerelease)
BUMP="${1:-prerelease}"

# Bump version (--no-git-tag-version so we control the commit ourselves)
NEW=$(npm version "$BUMP" --no-git-tag-version --preid alpha)
echo "Bumped to: $NEW"

# Publish with alpha tag for pre-releases, latest otherwise
# (prepublishOnly in package.json handles the build automatically)
if [[ "$NEW" == *"-"* ]]; then
  npm publish --tag alpha
else
  npm publish
fi

# Commit and tag
git add package.json package-lock.json
git commit -m "Release $NEW"
git tag "$NEW"

echo "Published $NEW"
echo "Run 'git push && git push --tags' when ready."
