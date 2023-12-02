{
  description = "Development environment";

  outputs = { self, nixpkgs }:
    let inherit (nixpkgs) lib;

    in {
      devShell = lib.genAttrs lib.systems.flakeExposed (system:
        let
          pkgs = import nixpkgs { inherit system; };
          nodejs = pkgs.nodejs-18_x;

        in pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            nodejs
            (yarn.override { inherit nodejs; })
          ];
        });
    };
}
