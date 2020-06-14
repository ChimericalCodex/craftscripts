/*
 * Please submit any issues at https://github.com/ChimericalCodex/craftscripts
 * 
 * This script binds a vine brush to the currently held tool. Using the brush
 * will create vines in the target area. 
 * 
 * Vine material, length, density, and brush size can be configured. Vines will
 * not be placed on blocks that cannot normally have vines hand-placed on them,
 * nor will they be placed on the same material as the chosen vine-material. 
 */

/*
 * Vine Brush CraftScript for WorldEdit
 * Copyright (C) 2020 ChimericalCodex
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

importPackage(Packages.com.sk89q.worldedit.util);
importPackage(Packages.com.sk89q.worldedit.math);
importPackage(Packages.com.sk89q.worldedit.function.pattern);
importPackage(Packages.com.sk89q.worldedit.world.block);
importPackage(Packages.com.sk89q.worldedit.world.item);
importPackage(Packages.com.sk89q.worldedit.command.tool.brush);

var ID_AIR = context.getBlock("air").getBlockType().getId();
var ID_VINE = context.getBlock("vine").getBlockType().getId();

var DIRECTIONS = [
	{
		offset: BlockVector3.at(0, 0, -1),
		vine: context.getBlock("vine[north=true]"),
	},
	{
		offset: BlockVector3.at(0, 0, 1),
		vine: context.getBlock("vine[south=true]"),
	},
	{
		offset: BlockVector3.at(1, 0, 0),
		vine: context.getBlock("vine[east=true]"),
	},
	{
		offset: BlockVector3.at(-1, 0, 0),
		vine: context.getBlock("vine[west=true]"),
	},
];

// Executes a callback function for every point in a specified ellipse. Based on
// WorldEdit's makeSphere function.
//
// @param {BlockVector3} pos The center point of the ellipse.
// @param {number} radiusX The x-radius of the ellipse.
// @param {number} radiusY The y-radius of the ellipse.
// @param {number} radiusZ The z-radius of the ellipse.
// @param {boolean} hollow Whether the ellipse should be hollow.
// @param {function(BlockVector3): undefined} callback A callback function that
//      will be executed on every block in the ellipse. The block's position
//      will be given as an argument.
function ellipse(pos, radiusX, radiusY, radiusZ, hollow, callback) {
	radiusX += 0.5;
	radiusY += 0.5
	radiusZ += 0.5;
	var invRadiusX = 1 / radiusX;
	var invRadiusY = 1 / radiusY;
	var invRadiusZ = 1 / radiusZ;
	var ceilRadiusX = Math.ceil(radiusX);
	var ceilRadiusY = Math.ceil(radiusY);
	var ceilRadiusZ = Math.ceil(radiusZ);

	var nextXn = 0;
	forX: for (var x = 0; x <= ceilRadiusX; ++x) {
		var xn = nextXn;
		nextXn = (x + 1) * invRadiusX;

		var nextYn = 0;
		forY: for (var y = 0; y <= ceilRadiusY; ++y) {
			var yn = nextYn;
			nextYn = (y + 1) * invRadiusY;

			var nextZn = 0;
			forZ: for (var z = 0; z <= ceilRadiusZ; ++z) {
				var zn = nextZn;
				nextZn = (z + 1) * invRadiusZ;

				var distanceSq = lengthSq(xn, yn, zn);
				if (distanceSq > 1) {
					if (z == 0) {
						if (y == 0) {
							break forX;
						}
						break forY;
					}
					break forZ;
				}

				if (hollow) {
					if (lengthSq(nextXn, yn, zn) <= 1 && lengthSq(xn, nextYn, zn) <= 1 && lengthSq(xn, yn, nextZn) <= 1) {
						continue;
					}
				}

				callback(pos.add(x, y, z));
				callback(pos.add(-x, y, z));
				callback(pos.add(x, -y, z));
				callback(pos.add(x, y, -z));
				callback(pos.add(-x, -y, z));
				callback(pos.add(x, -y, -z));
				callback(pos.add(-x, y, -z));
				callback(pos.add(-x, -y, -z));
			}
		}
	}
}

function lengthSq(x, y, z) {
	return (x * x) + (y * y) + (z * z);
}

// Returns whether a vine can be legally placed on a block of the given type.
// 
// @param {BlockType} blockType The type of the block to check.
// @return {boolean} True if a vine can be legally placed on this block, false otherwise.
function canPlaceVine(blockType) {
	var mat = blockType.getMaterial();
	return mat.isSolid() && mat.isFullCube();
}

function main() {
	if (argv.length < 2) {
		player.print("");
		player.print("Vine Brush");
		player.printError("Usage: /cs vine <size> <density> <length> <material>");
		player.print("");
		player.print("size      - Brush radius in blocks");
		player.print("density  - Vine density percent (0-100)");
		player.print("length   - Maximum vine length");
		player.print("material - Vine material to use (default is normal vines)");
		player.print("");
		player.print("Example: /cs vine 5 70 8 oak_leaves[persistent=true]")
		player.print("Use '/cs vine 0' to use with default settings.");
		return;
	}
	var localSession = context.getSession();

	// Parse arguments
	var brushSize = argv.length > 1 ? parseInt(argv[1]) : 6;
	if (brushSize <= 0) {
		brushSize = 6;
	}
	var density = (argv.length > 2 ? (argv[2]) : 20) / 100.0;
	var length = argv.length > 3 ? (argv[3]) : 12;
	var brushMat = argv.length > 4 ? context.getBlock(argv[4]) : context.getBlock("vine");

	// Set up tool
	var toolItem = player.getItemInHand(HandSide.MAIN_HAND);
	var tool = localSession.getBrushTool(toolItem.getType());
	tool.setSize(brushSize);
	tool.setFill(brushMat);

	var vineBrush = {
		build: function (editSession, pos, pat, size) {
			try {
				var rand = new java.util.Random();
				var patId = pat.getBlockType().getId();

				ellipse(pos, size, size, size, false, function (pos) {
					if (Math.random() > density || editSession.getBlock(pos).getBlockType().getId() !== ID_AIR) {
						return;
					}

					var validVines = [];
					for (var i = 0; i < DIRECTIONS.length; i++) {
						var adjPos = pos.add(DIRECTIONS[i].offset);
						var adjBlock = editSession.getBlock(adjPos);
						var adjBlockType = adjBlock.getBlockType();
						if (adjBlockType.getId() !== patId && canPlaceVine(adjBlockType)) {
							validVines.push(DIRECTIONS[i].vine);
						}
					};
					if (validVines.length === 0) {
						return;
					}

					if (pat.getBlockType().getId() === ID_VINE) {
						pat = validVines[rand.nextInt(validVines.length)];
					}
					var randomLength = rand.nextInt(length);
					for (var i = 0; i <= randomLength; i++) {
						var vinePos = pos.add(BlockVector3.at(0, -i, 0));
						if (editSession.getBlock(vinePos).getBlockType().getId() === ID_AIR) {
							editSession.setBlock(vinePos, pat);
						}
					};
				});
			} catch (e) {
				player.printError("[Error with vine brush]: " + e);
				throw e;
			} finally {
				localSession.remember(editSession);
			}
		},
	};

	tool.setBrush(vineBrush, "worldedit.brush.vine");
	player.print("");
	player.print("Vine brush bound to " + toolItem.getType().getName() + ".");
	player.print("Size: " + brushSize + " - Density: " + Math.round(density * 100) + "% - Length: " + length + " - Material: " + brushMat.getBlockType().getId());
}

main();
