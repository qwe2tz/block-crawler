#!/bin/bash
START_TIME=$(date +"%Y-%m-%d_%H-%M-%S");

nohup node crawler.js \
  "https://astrosat-parachain-rpc.origin-trail.network" \
  'neuroweb' \
  "0x996eF3cfd6c788618C359Fb538D49281a0b13805" \
  "7248332" \
  "mainnet" \
  `${START_TIME}` 2>&1 &

echo "All processes started and running in the background."