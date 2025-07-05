import { Color, ColorRGB15, Palette, Tile, Map } from './console-graphics.js';

/* DMG */
const DMG_GRAYSCALE_PALETTE = [255, 170, 85, 0];
class ColorDMG extends Color {
	constructor(twoBppColor) {
		if (typeof twoBppColor !== 'number')
			throw new Error('invalid DMG color data');
		super(twoBppColor & 0x03);
	}
	/* setShade(shade) {
		this.data = shade & 0x03;
	} */

	/**
	 * Converts RGB15 to RGB24
	 * @returns Object with r, g and b properties
	 */
	toRGB24() {
		return [
			DMG_GRAYSCALE_PALETTE[this.data],
			DMG_GRAYSCALE_PALETTE[this.data],
			DMG_GRAYSCALE_PALETTE[this.data]
		]
	}

	static fromRGB24(r8, g8, b8) {
		const grayscaleColor = 0.3 * r8 + 0.59 * g8 + 0.11 * b8;

		let closestShade = DMG_GRAYSCALE_PALETTE.reduce((a, b) => {
			return Math.abs(b - grayscaleColor) < Math.abs(a - grayscaleColor) ? b : a;
		});

		return new ColorDMG(DMG_GRAYSCALE_PALETTE.indexOf(closestShade));
	}
}
class PaletteDMG extends Palette {
	static SIZE = 4;

	constructor(colors) {
		if (Array.isArray(colors) && colors.length === PaletteDMG.SIZE) {
			super(colors);
		} else {
			super([
				new ColorDMG(0),
				new ColorDMG(1),
				new ColorDMG(2),
				new ColorDMG(3)
			]);
		}
	}


	export() {
		return [(this.colors[0].data << 6) |
			(this.colors[1].data << 4) |
			(this.colors[2].data << 2) |
			(this.colors[3].data << 0)];
	}

	/**
	* Import an array of colors binary data into a Palette object.
	* @param {number} dmgPaletteByte
	* @return {Palette}
	*/
	static import(dmgPaletteByte) {
		if (typeof dmgPaletteByte !== 'number')
			throw new Error('invalid DMG palette data');

		return new this([
			ColorDMG.import((dmgPaletteByte >> 6) & 0x03),
			ColorDMG.import((dmgPaletteByte >> 4) & 0x03),
			ColorDMG.import((dmgPaletteByte >> 2) & 0x03),
			ColorDMG.import((dmgPaletteByte >> 0) & 0x03)
		]);
	}
}

/* CGB */
class PaletteCGB extends Palette {
	static SIZE = 4;

	constructor(colors) {
		if (Array.isArray(colors) && colors.length === PaletteCGB.SIZE) {
			super(colors);
		} else {
			super([
				ColorRGB15.fromRGB24(224, 248, 208),
				ColorRGB15.fromRGB24(136, 192, 112),
				ColorRGB15.fromRGB24(52, 104, 86),
				ColorRGB15.fromRGB24(8, 24, 32)
			]);
		}
	}
}




















//const COL_MASK=[0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01];
//const COL_MASK_NEG=[0x7f, 0xbf, 0xdf, 0xef, 0xf7, 0xfb, 0xfd, 0xfe];
class TileDMG extends Tile {
	static import(rawData, defaultPalette) {
		if (!Array.isArray(rawData) || rawData.length !== 16)
			throw new Error('invalid DMG tile data');

		const pixels = new Array(8);
		for (let y = 0; y < 8; y++) {
			pixels[y] = new Array(8);
			for (let x = 0; x < 8; x++) {
				const bit0 = (rawData[y * 2 + 0] >> (7 - x)) & 0x01;
				const bit1 = (rawData[y * 2 + 1] >> (7 - x)) & 0x01;

				pixels[y][x] = (bit1 << 1) | bit0;
			}
		}
		if (!defaultPalette)
			defaultPalette = new PaletteDMG();
		return new this(pixels, defaultPalette);
	}

	export() {
		const data = new Array(16);
		for (let y = 0; y < 8; y++) {
			let byte0 = 0x00;
			let byte1 = 0x00;
			for (let x = 0; x < 8; x++) {
				const colorIndex = this.getPixel(x, y);
				byte0 |= (colorIndex & 0x01) << 7 - x;
				byte1 |= (colorIndex >> 1) << 7 - x;
			}
			data[y * 2 + 0] = byte0;
			data[y * 2 + 1] = byte1;
		}
		return data;
	}
}



class MapDMG extends Map{
	static ALLOW_ATTRIBUTES=false;

	export(){
		const bytes=new Array(this.height);
		var index=0;
		for(var y=0; y<this.height; y++){
			bytes[y]=new Array(this.width);
			for(var x=0; x<this.width; x++){
				bytes[y][x]=this.tileset.getTileIndex(this.mapTiles[index].tile);
				index++;
			}
		}

		return bytes;
	}
}
class MapCGB extends Map{	
	static ALLOW_ATTRIBUTES=true;

	export(){
		const bytes=new Array(this.height);
		var index=0;
		for(var y=0; y<this.height; y++){
			bytes[y]=new Array(this.width);
			for(var x=0; x<this.width; x++){
				bytes[y][x]=this.tileset.getTileIndex(this.mapTiles[index].tile);

				index++;
			}
		}

		return bytes;
	}

	exportAttributes(){
		const bytesAttributes=new Array(this.height);
		var index=0;
		for(var y=0; y<this.height; y++){
			bytesAttributes[y]=new Array(this.width);
			for(var x=0; x<this.width; x++){
				const mapTile=this.mapTiles[index];
				let attributeByte=this.tileset.getPaletteIndex(mapTile.tile.defaultPalette) & 0b00000111;
				if(mapTile.flipX)
					attributeByte|=0b00100000;
				if(mapTile.flipY)
					attributeByte|=0b01000000;

				bytesAttributes[y][x]=attributeByte;
				index++;
			}
		}

		return bytesAttributes;
	}
}

export const ConsoleGraphicsDMG = {
	id:'dmg',
	Color: ColorDMG,
	Palette: PaletteDMG,
	Tile: TileDMG,
	Map: MapDMG
}
export const ConsoleGraphicsCGB = {
	id:'cgb',
	Color: ColorRGB15,
	Palette: PaletteCGB,
	Tile: TileDMG,
	Map: MapCGB
}