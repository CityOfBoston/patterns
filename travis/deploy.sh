#!/bin/bash

set -o errexit -o nounset

if [ "$TRAVIS_BRANCH" != "master" ]
then
  echo "This commit was made against the $TRAVIS_BRANCH and not the master! No deploy!"
  exit 0
fi

rev=$(git rev-parse --short HEAD)

cd public

git init
git config user.name "cob-deployer"
git config user.email "digital@boston.gov"

git remote add upstream "https://$GH_TOKEN@github.com/cityofboston/patterns.git"
git fetch upstream
git reset upstream/gh-pages

touch .

git add -A .
git commit -am "rebuild pages at ${rev}"
git push -q upstream HEAD:gh-pages
