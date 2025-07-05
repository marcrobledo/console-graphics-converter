/**
	@file webapp that converts a PNG image into valid retro consoles graphics data
	@author Marc Robledo
	@version 1.0
	@copyright 2022-2025 Marc Robledo
	@license
	This file is released under MIT License
	Copyright (c) 2025 Marc Robledo

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

 */

import * as cash from './cash.min.js';
import { DataExporter } from './data-exporter.js';
import { ConsoleGraphicsDMG, ConsoleGraphicsCGB } from './console-graphics.gb.js';
import { ConsoleGraphicsSNES } from './console-graphics.snes.js';
import { ConsoleGraphicsNGPC } from './console-graphics.ngpc.js';
import { Tileset, ColorRGB15 } from './console-graphics.js';


/* extend Number class */
Number.prototype.toHex8 = function () {
	if (this < 16)
		return '0' + this.toString(16);
	return this.toString(16);
}
Number.prototype.toHex16 = function (forceDigits) {
	if (forceDigits) {
		var val = this.toString(16);
		while (val.length < forceDigits)
			val = '0' + val;
		return val;
	} else if (this < 16)
		return '000' + this.toString(16);
	else if (this < 256)
		return '00' + this.toString(16);
	else if (this < 4096)
		return '0' + this.toString(16);
	return this.toString(16);
}
Number.toUnsigned8 = function (s8) {
	if (u8 & 0x80) {
		return -((~s8 & 0x7f) + 1);
	}
	return u8;
},
Number.toSigned8 = function toSigned8(u8) {
	if (u8 < 0) {
		return -((~u8 & 0x7f) + 1);
	}
	return u8;
}





const _newCanvas = function (imageData, className) {
	var canvas = document.createElement('canvas');
	canvas.className = 'tile ' + className;
	canvas.width = 8;
	canvas.height = 8;
	return _refreshCanvas(canvas, imageData);
};
const _refreshCanvas = function (canvas, imageData) {
	canvas.getContext('2d').putImageData(imageData, 0, 0);
	return canvas;
};

var _createRowOption = function (octicon, title, onClick, obj) {
	var btn = document.createElement('button');
	btn.className = 'btn btn-transparent';
	btn.title = title;
	btn.addEventListener('click', onClick.bind(obj));
	btn.obj = obj;
	var img = new Image();
	img.src = 'assets/octicon_' + octicon + '.svg';
	img.className = 'octicon';
	btn.appendChild(img);
	return btn;
};





var currentExportInfo;
const refreshExportCurrent = function () {
	var showComments = $('#checkbox-comments').get(0).checked;
	var format = $('input[name="export-format"]:checked').val();

	const str = DataExporter.export(currentExportInfo, format, showComments);

	$('#textarea-export').html(str);
	if (!document.getElementById('modal-export').open) {
		document.getElementById('modal-export').showModal();
		/* select textarea text */
		document.getElementById('textarea-export').select();
	}
}

const refreshExportTiles = function () {
	currentExportInfo = currentTileset.tiles.map(function (tile, i) {
		return {
			dataType: 'bytes',
			data: tile.export(),
			comment: 'Tile ' + i.toHex8()
		}
	});	

	refreshExportCurrent();
}
const refreshExportPalettes = function () {
	currentExportInfo = currentTileset.palettes.map(function (palette, i) {
		const dataType=currentTileset.consoleGraphics.Color.DATA_SIZE===2? 'words' : 'bytes';
		return {
			dataType,
			data: palette.export(),
			comment: 'Palette ' + i
		}
	});
	refreshExportCurrent();
}
const refreshExportMap = function () {
	try{
		if(!currentMap.checkValidIndexes())
			throw new Error('Map contains invalid tile indexes (greater than 0xff)');

		currentExportInfo = currentMap.export().map(function (bytes, i) {
			return {
				dataType: 'bytes',
				data: bytes,
				comment: 'Row ' + i
			}
		});
		refreshExportCurrent();
	}catch(ex){
		alert('Error exporting map: ' + ex.message);
	}
}
const refreshExportAttributes = function () {
	try{
		if(!currentMap.checkValidIndexes())
			throw new Error('Map contains invalid tile indexes (greater than 0xff)');

		currentExportInfo = currentMap.exportAttributes().map(function (bytes, i) {
			return {
				dataType: 'bytes',
				data: bytes,
				comment: 'Row ' + i
			}
		});
		refreshExportCurrent();
	}catch(ex){
		alert('Error exporting map: ' + ex.message);
	}
}




const _copyToClipboard = function (lineInfos) {
	var showComments = $('#checkbox-comments').get(0).checked;
	var format = $('input[name="export-format"]:checked').val();

	const str = DataExporter.export(lineInfos, format, showComments).trim();

	navigator.clipboard.writeText(str).then(function () {
		//toast
	}, function (err) {
		console.error('Async: Could not copy text: ', err);
	});
}
const _evtClickCopyClipboardPalette = function (evt) {
	_copyToClipboard([{
		dataType: 'words',
		data: this.export(),
		comment: 'Palette '
	}]);
};

const _evtClickCopyClipboardTile = function (evt) {
	_copyToClipboard([{
		dataType: 'bytes',
		data: this.export(),
		comment: 'Tile '
	}]);
};














var currentEditingItem;
var currentHighlightedPalette;


var currentTab;
const showTab=function(tabId, refreshTileset, refreshEverything){
	const TABS=['palettes','tiles','map'];
	if(!TABS.includes(tabId) || (!refreshEverything && currentTab===tabId))
		return false;

	currentTab=tabId;
	
	TABS.forEach(function(tabId){
		if(currentTab===tabId){
			$('#btn-tab-'+tabId).addClass('selected');
			$('#tab-'+tabId).show();
		}else{
			$('#btn-tab-'+tabId).removeClass('selected');
			$('#tab-'+tabId).hide();
		}
	});
	_refreshCurrentTab(refreshTileset);
};

const _refreshCurrentTab=function(refreshTileset){
	if(refreshTileset)
		_refreshTileset();

	if(currentTab==='palettes'){
		_refreshPalettes();
	}else if(currentTab==='tiles'){
		_refreshPinnedPaletteMessage();
		_refreshTiles();
		_refreshQuantizeButton();
	}else if(currentTab==='map'){
		_refreshMap();
	}
};


const _refreshPalettes = function () {
	$('#palettes').empty();
	for (var i = 0; i < currentTileset.palettes.length; i++) {
		var colorPickers = $('<div></div>');
		for (var j = 0; j < currentTileset.palettes[i].colors.length; j++) {
			const span = $('<span></span>').addClass('color').css('background-color', '#' + currentTileset.palettes[i].colors[j].toHex24());
			span
				.addClass('clickable')
				.attr('title', currentTileset.palettes[i].colors[j].toHex())
				.attr('data-palette', i)
				.attr('data-color', j)
				.on('click', function (evt) {
					currentEditingItem = currentTileset.palettes[parseInt($(this).attr('data-palette'))].colors[parseInt($(this).attr('data-color'))];
					const paletteIndex = parseInt($(this).attr('data-palette'));
					const colorIndex = parseInt($(this).attr('data-color'));
					openPopover(evt, 'color', function (color) {
						$('#btn-popover-color-edit').prop('disabled', !(currentTileset.palettes[paletteIndex].colors[colorIndex] instanceof ColorRGB15));
						$('#btn-popover-color-left').prop('disabled', colorIndex === 0);
						$('#btn-popover-color-right').prop('disabled', colorIndex === currentTileset.palettes[paletteIndex].colors.length - 1);
					}, currentTileset.palettes[paletteIndex].colors[colorIndex]);

				})
			colorPickers.append(span);
		}

		var row = $('<div></div>')
			.addClass('row mono')
			.append(
				$('<div></div>')
					.append(_newCanvas(currentTileset.palettes[i].toImageData(), 'tile-palette'))
					.append($('<span></span>').html('Palette ' + i))
			)
			.append(
				$('<div></div>')
					.append(colorPickers)
			)
			.append(
				$('<div></div>')
					.addClass('row-options text-right')
					.append(
						_createRowOption('copy', 'Copy code to clipboard', _evtClickCopyClipboardPalette, currentTileset.palettes[i])
					)
					.append(
						_createRowOption('kebab_horizontal', 'Palette options', function (evt) {
							openPopover(evt, 'palette', function (palette) {
								const paletteIndex = currentTileset.palettes.indexOf(palette);
								$('#btn-popover-palette-up').prop('disabled', paletteIndex === 0);
								$('#btn-popover-palette-down').prop('disabled', paletteIndex === currentTileset.palettes.length - 1);

								const manyPalettes = currentTileset.palettes.length === 1;
								$('#btn-popover-palette-pin, #btn-popover-palette-remove').prop('disabled', manyPalettes);
								currentEditingItem = palette;
							}, this);
						}, currentTileset.palettes[i])
					)
			)
			;
		if(currentHighlightedPalette && currentHighlightedPalette===currentTileset.palettes[i])
			$(row).addClass('highlight');
		$('#palettes').append(row);

	}
}


const _buildAlternateTilePalettes = function (tileIndex) {
	const tile = currentTileset.tiles[tileIndex];
	const possibleCanvases = tile.alternateTiles.sort((a, b) => currentTileset.palettes.indexOf(a.defaultPalette) - currentTileset.palettes.indexOf(b.defaultPalette))
		.map(function (alternateTile, i) {
			const canvas = _newCanvas(alternateTile.defaultPalette.toImageData(), 'tile-palette');
			if (tile.alternateTiles.length > 1 && tile !== tile.alternateTiles[i]) {
				$(canvas).addClass('clickable').on('click', function (evt) {
					currentTileset.tiles[tileIndex] = tile.alternateTiles[i];
					_refreshCurrentTab();
				});
			}
			return canvas;
		});
	return possibleCanvases
};

const _refreshTiles = function () {
	$('#tiles').empty();
	for (var i = 0; i < currentTileset.tiles.length; i++) {
		if(currentHighlightedPalette && currentTileset.tiles[i].defaultPalette!==currentHighlightedPalette)
			continue;

		const possibleCanvases = _buildAlternateTilePalettes(i);


		var row = $('<div></div>')
			.addClass('row mono')
			.append(
				$('<div></div>')
					.append(_newCanvas(currentTileset.tiles[i].toImageData(currentTileset.tiles[i].defaultPalette)), 'tile-tile')
					.append($('<span></span>').html('Tile ' + i.toHex8()))
			)
			.append(
				$('<div></div>')
					.addClass('container-tile-palette')
					.append(possibleCanvases)
					.append($('<span></span>').html('Pal. ' + currentTileset.palettes.indexOf(currentTileset.tiles[i].defaultPalette)))

			)
			.append(
				$('<div></div>')
					.addClass('row-options text-right')
					.append(
						_createRowOption('copy', 'Copy code to clipboard', _evtClickCopyClipboardTile, currentTileset.tiles[i])
					)
					.append(
						_createRowOption('kebab_horizontal', 'Tile options', function (evt) {
							openPopover(evt, 'tile', function (tile) {
								const tileIndex = currentTileset.tiles.indexOf(tile);
								$('#btn-popover-tile-up').prop('disabled', !currentHighlightedPalette && tileIndex === 0);
								$('#btn-popover-tile-down').prop('disabled', !currentHighlightedPalette && tileIndex === currentTileset.tiles.length - 1);

								const manyTiles = currentTileset.tiles.length === 1;
								$('#btn-popover-tile-remove').prop('disabled', manyTiles);
								currentEditingItem = tile;
							}, this);
						}, currentTileset.tiles[i])
					)
			)
			;
		$('#tiles').append(row);
		//$('#tiles').append(DataExporter.tile(, i));
	}
}



const _quantizeMap = function (map, quantizableTiles) {
	quantizableTiles.forEach((quantizableTileInfo, i) => {
		const tileToRemove=quantizableTileInfo;
		const tileToReplace=quantizableTileInfo.duplicateFrom;
		const flippedInfo=tileToReplace.equalsFlipped(tileToRemove);
		const flipX = typeof flippedInfo==='object'? !!flippedInfo.flipX : false;
		const flipY = typeof flippedInfo==='object'? !!flippedInfo.flipY : false;
		map.replaceMapTiles(tileToRemove, tileToReplace, flipX, flipY);
	});
}
const _refreshMap = function () {
	if(currentMap){
		const imageData=currentMap.toImageData();
		const canvas = document.createElement('canvas');
		canvas.className = 'map';
		canvas.width = imageData.width;
		canvas.height = imageData.height;
		$('#map').empty().append(canvas);
		$('#span-map-width').html(currentMap.width);
		$('#span-map-height').html(currentMap.height);
		return _refreshCanvas(canvas, imageData);
	}else{
		document.getElementById('btn-export-map2').disabled = true;
		document.getElementById('btn-export-map').disabled = true;
		document.getElementById('btn-export-attributes2').disabled = true;
		document.getElementById('btn-export-attributes').disabled = true;

		return false;
	}
}



const _refreshTileset = function () {
	const imageData = currentTileset.toImageData();
	const canvas = document.getElementById('canvas-tileset');
	canvas.width = imageData.width;
	canvas.height = imageData.height;
	canvas.getContext('2d').putImageData(imageData, 0, 0);
}




var currentQuantizableTiles;
const _refreshQuantizeButton = function () {
	currentQuantizableTiles = currentTileset.getQuantizableTiles();
	if(currentQuantizableTiles){
		$('#span-quantize').html(currentQuantizableTiles.length);
		$('#btn-quantize').show();
	}else{
		$('#btn-quantize').hide();
	}
}
const _refreshPinnedPaletteMessage = function () {
	if(currentHighlightedPalette){
		$('#message-pinned-palette-index').html(currentTileset.palettes.indexOf(currentHighlightedPalette));
		$('#message-pinned-palette').show();
	}else{
		$('#message-pinned-palette').hide();
	}
}




var currentConsoleFormat, currentTileset, currentTilesetName, currentMap;
const _setTileset = function (parsedTileset, fileName) {
	$('#intro').hide();
	$('#app').removeClass('hide');
	currentTileset = parsedTileset.tileset;
	currentTilesetName = fileName;
	currentMap = parsedTileset.map;
	currentHighlightedPalette=null;
	

	if (parsedTileset.warnings.length) {
		$('#ul-warnings').empty();
		parsedTileset.warnings.forEach(function (warning) {
			const li = document.createElement('li');
			li.className = 'mono';
			const span = document.createElement('span');
			span.innerHTML = `column ${warning.x}, row ${warning.y}`
			li.appendChild(_newCanvas(warning.imageData, 'tile-tile'));
			li.appendChild(span);
			$('#ul-warnings').append(li);
		});
		$('#max-colors').html(parsedTileset.consoleGraphics.Palette.SIZE);
		$('#warnings').show();
	} else {
		$('#warnings').hide();
	}
	showTab('tiles', true, true);
}





const openPopover = function (evt, popoverId, callback, callBackParam) {
	evt.stopPropagation();
	const triggeredBy = $(evt.target).closest('button, span.color');
	const pos = triggeredBy.offset();
	$('#popover').children().each(function(i, elem){
		if(elem.id==='popover-'+popoverId)
			$(elem).removeClass('hide');
		else
			$(elem).addClass('hide');
	});
	$('#popover').removeClass('hide').css({
		position: 'absolute',
		top: pos.top + triggeredBy.height(),
		left: pos.left - $('#popover').width() + triggeredBy.width()
	});

	if (typeof callback === 'function') {
		callback(callBackParam);
	}
}




const ConsoleGraphicsMap = {
	'dmg': ConsoleGraphicsDMG,
	'cgb': ConsoleGraphicsCGB,
	'sfc': ConsoleGraphicsSNES,
	'ngpc': ConsoleGraphicsNGPC
}



/* I build the app icon using the own app, isn't it amazing? */
const appIcon=document.createElement('canvas');
appIcon.width=8;
appIcon.height=8;
appIcon.id='app-icon';
appIcon.getContext('2d').putImageData((new ConsoleGraphicsCGB.Palette([
	ColorRGB15.fromRGB24(233, 233, 233),
	ColorRGB15.fromRGB24(164, 207, 50),
	ColorRGB15.fromRGB24(206, 26, 85),
	ColorRGB15.fromRGB24(41, 42, 40)
])).toImageData(), 0, 0);




$(document).ready(function (evt) {
	//AppSettings.reset();
	document.querySelector('header').insertBefore(appIcon, document.querySelector('header img'));


	/* UI events */
	$('#intro-console-selector button[data-console]').on('click', function (evt) {
		currentConsoleFormat=this.getAttribute('data-console');
		$('#input-file').trigger('click');
	});
	$(window).on('keyup', function (evt) {
		if (evt.keyCode === 27) //escape
			$('.popover').addClass('hide');
	});
	$(document.body).on('click', function (evt) {
		$('.popover').addClass('hide');
	});




	$('#span-remove-pinned-palette').on('click', function (evt) {
		currentHighlightedPalette=null;
		showTab('tiles', false, true);
	});



	$('#canvas-tileset').on('mousedown', function(evt){
		if(evt.button===0){
			const rect=this.getBoundingClientRect();
	
			const col=Math.floor((evt.clientX - rect.left) / 16);
			const row=Math.floor((evt.clientY - rect.top) / 16);

			const embeddedPalettesRows=Math.ceil(currentTileset.palettes.length / 16);
			if(row<embeddedPalettesRows){
				const paletteIndex=col + row*16;
				if(paletteIndex<currentTileset.palettes.length){
					showTab('palettes');
					//alert('Palette index: $'+paletteIndex.toHex8());
					const paletteRow=document.getElementById('palettes').children[paletteIndex];
					paletteRow.scrollIntoView({
						behaviour:'smooth',
						block:'center'
					});
					paletteRow.classList.remove('highlight-fade');
					void paletteRow.offsetWidth;
					paletteRow.classList.add('highlight-fade');
				}
			}else{
				const tileIndex=col + (row - embeddedPalettesRows)*16;
				if(tileIndex<currentTileset.tiles.length){
					showTab('tiles');
					//alert('Tile index: $'+tileIndex.toHex8());
					const tileRow=document.getElementById('tiles').children[tileIndex];
					tileRow.scrollIntoView({
						behaviour:'smooth',
						block:'center'
					});
					tileRow.classList.remove('highlight-fade');
					void tileRow.offsetWidth;
					tileRow.classList.add('highlight-fade');
				}
			}
		}
	});

	$('#btn-popover-palette-pin').on('click', function (evt) {
		if(currentHighlightedPalette!==currentEditingItem){
			currentHighlightedPalette=currentEditingItem;
			$('#btn-quantize').prop('disabled', true);
		}else{
			currentHighlightedPalette=null;
			$('#btn-quantize').prop('disabled', false);
		}
		showTab('tiles');
	});
	$('#btn-popover-palette-down').on('click', function (evt) {
		const paletteIndex = currentTileset.palettes.indexOf(currentEditingItem);
		currentTileset.swapPalettes(paletteIndex, paletteIndex + 1);
		_refreshCurrentTab(true);
	});
	$('#btn-popover-palette-up').on('click', function (evt) {
		const paletteIndex = currentTileset.palettes.indexOf(currentEditingItem);
		currentTileset.swapPalettes(paletteIndex, paletteIndex - 1);
		_refreshCurrentTab(true);
	});


	$('#btn-popover-color-edit').on('click', function (evt) {
		$('#converter-rgb15').val(currentEditingItem.toHex()).trigger('input');
		document.getElementById('modal-converter').showModal();
		$('#converter-rgb15').trigger('focus').get(0).select();
	});
	$('#btn-popover-color-left').on('click', function (evt) {
		const palette = currentTileset.palettes.find(palette => palette.colors.includes(currentEditingItem));
		const colorIndex = palette.colors.indexOf(currentEditingItem);
		const temp = palette.colors[colorIndex];
		palette.colors[colorIndex] = palette.colors[colorIndex - 1];
		palette.colors[colorIndex - 1] = temp;

		currentTileset.tiles.forEach(function (tile) {
			tile.alternateTiles.filter(tile => tile.defaultPalette === palette).forEach(function (tile) {
				tile.swapColors(colorIndex, colorIndex - 1);
			});
		});
		_refreshCurrentTab(true);
	});
	$('#btn-popover-color-right').on('click', function (evt) {
		const palette = currentTileset.palettes.find(palette => palette.colors.includes(currentEditingItem));
		const colorIndex = palette.colors.indexOf(currentEditingItem);
		const temp = palette.colors[colorIndex];
		palette.colors[colorIndex] = palette.colors[colorIndex + 1];
		palette.colors[colorIndex + 1] = temp;

		currentTileset.tiles.forEach(function (tile) {
			tile.alternateTiles.filter(tile => tile.defaultPalette === palette).forEach(function (tile) {
				tile.swapColors(colorIndex, colorIndex + 1);
			});
		});
		_refreshCurrentTab(true);
	});

	/* tabs */
	$('#btn-tab-palettes, #btn-tab-tiles, #btn-tab-map').on('click', function(evt){
		showTab(this.id.substr(8));
	});



	$('#btn-popover-tile-down').on('click', function (evt) {
		const tileIndex = currentTileset.tiles.indexOf(currentEditingItem);
		currentTileset.swapTiles(tileIndex, tileIndex + 1);
		_refreshCurrentTab(true);
	});
	$('#btn-popover-tile-up').on('click', function (evt) {
		const tileIndex = currentTileset.tiles.indexOf(currentEditingItem);
		currentTileset.swapTiles(tileIndex, tileIndex - 1);
		_refreshCurrentTab(true);
	});
	$('#btn-popover-tile-remove').on('click', function (evt) {
		const tileIndex = currentTileset.tiles.indexOf(currentEditingItem);
		currentTileset.removeTile(tileIndex);
		_refreshCurrentTab(true);
	});





	$('#btn-change-color').on('click', function (evt) {
		currentEditingItem.setRGB15(
			parseInt($('#converter-r5').val()),
			parseInt($('#converter-g5').val()),
			parseInt($('#converter-b5').val())
		);
		_refreshCurrentTab(true);
	});
	$('#btn-import').on('click', function (evt) {
		$('#input-file').trigger('click');
	});
	$('#input-file').on('change', function (evt) {
		try{
			if (this.files[0].type !== 'image/png')
				throw new TypeError('Invalid PNG image file');

			const consoleFormat = currentConsoleFormat;
			if (!ConsoleGraphicsMap[consoleFormat])
				throw new Error('ConsoleGraphicsMap: invalid console format');

			const img = new Image();
			img.onload = function (evt) {
				try{
					const canvas = document.createElement('canvas');
					canvas.width = this.width;
					canvas.height = this.height;
					const ctx = canvas.getContext('2d');
					ctx.drawImage(this, 0, 0);
					const imageData = ctx.getImageData(0, 0, this.width, this.height);
					URL.revokeObjectURL(this.src);

					const result = Tileset.fromImageData(imageData, ConsoleGraphicsMap[consoleFormat]);
					if(result.tileset.tiles.length>0xff && this.width!==128){
						/* too many tiles found, try to quantize */
						const quantizableTiles=result.tileset.getQuantizableTiles();
						if(quantizableTiles.length){
							result.tileset.removeTiles(quantizableTiles);
							if(result.map)
								_quantizeMap(result.map, quantizableTiles);
						}
					}


					if (!currentTileset) {
						if(result.map && typeof result.map.exportAttributes !== 'function'){
							$('#container-export-attributes').remove();
						}

						$('#logo-console').prop('src', 'assets/console_' + result.consoleGraphics.id + '.png').addClass('console-' + result.consoleGraphics.id);
					}

					const fileName = document.getElementById('input-file').files[0].name.replace(/\.[^.]*$/, '');
					_setTileset(result, fileName);
				}catch(ex2){
					alert('Error loading tileset: ' + ex2.message);
				}
			};
			img.src = URL.createObjectURL(this.files[0]);
		}catch(ex){
			alert('Error loading tileset: ' + ex.message);
		}
	});
	/* $('#btn-converter').on('click', function(evt){
		document.getElementById('modal-converter').showModal();
	}); */
	$('#btn-export-palettes').on('click', refreshExportPalettes);
	$('#btn-export-map').on('click', refreshExportMap);
	$('#btn-export-attributes').on('click', refreshExportAttributes);
	$('#btn-export-tiles').on('click', refreshExportTiles);
	$('#btn-export-tiles2').on('click', function () {
		const tilesData = currentTileset.tiles.map(tile => tile.export()).reduce((acc, tile) => {
			return acc.concat(tile);
		}, []);
		const u8array = new Uint8Array(tilesData);
		const blob = new Blob([u8array.buffer], { type: 'application/octet-stream' });
		saveAs(blob, currentTilesetName + '.bin');
	});
	$('#btn-export-palettes2').on('click', function () {
		let palettesData=currentTileset.palettes.map(palette => palette.export());
		if(currentTileset.consoleGraphics.Color.DATA_SIZE===2)
			palettesData=palettesData.map(((paletteData) => paletteData.map((colorData => [colorData & 0xff, (colorData >> 8) & 0xff])))).flat(2);

		const u8array = new Uint8Array(palettesData);
		const blob = new Blob([u8array.buffer], { type: 'application/octet-stream' });
		saveAs(blob, currentTilesetName + '_palettes.bin');
	});
	$('#btn-export-map2').on('click', function () {
		if(!currentMap.checkValidIndexes())
			throw new Error('Map contains invalid tile indexes (greater than 0xff)');
		const mapData = currentMap.export();
		const u8array = new Uint8Array(mapData);
		const blob = new Blob([u8array.buffer], { type: 'application/octet-stream' });
		saveAs(blob, currentTilesetName + '_map.bin');
	});
	$('#btn-export-attributes2').on('click', function () {
		const mapData = currentMap.exportAttributes();
		const u8array = new Uint8Array(mapData);
		const blob = new Blob([u8array.buffer], { type: 'application/octet-stream' });
		saveAs(blob, currentTilesetName + '_map_attributes.bin');
	});
	$('.btn-modal-close').on('click', function () {
		$(this).closest('dialog').get(0).close();
	});

	$('input[name="export-format"], #checkbox-comments').on('change', refreshExportCurrent);





	$('#btn-quantize').on('click', function(){
		if(!currentQuantizableTiles)
			throw new Error('no quantizable tiles found');

		currentTileset.removeTiles(currentQuantizableTiles);
		if(currentMap)
			_quantizeMap(currentMap, currentQuantizableTiles);

		_refreshCurrentTab(true);
	});



	/* load settings */
	AppSettings.load();
});












/**
 * App settings
 */
const AppSettings = (function () {
	const APP_ID = 'console-graphics-converter-settings';
	const settings={
		exportPalettesAsCode: true,
		exportTilesAsCode: false,
		exportMapAsCode: true
	};

	return{
		get:function(){
			return settings;
		},
		load:function(){
			if(typeof window.localStorage!=='object')
				return false;
			const loadedData=localStorage.getItem(APP_ID);
			if(loadedData){
				const parsedSettings=JSON.parse(loadedData);
				if(typeof parsedSettings.exportPalettesAsCode==='undefined')
					parsedSettings.exportPalettesAsCode=!!settings.exportPalettesAsCode;
				if(typeof parsedSettings.exportTilesAsCode==='undefined')
					parsedSettings.exportTilesAsCode=!!settings.exportTilesAsCode;
				if(typeof parsedSettings.exportMapAsCode==='undefined')
					parsedSettings.exportMapAsCode=!!settings.exportMapAsCode;
			}
		},
		save:function(){
			if(typeof window.localStorage!=='object')
				return false;
			localStorage.setItem(APP_ID, JSON.stringify(settings));
		},
		reset:function(){
			if(typeof window.localStorage!=='object')
				return false;
			localStorage.removeItem(APP_ID);
		}
	}
})();






/**
 * RGB15 <-> RGB24 color converter modal
 */
const RGB15Converter = (function () {
	const _refreshPreview = function (color) {
		document.getElementById('converter-color').style.backgroundColor = '#' + color.toHex24();
	}
	const _refreshComponents = function (color) {
		const rgb15 = color.toRGB15();
		document.getElementById('converter-r5').value = rgb15[0];
		document.getElementById('converter-g5').value = rgb15[1];
		document.getElementById('converter-b5').value = rgb15[2];
	}
	const _refreshRGB15 = function (color) {
		document.getElementById('converter-rgb15').value = color.toHex();
	}
	const _refreshRGB24 = function (color) {
		document.getElementById('converter-rgb24').value = color.toHex24();
	}

	$(document).ready(function (evt) {
		$('#converter-r5, #converter-g5, #converter-b5').on('keydown', function (evt) {
			if (!evt.shiftKey) {
				var val = parseInt(this.value);
				if (evt.keyCode === 38) { //up
					evt.preventDefault();
					if (isNaN(val))
						this.value = 0
					else if (val < 31)
						this.value = val + 1
					$(this).trigger('input');
				} else if (evt.keyCode === 40) { //down
					evt.preventDefault();
					if (isNaN(val))
						this.value = 31
					else if (val > 0)
						this.value = val - 1
					$(this).trigger('input');
				}
			}
		});
		$('#converter-r5, #converter-g5, #converter-b5').on('input', function (evt) {
			const val = parseInt(this.value.replace(/[^0-9]/g, ''));
			if (isNaN(val)) {
				this.value = 0;
			} else if (val > 31) {
				this.value = 31;
			} else if (this.value !== val.toString()) {
				this.value = val;
			}

			const r5 = parseInt(document.getElementById('converter-r5').value);
			const g5 = parseInt(document.getElementById('converter-g5').value);
			const b5 = parseInt(document.getElementById('converter-b5').value);

			const color = ColorRGB15.fromRGB15(r5, g5, b5);
			$('#converter-rgb15').val(color.toHex()).trigger('input');
		});
		$('#converter-input-color').on('change', function (evt) {
			const hex24 = this.value.toLowerCase().replace(/[^0-9a-f]/g, '');
			if (this.value !== hex24)
				this.value = hex24;

			if (!/^[0-9a-f]{6}$/.test(hex24))
				return;

			$('#converter-rgb24').val(hex24).trigger('input');
		});
		$('#converter-color').on('click', function (evt) {
			$('#converter-input-color').val('#' + $('#converter-rgb24').val());
			$('#converter-input-color').trigger('click');
		});

		$('#converter-rgb24').on('input', function (evt) {
			const hex24 = this.value.replace(/[^0-9a-f]/gi, '');
			if (this.value !== hex24)
				this.value = hex24;

			if (!/^[0-9a-f]{6}$/.test(hex24))
				return;

			const r8 = parseInt(hex24.substr(0, 2), 16);
			const g8 = parseInt(hex24.substr(2, 2), 16);
			const b8 = parseInt(hex24.substr(4, 2), 16);

			const color = ColorRGB15.fromRGB24(r8, g8, b8);
			_refreshComponents(color);
			_refreshRGB15(color);
			_refreshRGB24(color); //approximate to nearest RGB15
			_refreshPreview(color);
		});

		$('#converter-rgb15').on('input', function (evt) {
			const hex15 = this.value.replace(/[^0-9a-f]/gi, '');
			if (this.value !== hex15)
				this.value = hex15;

			if (!/^[0-9a-f]{4}$/.test(hex15))
				return;

			const color = new ColorRGB15(parseInt(hex15, 16));
			_refreshComponents(color);
			_refreshRGB24(color);
			_refreshPreview(color);
		});
	});
})();




/*
The MIT License

Copyright © 2016 Eli Grey. http://eligrey.com

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/

var _global = "object" == typeof window && window.window === window ? window : "object" == typeof self && self.self === self ? self : "object" == typeof global && global.global === global ? global : this; function bom(a, b) { return "undefined" == typeof b ? b = { autoBom: !1 } : "object" != typeof b && (console.warn("Deprecated: Expected third argument to be a object"), b = { autoBom: !b }), b.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type) ? new Blob([String.fromCharCode(65279), a], { type: a.type }) : a } function download(a, b, c) { var d = new XMLHttpRequest; d.open("GET", a), d.responseType = "blob", d.onload = function () { saveAs(d.response, b, c) }, d.onerror = function () { console.error("could not download file") }, d.send() } function corsEnabled(a) { var b = new XMLHttpRequest; b.open("HEAD", a, !1); try { b.send() } catch (a) { } return 200 <= b.status && 299 >= b.status } function click(a) { try { a.dispatchEvent(new MouseEvent("click")) } catch (c) { var b = document.createEvent("MouseEvents"); b.initMouseEvent("click", !0, !0, window, 0, 0, 0, 80, 20, !1, !1, !1, !1, 0, null), a.dispatchEvent(b) } } var isMacOSWebView = _global.navigator && /Macintosh/.test(navigator.userAgent) && /AppleWebKit/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent), saveAs = _global.saveAs || ("object" != typeof window || window !== _global ? function () { } : "download" in HTMLAnchorElement.prototype && !isMacOSWebView ? function (b, c, d) { var e = _global.URL || _global.webkitURL, f = document.createElementNS("http://www.w3.org/1999/xhtml", "a"); c = c || b.name || "download", f.download = c, f.rel = "noopener", "string" == typeof b ? (f.href = b, f.origin === location.origin ? click(f) : corsEnabled(f.href) ? download(b, c, d) : click(f, f.target = "_blank")) : (f.href = e.createObjectURL(b), setTimeout(function () { e.revokeObjectURL(f.href) }, 4E4), setTimeout(function () { click(f) }, 0)) } : "msSaveOrOpenBlob" in navigator ? function (b, c, d) { if (c = c || b.name || "download", "string" != typeof b) navigator.msSaveOrOpenBlob(bom(b, d), c); else if (corsEnabled(b)) download(b, c, d); else { var e = document.createElement("a"); e.href = b, e.target = "_blank", setTimeout(function () { click(e) }) } } : function (a, b, c, d) { if (d = d || open("", "_blank"), d && (d.document.title = d.document.body.innerText = "downloading..."), "string" == typeof a) return download(a, b, c); var e = "application/octet-stream" === a.type, f = /constructor/i.test(_global.HTMLElement) || _global.safari, g = /CriOS\/[\d]+/.test(navigator.userAgent); if ((g || e && f || isMacOSWebView) && "undefined" != typeof FileReader) { var h = new FileReader; h.onloadend = function () { var a = h.result; a = g ? a : a.replace(/^data:[^;]*;/, "data:attachment/file;"), d ? d.location.href = a : location = a, d = null }, h.readAsDataURL(a) } else { var i = _global.URL || _global.webkitURL, j = i.createObjectURL(a); d ? d.location = j : location.href = j, d = null, setTimeout(function () { i.revokeObjectURL(j) }, 4E4) } }); _global.saveAs = saveAs.saveAs = saveAs, "undefined" != typeof module && (module.exports = saveAs);
