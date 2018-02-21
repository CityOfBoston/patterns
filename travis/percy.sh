#!/bin/bash

if [ "$TRAVIS_BRANCH" != "production" ]
then
  percy snapshot public --snapshots_regex="(components\/preview.).*\.html$" --enable_javascript --trace --widths "375,1024,1280"
fi
