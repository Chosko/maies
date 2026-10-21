#!/usr/bin/env bash
# Run the project's tests (Vitest via npm) against the test files given as arguments.
set -euo pipefail
cd "$(dirname "$0")/../.."
npm test -- "$@"
