export class DataExporter {
	static Formatters = {
		'rgbds': {
			separatorLine:'',
			separator: ', ',
			comment: ';',
			prefixBytes: 'DB ',
			prefixWords: 'DW ',
			formatByte: function (byte) {
				return '$' + byte.toString(16).padStart(2, '0');
			},
			formatWord: function (word) {
				return '$' + word.toString(16).padStart(4, '0');
			}
		},
		'c': {
			separatorLine:',',
			separator: ', ',
			comment: '//',
			prefix: '[',
			prefixBytes: '\t',
			prefixWords: '\t',
			suffix: ']',
			formatByte: function (byte) {
				return '0x' + byte.toString(16).padStart(2, '0');
			},
			formatWord: function (word) {
				return '0x' + word.toString(16).padStart(4, '0');
			}
		},
		'hex': {
			separatorLine:'',
			separator: ' ',
			comment: '',
			prefixBytes: '',
			prefixWords: '',
			formatByte: function (byte) {
				return byte.toString(16).padStart(2, '0');
			},
			formatWord: function (word) {
				const byte1 = word & 0xff;
				const byte2 = word >> 8;
				return this.formatByte(byte1) + ' ' + this.formatByte(byte2)
			}
		}
	};


	static export(lineInfos, format, showComments = false) {
		if (!DataExporter.Formatters[format])
			throw new Error('invalid data exporter');

		const formatter = DataExporter.Formatters[format];

		var str = '';
		if (formatter.prefix && lineInfos.length)
			str += formatter.prefix + '\n';

		lineInfos.forEach((lineInfo, i) => {
			if (lineInfo.dataType === 'words') {
				if (formatter.prefixWords)
					str += formatter.prefixWords;

				str += lineInfo.data.map(byte => formatter.formatWord(byte)).join(formatter.separator);
			} else {
				if (formatter.prefixBytes)
					str += formatter.prefixBytes;

				str += lineInfo.data.map(byte => formatter.formatByte(byte)).join(formatter.separator);
			}
			if (formatter.separatorLine && i < lineInfos.length - 1)
				str += formatter.separatorLine;

			if (showComments && lineInfo.comment && formatter.comment)
				str += ' ' + formatter.comment + lineInfo.comment;

			str += '\n';
		});

		if (formatter.suffix && lineInfos.length)
			str += formatter.suffix + '\n';

		return str;
	}
}