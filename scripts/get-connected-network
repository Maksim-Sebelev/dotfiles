set -eou pipefail
iwctl station wlan0 show 2>/dev/null | awk '/Connected network/ {$1=""; $2=""; sub(/^  /, ""); print}'
