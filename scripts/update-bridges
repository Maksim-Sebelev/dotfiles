#!/bin/bash

# this utility add argumenta (expected bridges (maybe gt 1)) in ~/secure/bridges/tmp.bridges as bridges

if [ $# -eq 0 ]; then
   echo "Usage: $0 [ bridges ]"
   exit 1 
fi

bridges=~/secure/bridges/tmp.bridges

rm $bridges
touch $bridges

for bridge in "$@"; do
    echo "$bridge" >> $bridges
done

