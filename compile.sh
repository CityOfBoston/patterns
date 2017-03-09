#!/bin/bash
set -e # Exit with nonzero exit code if anything fails

echo "---------------------"
echo "Building assets"
echo "---------------------"
gulp build
echo "---------------------"
echo "Building fractal"
echo "---------------------"
fractal build
echo "---------------------"
echo "Done"
echo "---------------------"
