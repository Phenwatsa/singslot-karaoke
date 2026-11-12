#!/bin/sh
set -e

# ------------------------------------------------------------------------------
# SingSlot Container Entrypoint
# Hand control to CMD via exec so the process becomes PID 1 and receives
# SIGTERM from Cloud Run for graceful shutdown.
# Ref: https://cloud.google.com/run/docs/container-contract#instance-shutdown
# ------------------------------------------------------------------------------
exec "$@"
