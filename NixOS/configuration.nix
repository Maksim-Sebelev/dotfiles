# # Edit this configuration file to define what should be installed on
# # your system. Help is available in the configuration.nix(5) man page, on
# # https://search.nixos.org/options and in the NixOS manual (`nixos-help`).

{ config, pkgs, shoji-bar-2, ... }:

{
  imports = [ ./hardware-configuration.nix ];

  # boot
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # network
  networking.hostName = "nixos";
  networking.networkmanager.enable = true;

  # time
  time.timeZone = "Europe/Moscow";

  # locales
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

  # keyboard layouts
  services.xserver.xkb = {
    layout = "us,ru";
    options = "grp:win_space_toggle";
  };

  # allow extra-experimental-features
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # my user
  users.users.ananasik = {
    isNormalUser = true;
    description = "ananasik";
    extraGroups = [ "networkmanager" "wheel" ];
    packages = with pkgs; [ ];
  };

  # packages
  environment.systemPackages = with pkgs; [
    # shell
    zsh
    bash
    zsh-powerlevel10k
    meslo-lgs-nf

    # appearance
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
    helix
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
    ncmpcpp

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

    # common
    ponysay
    termdown
    cmatrix
    toilet
  ];

  # shell
  environment.pathsToLink = [ "/share/zsh" ];
  environment.shells = [ pkgs.zsh ];
  users.defaultUserShell = pkgs.zsh;

  # session variables 
  environment.sessionVariables = {
    EDITOR = "hx";
    VISUAL = "hx";
  };

  programs.zsh = {
    enable = true;
    enableCompletion = true;
    enableBashCompletion = true;
    autosuggestions.enable = true;
    syntaxHighlighting.enable = true;
    histSize = 10000;
    histFile = "$HOME/.zsh_history";
    setOptions = [ "HIST_IGNORE_ALL_DUPS" ];

    ohMyZsh = {
      enable = true;
      plugins = [ "git" ];
    };

    shellAliases = {
      ls = "ls -a --color=auto";
      cp = "cp -i";
      s = "volume-off; systemctl suspend;";
      rm-swp = "rm .*.swp || rm *.swp || rm .*.swp.* || rm *swp.*";
      real-cloc = "cloc --exclude-dir = build,tmp,log,2d-dump,third-party,assets,project_struct,.vscode,.cache,.git ";
      vlm = "valgrind --leak-check = full --track-origins=yes";
      everlasting-summer = "reboot";
      rmb = "rm -rf build";
      cdb = "cd build";
      hpe = "echo $?";
      stwb = "sudo torctl start --bridges /home/ananasik/secure/bridges/tmp.bridges";
      stpt = "sudo torctl stop";
      tip = "torctl ip";
      wt = "sudo torctl status";
      mpv = "mpv --fs --no-stop-screensaver --geometry=1920x1080";
      sfp = "show-full-path";
      fih = "history | rg";
      changed-files = "gst --short | awk '{$1 = \"\"; print $0}'";
      changed-files-inline = "changed-files | tr \"\n\" \"\" ";
      get-sources-from-build = "find .. -path \"../build\" -prune -o \\( -name \"*.cpp\" -o -name \"*.hpp\" -o -name \"*.cppm\" -o -name \"*.c\" -o -name \"*.h\" \\) -print | tr \"\n\" \"\"";
      format-from-build = "clang-format-23 -i $(get-sources-from-build)";
      z = "yazi";
      tor-browser = "/home/ananasik/.local/share/one-dir-applications/tor/tor-browser/Browser/start-tor-browser";
      pony-is-watching-you = "ponysay --pony rainbowdash \"че зыришь, глаза пузыришь\"";
      rebuild = "sudo nixos-rebuild switch --flake \"/etc/nixos#ananasik\"";
    };
  
    promptInit = ''
      source ${pkgs.zsh-powerlevel10k}/share/zsh-powerlevel10k/powerlevel10k.zsh-theme
      [[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

      if [[ -r "''${XDG_CACHE_HOME:-''$HOME/.cache}/p10k-instant-prompt-''${(%):-%n}.zsh" ]]; then
        source "''${XDG_CACHE_HOME:-''$HOME/.cache}/p10k-instant-prompt-''${(%):-%n}.zsh"
      fi
    '';
  };

  # fonts
  programs.dconf.enable = true;
  fonts.packages = with pkgs; [
    noto-fonts
    noto-fonts-cjk-sans
    noto-fonts-color-emoji
    liberation_ttf
    fira-code
    fira-code-symbols
    nerd-fonts.jetbrains-mono
    nerd-fonts.fira-code
  ];

  # audio
  services.pulseaudio.enable = true;

  # tor
  services.tor = {
    enable = true;
    openFirewall = true;
  };

  # time sync
  services.timesyncd.enable = false;
  services.chrony.enable = true;

  # system version
  system.stateVersion = "26.05";
}
