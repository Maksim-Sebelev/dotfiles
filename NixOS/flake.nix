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

  outputs = { nixpkgs, shojiwm, home-manager, ags, ... } :
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
        specialArgs = {
          inherit shoji-bar-2;
        };
        modules = [
          ./configuration.nix
          ./hardware-configuration.nix
          home-manager.nixosModules.home-manager
          {
            home-manager.users.ananasik = { pkgs, ... }: {
              # home-manager version
              home.stateVersion = "26.11";

              # system backup's
              # 5 previous states are saved
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
                package = pkgs.git.override {
                  withLibsecret = true;
                };
                # whoami
                settings = {
                  user = {
                    name = "Maksim-Sebelev";
                    email = "7905111@list.ru";
                  };
                  credential.helper = "libsecret";
                };
              };

              # cursor theme
              home.pointerCursor = {
                enable = true;
                package = pkgs.bibata-cursors;
                name = "Bibata-Modern-Ice";
                size = 24;
                gtk.enable = true;
              };

              gtk = {
                enable = true;
                iconTheme = {
                  name = "Papirus-Dark";
                  package = pkgs.papirus-icon-theme;
                };
              };
              # shell
              # zsh + omz + p10k
              programs.zsh = {
                enable = true;
                # enableCompletion = true;
                # autosuggestion.enable = true;
                # syntaxHighlighting.enable = true;
                # syntaxHighlighting = {
                #   enable = true;
                #   styles = {
                #     alias = "fg=cyan,bold";
                #   };
                # };
                zplug = {
                  enable = true;
                  plugins = [
                    { name = "romkatv/powerlevel10k"; tags = [ as:theme depth:1 ]; }
                    { name = "ohmyzsh/ohmyzsh"; tags = [ "as:plugin" "depth:1" "use:plugins/git/git.plugin.zsh" ]; }
                    { name = "zsh-users/zsh-autosuggestions"; }
                    { name = "zsh-users/zsh-syntax-highlighting"; }
                  ];
                };
                initContent = ''
                  if [[ -r "''${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-''${(%):-%n}.zsh" ]]; then
                    source "''${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-''${(%):-%n}.zsh"
                  fi
                  [[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
                '';

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
                  cmake-def = "rmb && cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS = ON -DCMAKE_BUILD_TYPE = Release";
                  pretty-json = "python3 -m json.tool";
                  cmake-start = "rmb; cmake -S . -B build -DCMAKE_CXX_COMPILER=clang++ -G Ninja -DCMAKE_EXPORT_COMPILE_COMMANDS=ON -DCMAKE_BUILD_TYPE=Debug";
                  cmake-start-release = "rmb; cmake -S . -B build -DCMAKE_CXX_COMPILER=clang++ -G Ninja -DCMAKE_EXPORT_COMPILE_COMMANDS=ON -DCMAKE_BUILD_TYPE=Release -Wno-dev";
                  project-release-start = "cmake-start-release && cdb && clcmt";
                  project-start = "cmake-start && cdb && clcmt";
                  hpe = "echo $?";
                  stwb = "sudo torctl start --bridges /home/ananasik/secure/bridges/tmp.bridges";
                  stpt = "sudo torctl stop";
                  tip = "torctl ip";
                  wt = "sudo torctl status";
                  mpv = "mpv --fs --no-stop-screensaver --geometry=1920x1080";
                  sfp = "show-full-path";
                  find-in-history = "history | rg";
                  fih = "find-in-history";
                  changed-files = "gst --short | awk '{$1 = \"\"; print $0}";
                  changed-files-inline = "changed-files | tr \"\n\" \"\" ";
                  get-sources-from-build = "find .. -path \"../build\" -prune -o \( -name \"*.cpp\" -o -name \"*.hpp\" -o -name \"*.cppm\" -o -name \"*.c\" -o -name \"*.h\" \) -print | tr \"\n\" \"\"";
                  format-from-build = "clang-format-23 -i $(get-sources-from-build)";
                  z = "/usr/bin/yazi";
                  tor-browser = "/home/ananasik/.local/share/one-dir-applications/tor/tor-browser/Browser/start-tor-browser";
                  pony-is-watching-you = "ponysay --pony rainbowdash \"че зыришь, глаза пузыришь\"";
                  rebuild = "sudo nixos-rebuild switch --flake \"/etc/nixos#ananasik\"";
                };
              };
              home.sessionVariables = {
                EDITOR = "hx";
                VISUAL = "$EDITOR";
                MPD_HOST="/run/user/1000/mpd/socket";
                BROWSER = "firefox";
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
