#!/usr/bin/env bash
# Canon v2: contracts are already deployed on canonhq.testnet; top up demo accounts, seed the story, write JUDGES.md, lock.
SKIP_BUILD=1 SKIP_DEPLOY=1 PUBLISH_TX=ArCB71nem4FTMQuiishHYyPt8H6VLiWWYRY4jEBCXELS DEPLOY_TX=CXtZrr1AbYp7cXfg1YznSGR1vSkCoT1w4w19L3xAxc3h \n  exec bash "$(dirname "$0")/deploy.sh" canonhq.testnet canonhq-demo.testnet
