# Craftscripts #
Various craftscripts for [WorldEdit](https://github.com/EngineHub/WorldEdit),
updated for Minecraft 1.15+.

## Scripts ##
Scripts should be installed into the `worldedit/craftscripts/` directory.

### Vine Brush ###
    /cs vine <size> <density> <length> <material>

    Examples:
    /cs vine 8 85 15
    /cs vine 5 70 8 oak_leaves[persistent=true]
    /cs vine 2 50 6 glowstone

This script binds a vine brush to the currently held tool. Using the brush
will create vines in the target area. Vine material, length, density, and brush
size can be configured. Vines will not be placed on blocks that cannot normally
have vines hand-placed on them, nor will they be placed on the same material as
the chosen vine-material. 

## License ##
These scripts are released under the GNU GPL 3.0 license (see LICENSE.txt for
details). Users are free to use, distribute, and modify this work.
