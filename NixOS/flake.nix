{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    shojiwm.url = "github:bea4dev/ShojiWM/08b0d5083287e04782b1544acc643f0cc4e1afb4";
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, shojiwm, home-manager, ags, ... }:
    let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;

      shoji-bar-2-src = pkgs.fetchFromGitHub {
        owner = "bea4dev";
        repo = "shoji-bar-2";
        rev = "92baf5ba35876295343dce2b6095de5debbb0fee";
        hash = "sha256-qDP2euj/C7+lL71/AxWm9TNEo9ZGhHnOKs8ELio5xMc=";
      };

      shoji-bar-2 = pkgs.stdenvNoCC.mkDerivation {
        pname = "shoji-bar-2";
        version = "unstable";
        src = shoji-bar-2-src;
        dontWrapQtApps = true;
        nativeBuildInputs = with pkgs; [
          wrapGAppsHook4
          gobject-introspection
          ags.packages.${pkgs.stdenv.hostPlatform.system}.default
        ];

        buildInputs = with pkgs; [
          gjs
          glib
          gtk4
          gtk4-layer-shell
          astal.io
          astal.astal4
          astal.apps
          astal.battery
          astal.network
          networkmanager
          astal.notifd
          astal.mpris
          astal.wireplumber
          astal.powerprofiles
          astal.tray
          papirus-icon-theme
        ];

        installPhase = ''
          runHook preInstall
          mkdir -p $out/bin
          ags bundle app.tsx $out/bin/shoji-bar-2
          runHook postInstall
        '';

        preFixup = ''
          gappsWrapperArgs+=(
            --prefix PATH : ${pkgs.lib.makeBinPath [
              pkgs.networkmanager
              pkgs.bluez
              pkgs.util-linux
              pkgs.brightnessctl
              pkgs.cliphist
              pkgs.wl-clipboard
              pkgs.imagemagick
            ]}
          )
        '';

        meta = with pkgs.lib; {
          description = "shoji-bar-2 - default desktop shell for ShojiWM";
          homepage = "https://github.com/bea4dev/shoji-bar-2";
          license = licenses.mit;
          platforms = platforms.linux;
        };
      };
    in
    {
      nixosConfigurations.ananasik = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        specialArgs = { inherit shoji-bar-2; };
        modules = [
          ./configuration.nix
          ./hardware-configuration.nix
          home-manager.nixosModules.home-manager
          {
            home-manager.users.ananasik = { pkgs, ... }: {
              home.stateVersion = "26.11";

              # do not save old states
              programs.nh = {
                enable = true;
                clean = {
                  enable = true;
                  extraArgs = "--keep 5";
                };
              };

              # git
              programs.git = {
                enable = true;
                package = pkgs.git.override { withLibsecret = true; };
                settings = {
                  user = {
                    name = "Maksim-Sebelev";
                    email = "7905111@list.ru";
                  };
                  credential.helper = "libsecret";
                };
              };

              # pointer cursos theme
              home.pointerCursor = {
                enable = true;
                package = pkgs.bibata-cursors;
                name = "Bibata-Modern-Ice";
                size = 24;
                gtk.enable = true;
              };

              # gtk
              gtk = {
                enable = true;
                iconTheme = {
                  name = "Papirus-Dark";
                  package = pkgs.papirus-icon-theme;
                };
              };

              # services.pulseaudio.enable = true;
              services.mpd = {
                 enable = true;
                 musicDirectory = "/home/ananasik/Music";
                 extraConfig = ''
                   # bind_to_address "/run/user/1000/mpd/socket"
                   audio_output {
                     type "pulse"
                     name "My PulseAudio"
                   }
                 '';
              };

            };
          }
          shojiwm.nixosModules.default
          {
            programs.shojiwm = {
              enable = true;
              initConfig = {
                enable = true;
                users = [ "ananasik" ];
              };
            };
          }
        ];
      };
    };
}
