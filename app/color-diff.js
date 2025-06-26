/* Calculate CIEDE2000 color difference, borrowed and adapted from https://github.com/markusn/color-diff */

/**
	@author Markus Ekholm
	@copyright 2012-2023 (c) Markus Ekholm <markus at botten dot org >
	@license Copyright (c) 2012-2023, Markus Ekholm
	All rights reserved.
	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:
	 * Redistributions of source code must retain the above copyright
		 notice, this list of conditions and the following disclaimer.
	 * Redistributions in binary form must reproduce the above copyright
		 notice, this list of conditions and the following disclaimer in the
		 documentation and/or other materials provided with the distribution.
	 * Neither the name of the author nor the
		 names of its contributors may be used to endorse or promote products
		 derived from this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL MARKUS EKHOLM BE LIABLE FOR ANY
	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * INTERNAL FUNCTIONS
 */

/**
* Returns c converted to labcolor. Uses bc as background color,
* defaults to using white as background color. Defaults to
* any color without an alpha channel being specified is treated
* as fully opaque (A=1.0)
* @param {RGBAColor} c
* @param {RGBAColor} [bc]
* @return {LabColor} c converted to LabColor
*/
var rgbaToLab = function (c, bc) {
	bc = normalize(bc || { R: 255, G: 255, B: 255 });
	c = normalize(c);
	let newC = c;

	if (c.A !== undefined) {
		newC = {
			R: bc.R + (c.R - bc.R) * c.A,
			G: bc.G + (c.G - bc.G) * c.A,
			B: bc.B + (c.B - bc.B) * c.A,
		};
	}

	return xyzToLab(rgbToXyz(newC));
}

/**
 * Returns c converted to XYZColor
 * @param {RGBAColorUc} c
 * @return {XYZColor} c
 */
var rgbToXyz = function (c) {
	// Based on http://www.easyrgb.com/index.php?X=MATH&H=02
	let R = (c.R / 255);
	let G = (c.G / 255);
	let B = (c.B / 255);

	if (R > 0.04045) R = Math.pow(((R + 0.055) / 1.055), 2.4);
	else R = R / 12.92;
	if (G > 0.04045) G = Math.pow(((G + 0.055) / 1.055), 2.4);
	else G = G / 12.92;
	if (B > 0.04045) B = Math.pow(((B + 0.055) / 1.055), 2.4);
	else B = B / 12.92;

	R *= 100;
	G *= 100;
	B *= 100;

	// Observer. = 2°, Illuminant = D65
	const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
	const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
	const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
	return { X, Y, Z };
}

/**
* Returns c converted to LabColor.
* @param {XYZColor} c
* @return {LabColor} c converted to LabColor
*/
var xyzToLab = function (c) {
	// Based on http://www.easyrgb.com/index.php?X=MATH&H=07
	const refY = 100.000;
	const refZ = 108.883;
	const refX = 95.047; // Observer= 2°, Illuminant= D65
	let Y = c.Y / refY;
	let Z = c.Z / refZ;
	let X = c.X / refX;
	if (X > 0.008856) X = Math.pow(X, 1 / 3);
	else X = (7.787 * X) + (16 / 116);
	if (Y > 0.008856) Y = Math.pow(Y, 1 / 3);
	else Y = (7.787 * Y) + (16 / 116);
	if (Z > 0.008856) Z = Math.pow(Z, 1 / 3);
	else Z = (7.787 * Z) + (16 / 116);
	const L = (116 * Y) - 16;
	const a = 500 * (X - Y);
	const b = 200 * (Y - Z);
	return { L, a, b };
}

/**
 * @param {RGBAColor} c
 * @returns {RGBAColorUc}
 */
var normalize = function (c) {
	let r, g, b, a;
	if ("R" in c) {
		r = c.R;
		g = c.G;
		b = c.B;
		a = c.A;
	} else {
		r = c.r;
		g = c.g;
		b = c.b;
		a = c.a;
	}

	/** @type {RGBAColorUc} */
	const normalizedC = { R: r, G: g, B: b };

	if (a !== undefined) normalizedC.A = a;
	return normalizedC;
}

/**
 * API FUNCTIONS
 */

/**
 *
 * @param {number} n
 * @returns {number}
 */
var degrees = function (n) {
	return n * (180 / Math.PI);
}

/**
 *
 * @param {number} n
 * @returns number
 */
var radians = function (n) {
	return n * (Math.PI / 180);
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
var hpF = function (x, y) { // (7)
	if (x === 0 && y === 0) return 0;
	else {
		const tmphp = degrees(Math.atan2(x, y));
		if (tmphp >= 0) return tmphp;
		else return tmphp + 360;
	}
}

/**
 *
 * @param {number} C1
 * @param {number} C2
 * @param {number} h1p
 * @param {number} h2p
 * @returns {number}
 */
var dhpF = function (C1, C2, h1p, h2p) { // (10)
	if (C1 * C2 === 0) return 0;
	else if (Math.abs(h2p - h1p) <= 180) return h2p - h1p;
	else if ((h2p - h1p) > 180) return (h2p - h1p) - 360;
	else if ((h2p - h1p) < -180) return (h2p - h1p) + 360;
	else throw (new Error());
}

/**
 *
 * @param {number} C1
 * @param {number} C2
 * @param {number} h1p
 * @param {number} h2p
 * @returns {number}
 */
var aHpF = function (C1, C2, h1p, h2p) { // (14)
	if (C1 * C2 === 0) return h1p + h2p;
	else if (Math.abs(h1p - h2p) <= 180) return (h1p + h2p) / 2.0;
	else if ((Math.abs(h1p - h2p) > 180) && ((h1p + h2p) < 360)) return (h1p + h2p + 360) / 2.0;
	else if ((Math.abs(h1p - h2p) > 180) && ((h1p + h2p) >= 360)) return (h1p + h2p - 360) / 2.0;
	else throw (new Error());
}





/**
* Returns diff between c1 and c2 using the CIEDE2000 algorithm
* @param {Color} c1
* @param {Color} c2
* @param {RGBAColor} [bc] background color
* @return {number} Difference between c1 and c2
*/
const ciede2000 = function (c1, c2, bc) {
	if ("R" in c1 || "r" in c1) {
		c1 = rgbaToLab(c1, bc);
	}

	if ("R" in c2 || "r" in c2) {
		c2 = rgbaToLab(c2, bc);
	}
	/**
	 * Implemented as in "The CIEDE2000 Color-Difference Formula:
	 * Implementation Notes, Supplementary Test Data, and Mathematical Observations"
	 * by Gaurav Sharma, Wencheng Wu and Edul N. Dalal.
	 */

	// Get L,a,b values for color 1
	const L1 = c1.L;
	const a1 = c1.a;
	const b1 = c1.b;

	// Get L,a,b values for color 2
	const L2 = c2.L;
	const a2 = c2.a;
	const b2 = c2.b;

	// Weight factors
	const kL = 1;
	const kC = 1;
	const kH = 1;

	/**
	 * Step 1: Calculate C1p, C2p, h1p, h2p
	 */
	const C1 = Math.sqrt(Math.pow(a1, 2) + Math.pow(b1, 2)); // (2)
	const C2 = Math.sqrt(Math.pow(a2, 2) + Math.pow(b2, 2)); // (2)

	const aC1C2 = (C1 + C2) / 2.0; // (3)

	const G = 0.5 * (1 - Math.sqrt(Math.pow(aC1C2, 7.0) /
		(Math.pow(aC1C2, 7.0) + Math.pow(25.0, 7.0)))); // (4)

	const a1p = (1.0 + G) * a1; // (5)
	const a2p = (1.0 + G) * a2; // (5)

	const C1p = Math.sqrt(Math.pow(a1p, 2) + Math.pow(b1, 2)); // (6)
	const C2p = Math.sqrt(Math.pow(a2p, 2) + Math.pow(b2, 2)); // (6)

	const h1p = hpF(b1, a1p); // (7)
	const h2p = hpF(b2, a2p); // (7)

	/**
	 * Step 2: Calculate dLp, dCp, dHp
	 */
	const dLp = L2 - L1; // (8)
	const dCp = C2p - C1p; // (9)

	const dhp = dhpF(C1, C2, h1p, h2p); // (10)
	const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(radians(dhp) / 2.0); // (11)

	/**
	 * Step 3: Calculate CIEDE2000 Color-Difference
	 */
	const aL = (L1 + L2) / 2.0; // (12)
	const aCp = (C1p + C2p) / 2.0; // (13)

	const aHp = aHpF(C1, C2, h1p, h2p); // (14)
	const T = 1 - 0.17 * Math.cos(radians(aHp - 30)) + 0.24 * Math.cos(radians(2 * aHp)) +
		0.32 * Math.cos(radians(3 * aHp + 6)) - 0.20 * Math.cos(radians(4 * aHp - 63)); // (15)
	const dRo = 30 * Math.exp(-(Math.pow((aHp - 275) / 25, 2))); // (16)
	const RC = Math.sqrt((Math.pow(aCp, 7.0)) / (Math.pow(aCp, 7.0) + Math.pow(25.0, 7.0)));// (17)
	const SL = 1 + ((0.015 * Math.pow(aL - 50, 2)) /
		Math.sqrt(20 + Math.pow(aL - 50, 2.0)));// (18)
	const SC = 1 + 0.045 * aCp;// (19)
	const SH = 1 + 0.015 * aCp * T;// (20)
	const RT = -2 * RC * Math.sin(radians(2 * dRo));// (21)
	const dE = Math.sqrt(Math.pow(dLp / (SL * kL), 2) + Math.pow(dCp / (SC * kC), 2) +
		Math.pow(dHp / (SH * kH), 2) + RT * (dCp / (SC * kC)) *
		(dHp / (SH * kH))); // (22)
	return dE;
}



/**
* Returns the pair of closest colors (excluding equal colors) in a given array of colors
* @param { RGBAColor[] } colors
* @return {color1: RGBAColor, color1Index: number, color2: RGBAColor, color2Index: number, diff: number}
*/
export const closestPair = function (colors) {
	let result = {
		color1: null,
		color1Index: -1,
		color2: null,
		color2Index: -1,
		diff: null
	};

	for (let i = 0; i < colors.length; i++) {
		const color1 = colors[i];
		for (let j = i + 1; j < colors.length; j++) {
			const color2 = colors[j];
			const colorDiff = ciede2000(color1, color2);

			if (colorDiff && (!result.color1 || colorDiff < result.diff)) {
				result.color1 = color1;
				result.color1Index = i;
				result.color2 = color2;
				result.color2Index = j;
				result.diff = colorDiff;
			}
		}
	}
	return result;
}