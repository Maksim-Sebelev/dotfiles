#!/bin/bash

# if notebook only - all workspaces at him
# if monitor - 1 workspace at notebook, all others - at monitor

hyprctl eval workspace 1, monitor:eDP-1

if hyprctl monitors | grep -q "HDMI-A-1"; then
    for i in {2..10}; do
        hyprctl eval workspace $i, monitor:HDMI-A-1
    done
else
    for i in {2..10}; do
        hyprctl eval workspace $i, monitor:eDP-1
    done
fi
