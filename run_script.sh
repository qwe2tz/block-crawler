#!/bin/bash
nohup node crawler.js \
  "neuroweb" \
  "0x996eF3cfd6c788618C359Fb538D49281a0b13805" \
  "7248332" \
  "mainnet" \
  "https://astrosat-parachain-rpc.origin-trail.network" 2>&1 &

nohup node crawler.js \
  "neuroweb" \
  "0x996eF3cfd6c788618C359Fb538D49281a0b13805" \
  "7248332" \
  "testnet" \
  "https://lofar-testnet.origin-trail.network" 2>&1 &


echo "All processes started and running in the background."