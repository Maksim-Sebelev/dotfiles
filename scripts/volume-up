set -eou pipefail

if [ $# -ne 1 ]; then
	echo "Usage: $0 <volume-up-value>"
	exit 1
fi

pactl set-sink-volume @DEFAULT_SINK@ +$1%
