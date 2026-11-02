set -eou pipefail

if [ $# -ne 2 ] || [ "$0" == "-h" ] || [ "$0" == "--help" ] || [ "$0" == "help" ]; then
	echo "Usage: $0 <workspace id> <monitor id>"
	exit 1
fi

workspace="$1"
monitor="$2"

echo "worspace: $workspace"
echo "monitor: $monitor"

eval "hyprctl dispatch 'hl.dsp.workspace.move({ workspace = \"$workspace\", monitor = \"$monitor\" })'"

