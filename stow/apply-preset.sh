set -euo pipefail
mydir="$(dirname "$0")"
cd "$mydir" || exit 1
bash ./setup/.config/
