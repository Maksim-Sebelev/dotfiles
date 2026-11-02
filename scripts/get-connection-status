#!/bin/bash

iwctl station wlan0 show | rg "State.*connected" >/dev/null
if [ $? -eq 0 ]; then
  echo "enabled"
else
  echo "disabled"
fi
