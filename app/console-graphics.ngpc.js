import { Color, Palette, Tile } from './console-graphics.js';



/**
 * Class representing a RGB12 color
 */
const RESCALE_24TO12BIT = 17;
const BIT4_MASK = 0b00001111;
export class ColorRGB12 extends Color {
	static DATA_SIZE=2;

	/**
	 * Converts RGB15 to RGB24
	 * @returns Array with r, g and b properties (in 8bit format)
	 */
	toRGB24() {
		return [
			ColorRGB12.to8bit(this.data & BIT4_MASK),
			ColorRGB12.to8bit((this.data >> 4) & BIT4_MASK),
			ColorRGB12.to8bit((this.data >> 8) & BIT4_MASK),
		]
	}
	/**
	 * Extracts RGB15 components
	 * @returns Array with r, g and b properties (in 5bit format)
	 */
	toRGB15() {
		return [
			this.data & BIT4_MASK,
			(this.data >> 5) & BIT4_MASK,
			(this.data >> 10) & BIT4_MASK
		]
	}

	setR4(r4) {
		this.data = (this.data & 0b0000111111110000) | (r4 & BIT4_MASK);
	}
	setG4(g4) {
		this.data = (this.data & 0b0000111100001111) | ((g4 & BIT4_MASK) << 4);
	}
	setB4(b4) {
		this.data = (this.data & 0b0000000011111111) | ((b4 & BIT4_MASK) << 8);
	}
	setRGB12(r4, g4, b4) {
		this.data = (r4 & BIT4_MASK) | ((g4 & BIT4_MASK) << 4) | ((b4 & BIT4_MASK) << 8);
	}
	setR8(r8) {
		this.setR4(ColorRGB12.to4bit(r8));
	}
	setG8(g8) {
		this.setG4(ColorRGB12.to4bit(g8));
	}
	setB8(b8) {
		this.setB4(ColorRGB12.to4bit(b8));
	}
	setRGB24(r8, g8, b8) {
		this.setR8(r8);
		this.setG8(g8);
		this.setB8(b8);
	}

	static to4bit(component8) {
		return Math.round(component8 / RESCALE_24TO12BIT) & BIT4_MASK
	}
	static to8bit(component4) {
		return Math.round(component4 * RESCALE_24TO12BIT);
	}

	static fromRGB12(r4, g4, b4) {
		const newColor = new this(0x0000);
		newColor.setRGB12(r4, g4, b4);
		return newColor;
	}

	static fromRGB24(r8, g8, b8) {
		const newColor = new this(0x0000);
		newColor.setR8(r8);
		newColor.setG8(g8);
		newColor.setB8(b8);
		return newColor;
	}
}


class PaletteNGPC extends Palette {
	static SIZE = 4;

	constructor(colors) {
		if (Array.isArray(colors) && colors.length === 4) {
			super(colors);
		} else {
			super([
				ColorRGB12.fromRGB24(240, 240, 240),
				ColorRGB12.fromRGB24(176, 176, 180),
				ColorRGB12.fromRGB24(80, 80, 88),
				ColorRGB12.fromRGB24(32, 32, 40)
			]);
		}
	}
}


class TileNGPC extends Tile {
	static import(rawData, defaultPalette) {
		if (!Array.isArray(rawData) || rawData.length !== 16)
			throw new Error('invalid NGPC tile data');

		let readOffset = 0;
		const pixels = new Array(8);
		for (let y = 0; y < 8; y++) {
			pixels[y] = new Array(8);
			for (let x = 0; x < 4; x++) {
				const bit0 = (rawData[readOffset] >> (7 - x*2)) & 0x01;
				const bit1 = (rawData[readOffset] >> (7 - x*2 - 1)) & 0x01;

				pixels[y][x+4] = (bit1 << 1) | bit0;
			}
			readOffset++;

			for (let x2 = 0; x2 < 4; x2++) {
				const bit0 = (rawData[readOffset] >> (7 - x2*2)) & 0x01;
				const bit1 = (rawData[readOffset] >> (7 - x2*2 - 1)) & 0x01;

				pixels[y][x2+0] = (bit1 << 1) | bit0;
			}
			readOffset++;
		}
		if (!defaultPalette)
			defaultPalette = new PaletteNGPC();
		return new this(pixels, defaultPalette);
	}

	export() {
		let writeOffset = 0;
		const data = new Array(16);
		for (let y = 0; y < 8; y++) {
			let byte0 = 0x00;
			for (let x = 0; x < 4; x++) {
				const colorIndex = this.getPixel(x, y);
				byte0 |= (colorIndex >> 1) << (7 - x*2);
				byte0 |= (colorIndex & 0x01) << (7 - x*2 - 1);
			}

			let byte1 = 0x00;
			for (let x2 = 0; x2 < 4; x2++) {
				const colorIndex = this.getPixel(x2 + 4, y);
				byte1 |= (colorIndex >> 1) << (7 - x2*2);
				byte1 |= (colorIndex & 0x01) << (7 - x2*2 - 1);
			}

			data[writeOffset++] = byte1;
			data[writeOffset++] = byte0;
		}
		return data;
	}
}

export const ConsoleGraphicsNGPC = {
	id:'ngpc',
	Color: ColorRGB12,
	Palette: PaletteNGPC,
	Tile: TileNGPC,
	Map: null
}