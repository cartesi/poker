#!/bin/sh
echo "Reading TurnBasedGame inputs..."

dd status=none if=$(flashdrive players) > players.raw
dd status=none if=$(flashdrive turnsMetadata) > turnsMetadata.raw
dd status=none if=$(flashdrive turnsData) > turnsData.raw
dd status=none if=$(flashdrive verificationInfo) > verificationInfo.raw

qjs --std /mnt/verifier/chess-run.js

dd status=none if=output.raw of=$(flashdrive output)
