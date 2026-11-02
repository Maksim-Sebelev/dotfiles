function help
{
  echo "Usage:"
  echo "$0"
}

for opt in "$@"; do
  if [ "$opt" == "--help" ] || [ "$opt" == "-h" ]; then
    help
    exit 0
  fi
done

MPD_SOCKET="$MPD_HOST"
rain_background="/home/ananasik/Music/background/Forest-Maiden-and-Rain.2.mp3"
mpc -h "$MPD_SOCKET" clear
mpc -h "$MPD_SOCKET" add "$rain_background"
mpc -h "$MPD_SOCKET" repeat on
mpc -h "$MPD_SOCKET" play
