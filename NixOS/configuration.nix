# Edit this configuration file to define what should be installed on
# your system. Help is available in the configuration.nix(5) man page, on
# https://search.nixos.org/options and in the NixOS manual (`nixos-help`).

{ config, pkgs, shoji-bar-2, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # Use the systemd-boot EFI boot loader.
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  networking.hostName = "nixos"; # Define your hostname.
  # networking.wireless.enable = true;  # Enables wireless support via wpa_supplicant.

  # Configure network proxy if necessary
  # networking.proxy.default = "http://user:password@proxy:port/";
  # networking.proxy.noProxy = "127.0.0.1,localhost,internal.domain";

  # Enable networking
  networking.networkmanager.enable = true;

  # Set your time zone.
  time.timeZone = "Europe/Moscow";

  # Select internationalisation properties.
  i18n.defaultLocale = "en_US.UTF-8";

  i18n.extraLocaleSettings = {
    LC_ADDRESS = "ru_RU.UTF-8";
    LC_IDENTIFICATION = "ru_RU.UTF-8";
    LC_MEASUREMENT = "ru_RU.UTF-8";
    LC_MONETARY = "ru_RU.UTF-8";
    LC_NAME = "ru_RU.UTF-8";
    LC_NUMERIC = "ru_RU.UTF-8";
    LC_PAPER = "ru_RU.UTF-8";
    LC_TELEPHONE = "ru_RU.UTF-8";
    LC_TIME = "ru_RU.UTF-8";
  };

  # Configure keymap in X11
  services.xserver.xkb = {
    layout = "us,ru";
    options = "grp:win_space_toggle";
  };

  # extra-experimental-features
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # Define a user account. Don't forget to set a password with ‘passwd’.
  users.users."ananasik" = {
    isNormalUser = true;
    description = "ananasik";
    extraGroups = [ "networkmanager" "wheel" ];
    packages = with pkgs; [];
  };

  # List packages installed in system profile.
  # You can use https://search.nixos.org/ to find more packages (and options).
  environment.systemPackages = with pkgs; [
    # shell
    zsh
    bash

    # outlook
    stow
    shoji-bar-2
    
    # programming
    git

    kitty

    cmake
    gnumake
    ninja

    clang_22
    llvmPackages_22.clang-tools
    boost

    helix # r u actually still using (neo)vim?? lol.
    yazi
    tree
    ripgrep
    cloc

    # media
    kdePackages.dolphin
    mpc
    mpd
    mpv
    imv
    flameshot
    grim

    # network
    firefox
    tor
    torctl
    yt-dlp
    wget
    curl

    # system
    networkmanager
    util-linux
    cliphist
    imagemagick
    pavucontrol
    killall
    brightnessctl
    bluez
    bluez-tools
    wl-clipboard
  ];

  # shell
  environment.pathsToLink = [ "/share/zsh" ];
  users.defaultUserShell = pkgs.zsh;
  users.users.ananasik.ignoreShellProgramCheck = true;
  users.users.root.ignoreShellProgramCheck = true;
  # programs.zsh.enable = true;
  # programs.zsh = {
  #   enable = true;
  #   enableCompletion = true;
  #   autosuggestions.enable = true;
  #   syntaxHighlighting.enable = true;
  # };

  # fonts ???
  programs.dconf.enable = true;

  # audio
  services.pulseaudio = {
    enable = true;
    # extraConfig = "load-module module-nametive-ptotocol-tcp auth-ip=acl=127.0.0.1";
  };

  services.mpd = {
    enable = true;
    startWhenNeeded = false;
    settings = {
      bind_to_address = "/run/mpd/socket";
      audio_output = [
        {
          type = "pulse";
          name = "Custom PulseAudio Config";
          music_directory = "/home/ananasik/Music";
          # server = "127.0.0.1";
        }
      ];
    };
  };

  # tor
  services.tor = {
    enable = true;
    openFirewall = true;
  };

  # bluetooth
  # services.blueman.enable = true;

  # Some programs need SUID wrappers, can be configured further or are
  # started in user sessions.
  # programs.mtr.enable = true;
  # programs.gnupg.agent = {
  #   enable = true;
  #   enableSSHSupport = true;
  # };

  # List services that you want to enable:

  services.timesyncd.enable = false;
  services.chrony.enable = true;
  
  # Enable the OpenSSH daemon.
  # services.openssh.enable = true;

  # Open ports in the firewall.
  # networking.firewall.allowedTCPPorts = [ ... ];
  # networking.firewall.allowedUDPPorts = [ ... ];
  # Or disable the firewall altogether.
  # networking.firewall.enable = false;

  # Copy the NixOS configuration file and link it from the resulting system
  # (/run/current-system/configuration.nix). This is useful in case you
  # accidentally delete configuration.nix.
  # system.copySystemConfiguration = true;

  # This option defines the first version of NixOS you have installed on this particular machine,
  # and is used to maintain compatibility with application data (e.g. databases) created on older NixOS versions.
  #
  # Most users should NEVER change this value after the initial install, for any reason,
  # even if you've upgraded your system to a new NixOS release.
  #
  # This value does NOT affect the Nixpkgs version your packages and OS are pulled from,
  # so changing it will NOT upgrade your system - see https://nixos.org/manual/nixos/stable/#sec-upgrading for how
  # to actually do that.
  #
  # This value being lower than the current NixOS release does NOT mean your system is
  # out of date, out of support, or vulnerable.
  #
  # Do NOT change this value unless you have manually inspected all the changes it would make to your configuration,
  # and migrated your data accordingly.
  #
  # For more information, see `man configuration.nix` or https://nixos.org/manual/nixos/stable/options#opt-system.stateVersion .
  system.stateVersion = "26.05"; # Did you read the comment?


  # fonts
  fonts.packages = with pkgs; [
     noto-fonts
     noto-fonts-cjk-sans # Для китайского/японского/корейского
     noto-fonts-color-emoji # Для эмодзи

     liberation_ttf

     fira-code
     fira-code-symbols

     nerd-fonts.jetbrains-mono
     nerd-fonts.fira-code
   ];
}
