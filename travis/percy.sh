#!/bin/bash

percy snapshot public --baseurl "/components" --snapshots_regex="(components\/preview.).*\.html$" --enable_javascript --trace --widths "375,1024,1280"
