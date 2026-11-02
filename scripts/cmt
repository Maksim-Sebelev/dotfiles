#!/bin/bash

# how to use:
# in cmake-build-directoruy call 'cmt'
# its equal to call your build system with same targets
# if your build system is make, then 'cmt' is equal to 'make'
# 'cmt target' is equal to 'make target'

set -euo pipefail

for arg in "$@"; do
	if [ "$arg" == "-h" ] || [ "$arg" == "--help" ] || [ "$arg" == "help" ]; then
		echo "CMakeTargets"
		echo "Usage:"
		echo "$0 [targets list]|[help]"
		echo "just runs cmake with provided targets and uses --parallel=\$(npoc)"
		echo "is a wrapper for cmake"
		echo
		echo "exit with 0, help option provided"
		exit 0
	fi
done

if [ $# -eq 0 ]; then
	cmake --build . --parallel $(nproc)
    exit 0
fi

for target in "$@"
do
	cmake --build . --target $target --parallel $(nproc)
done

