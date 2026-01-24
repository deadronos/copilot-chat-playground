#!/usr/bin/env sh
# Fail fast and treat unset variables as errors; try to enable pipefail if supported
set -eu

# NOTE: Debian's /bin/sh is usually `dash`, which does not support `pipefail`.
# With `set -e`, a naive `set -o pipefail || true` can still terminate the script.
# Enable pipefail only when supported, without tripping `set -e`.
if (set -o pipefail) 2>/dev/null; then
  :
fi

# Entrypoint: inject DOTENV_PRIVATE_KEY_* secrets from /run/secrets if present
# and then exec the passed command.
#
# Security posture:
# - We only read a narrow allow-list of filenames from /run/secrets.
# - We do not print secret values.
# - Empty secrets are ignored.

if [ -d "/run/secrets" ]; then
  for f in /run/secrets/DOTENV_PRIVATE_KEY_*; do
    # If the glob didn't match, the loop will iterate the literal pattern — guard against that
    if [ ! -f "$f" ]; then
      continue
    fi

    name=$(basename "$f")
    # Safe read and export
    if [ -r "$f" ]; then
      val=$(cat "$f")
      # Only export non-empty values
      if [ -n "$val" ]; then
        export "$name"="$val"
      fi
    fi
  done

  # Also support GitHub tokens as secrets-first injection (for Copilot auth).
  # Docker secrets are mounted as files under /run/secrets/<name>.
  for name in GH_TOKEN GITHUB_TOKEN; do
    f="/run/secrets/$name"
    if [ ! -f "$f" ]; then
      continue
    fi
    if [ -r "$f" ]; then
      val=$(cat "$f")
      if [ -n "$val" ]; then
        export "$name"="$val"
      fi
    fi
  done
fi

# Execute the container command
exec "$@"
