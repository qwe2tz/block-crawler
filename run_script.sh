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


echo "All processes started and running in the background."