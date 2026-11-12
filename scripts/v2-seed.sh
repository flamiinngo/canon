#!/usr/bin/env bash
# Canon v2: contracts are already deployed on canonhq.testnet.
# Top up demo accounts, seed the story, write JUDGES.md, then lock the registry.
export SKIP_BUILD=1
export SKIP_DEPLOY=1
export PUBLISH_TX=ArCB71nem4FTMQuiishHYyPt8H6VLiWWYRY4jEBCXELS
export DEPLOY_TX=CXtZrr1AbYp7cXfg1YznSGR1vSkCoT1w4w19L3xAxc3h
exec bash "$(dirname "$0")/deploy.sh" canonhq.testnet canonhq-demo.testnet
