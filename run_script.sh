#!/bin/bash


nohup node crawler.js \
  "neuroweb" \
  "0x996eF3cfd6c788618C359Fb538D49281a0b13805" \
  "7248332" \
  "mainnet" > neuroweb-mainnet.log 2>&1 &

nohup node crawler.js \
  "neuroweb" \
  "0x4464A1c89C09a8D6062628D22AF9327485C81DB8" \
  "7248332" \
  "testnet" > neuroweb-tesnet.log 2>&1 &

nohup node crawler.js \
  "gnosis" \
  "0x828405dfc287f7d9b9cc0588d036f2b94231e166" \
  "37724991" \
  "mainnet" > gnosis-mainnet.log 2>&1 &


nohup node crawler.js \
  "base" \
  "0xd5ed8eab35536f8c33c38128087441218df65b1c" \
  "24221990" \
  "mainnet" > base-mainnet.log 2>&1 &


echo "All processes started and running in the background."