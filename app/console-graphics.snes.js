import { ColorRGB15, Palette, Tile, Map } from './console-graphics.js';



/** Class representing a Super Nintendo palette */
class PaletteSNES extends Palette {
	static SIZE = 16;

	constructor(colors) {
		if (Array.isArray(colors) && colors.length === PaletteSNES.SIZE) {
			super(colors);
		} else {
			super([
				ColorRGB15.fromRGB24(255, 255, 255),
				ColorRGB15.fromRGB24(238, 238, 238),
				ColorRGB15.fromRGB24(221, 221, 221),
				ColorRGB15.fromRGB24(204, 204, 204),
				ColorRGB15.fromRGB24(187, 187, 187),
				ColorRGB15.fromRGB24(170, 170, 170),
				ColorRGB15.fromRGB24(153, 153, 153),
				ColorRGB15.fromRGB24(136, 136, 136),
				ColorRGB15.fromRGB24(119, 119, 119),
				ColorRGB15.fromRGB24(102, 102, 102),
				ColorRGB15.fromRGB24(85, 85, 85),
				ColorRGB15.fromRGB24(68, 68, 68),
				ColorRGB15.fromRGB24(51, 51, 51),
				ColorRGB15.fromRGB24(34, 34, 34),
				ColorRGB15.fromRGB24(17, 17, 17),
				ColorRGB15.fromRGB24(0, 0, 0)
			]);
		}
	}
}



class TileSNES extends Tile {
	static import(rawData, defaultPalette) {
		if (!Array.isArray(rawData) || rawData.length !== 32)
			throw new Error('invalid SNES tile data');

		const pixels = new Array(8);
		for (let y = 0; y < 8; y++) {
			pixels[y] = new Array(8);
			for (let x = 0; x < 8; x++) {
				const bit0 = (rawData[y * 2 + 0] >> (7 - x)) & 0x01;
				const bit1 = (rawData[y * 2 + 1] >> (7 - x)) & 0x01;
				const bit2 = (rawData[y * 2 + 16 + 0] >> (7 - x)) & 0x01;
				const bit3 = (rawData[y * 2 + 16 + 1] >> (7 - x)) & 0x01;

				pixels[y][x] = (bit3 << 3) | (bit2 << 2) | (bit1 << 1) | bit0;
			}
		}
		if (!defaultPalette)
			defaultPalette = new PaletteSNES();
		return new this(pixels, defaultPalette);
	}

	export() {
		const data = new Array(32);
		for (let y = 0; y < 8; y++) {
			let byte0 = 0x00;
			let byte1 = 0x00;
			let byte2 = 0x00;
			let byte3 = 0x00;
			for (let x = 0; x < 8; x++) {
				const colorIndex = this.getPixel(x, y);
				byte0 |= (colorIndex & 0x01) << 7 - x;
				byte1 |= (colorIndex >> 1) << 7 - x;
				byte2 |= (colorIndex >> 2) << 7 - x;
				byte3 |= (colorIndex >> 3) << 7 - x;
			}
			data[y * 2 + 0] = byte0;
			data[y * 2 + 1] = byte1;
			data[y * 2 + 16 + 0] = byte2;
			data[y * 2 + 16 + 1] = byte3;
		}
		return data;
	}
}


class MapSNES extends Map{	
	static ALLOW_ATTRIBUTES=true;

	export(){
		const bytes=new Array(this.height);
		var index=0;
		for(var y=0; y<this.height; y++){
			bytes[y]=new Array(this.width * 2);
			for(var x=0; x<this.width; x++){
				const mapTile=this.mapTiles[index];
				bytes[y][x * 2 + 0]=this.tileset.getTileIndex(this.mapTiles[index].tile);

				let attributeByte=this.tileset.getPaletteIndex(this.mapTiles[index].tile.defaultPalette) & 0b00000111;
				if(mapTile.flipX)
					attributeByte|=0b01000000;
				if(mapTile.flipY)
					attributeByte|=0b10000000;
				bytes[y][x * 2 + 1]=attributeByte;
				index++;
			}
		}

		return bytes;
	}
}

export const ConsoleGraphicsSNES = {
	id:'sfc',
	Color: ColorRGB15,
	Palette: PaletteSNES,
	Tile: TileSNES,
	Map: MapSNES
}
