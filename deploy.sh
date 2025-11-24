#!/bin/bash

# Build, deploy, and push script
npm run build && \
firebase deploy --only hosting && \
git add . && \
git commit -m "Deploy to Firebase - $(date +'%Y-%m-%d %H:%M:%S')" && \
git push

