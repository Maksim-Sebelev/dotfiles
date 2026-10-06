#!/bin/bash

# Мониторим события PulseAudio
pactl subscribe | while read -r event; do
    if [[ $event == *"change"* ]] || [[ $event == *"new"* ]]; then
        sleep 1
        
        if pactl list cards | grep -A 5 "Headphones" | grep -q "available"; then
            pactl set-card-profile alsa_card.pci-0000_00_1f.3-platform-skl_hda_dsp_generic "HiFi (HDMI1, HDMI2, HDMI3, Headphones, Mic1, Mic2)"
            SINK=$(pactl list short sinks | grep -i "headphone" | awk '{print $2}')
        else
            pactl set-card-profile alsa_card.pci-0000_00_1f.3-platform-skl_hda_dsp_generic "HiFi (HDMI1, HDMI2, HDMI3, Mic1, Mic2, Speaker)"
            SINK=$(pactl list short sinks | grep -i "speaker" | awk '{print $2}')
        fi
        
        pactl set-default-sink $SINK
    fi
done
