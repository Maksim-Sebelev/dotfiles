set -eou pipefail

if [ $# -ne 0 ]; then
	echo "Usage: $0 <no-args-expected>"
	exit 1
fi

pactl set-sink-mute @DEFAULT_SINK@ toggle
