set -eou pipefail
hyprctl devices | grep -A 5 'keyboard' | grep 'active keymap: ' | awk '{print $3}' | cut -c1-2 | tr '\n' '\0'
