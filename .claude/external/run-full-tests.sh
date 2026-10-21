#!/usr/bin/env bash
# Run the project's full test suite (Vitest via npm).
set -euo pipefail
cd "$(dirname "$0")/../.."
npm test
