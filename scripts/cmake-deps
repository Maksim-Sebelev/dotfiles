#!/bin/bash

# usage in cmake build directory: 'cmake-deps'
# usage in project work directory: 'cmake-deps . build'
# why Ninja for .cppm? - in begin of 2026 cmake  don`t support C++ modules for Unix Makefiles.

set -euo pipefail

if [ $# -eq 0 ];
then
	cmake_dir=".."
	build_dir="."
elif [ $# -eq 2 ];
then
	cmake_dir="$1"
	build_dir="$2"
else
	echo "Usage: $0 [<cmake dir> <build dir>]"
	exit 1
fi

dot_out_dir="$build_dir/dot-out"
dot_file="$dot_out_dir/dependencies.dot"
image_dir="$cmake_dir/assets"
image_file="$image_dir/dependencies.png"

if [ -n "$(find $cmake_dir -name '*.cppm')" ]; then
	generator="Ninja"
	cxx_compiler="clang++"
else
	generator="Unix Makefiles"
	cxx_compiler="g++"
fi

mkdir -p "$image_dir"
rm -rf "$dot_out_dir"

#cmake -Wno-dev -S "$cmake_dir" -B "$build_dir" -G "$generator" -DCMAKE_CXX_COMPILER="$cxx_compiler" --graphviz="$dot_file" >/dev/null

cmake -Wno-dev -S "$cmake_dir" -B "$build_dir" --graphviz="$dot_file" >/dev/null

dot -Tpng "$dot_file" -o "$image_file"

full_image_path="$(cd "$(dirname "${image_file}")" && pwd)/dependencies.png"
echo "Finaly image:"
echo "$full_image_path"

echo

full_graphviz_path="$(cd "$(dirname "${dot_file}")" && pwd)/dependencies.dot"
echo "Finaly graphviz:"
echo "$full_graphviz_path"

