"use strict";
exports.__esModule = true;
exports.TextRenderer = exports.jsDateToExcelDate = exports.excelDateToJSDate = exports.formatScientific = exports.formatInteger = exports.formatFixed = exports.applyScale = exports.formatLeftAlignedMaskedNumber = exports.formatMaskedNumber = exports.testCondition = void 0;
var parse_format_1 = require("./parse-format");
function testCondition(cond, n) {
    if (cond === null) {
        return true;
    }
    switch (cond.compare) {
        case '<>': return n != cond.value;
        case '=': return n === cond.value;
        case '<': return n < cond.value;
        case '<=': return n <= cond.value;
        case '>=': return n >= cond.value;
        case '>': return n > cond.value;
    }
}
exports.testCondition = testCondition;
function stringDisplay(p) {
    if (p.type === 'separator' && p.mask === ',') {
        return '';
    }
    else if (p.type === 'hidden') {
        return ''.padEnd((p.mask || '').length, ' ');
    }
    else {
        return p.mask || '';
    }
}
var separatorAt = function (i) { return (i > 0) && (i % 3 === 0); };
function formatMaskedNumber(f, s, thousandSeparator) {
    var sMasked = '';
    s = s.replace(/^0+/, '');
    if (f.firstReserved !== null) {
        s = s.padStart(f.totalPositions - f.firstReserved, '0');
    }
    var dStart = 0;
    var dEnd = s.length - f.totalPositions + 1;
    for (var _i = 0, _a = f.parts; _i < _a.length; _i++) {
        var p = _a[_i];
        switch (p.type) {
            case 'digit':
                if (dStart < s.length) {
                    for (; dStart < dEnd; ++dStart) {
                        sMasked += s[dStart];
                        if (separatorAt(s.length - dStart - 1)) {
                            sMasked += thousandSeparator || '';
                        }
                    }
                    if (dEnd > 0) {
                        dStart = dEnd;
                    }
                    ++dEnd;
                }
                break;
            default:
                sMasked += stringDisplay(p);
                break;
        }
    }
    return sMasked;
}
exports.formatMaskedNumber = formatMaskedNumber;
function formatLeftAlignedMaskedNumber(f, s) {
    var sMasked = '';
    s = s.replace(/0+$/, '');
    if (f.lastReserved !== null) {
        s = s.padEnd(f.lastReserved + 1, '0');
    }
    var dPos = 0;
    for (var _i = 0, _a = f.parts; _i < _a.length; _i++) {
        var p = _a[_i];
        switch (p.type) {
            case 'digit':
                if (dPos < s.length) {
                    sMasked += s[dPos++];
                }
                break;
            default:
                sMasked += stringDisplay(p);
                break;
        }
    }
    return sMasked;
}
exports.formatLeftAlignedMaskedNumber = formatLeftAlignedMaskedNumber;
function applyScale(f, n) {
    var x = 2 * (f.numPercentSymbols || 0) - 3 * (f.numTrailingCommas || 0);
    return (x !== 0) ? n * Math.pow(10, x) : n;
}
exports.applyScale = applyScale;
function formatFixed(f, n) {
    n = applyScale(f, n);
    var _a = Math.abs(n).toFixed(f.decimal.totalPositions).split('.'), int = _a[0], dec = _a[1];
    var sig = n < 0 ? '-' : '';
    int = formatMaskedNumber(f.int, int, f.thousandSeparator);
    dec = formatLeftAlignedMaskedNumber(f.decimal, dec.replace(/0+$/, ''));
    return "" + sig + int + "." + dec;
}
exports.formatFixed = formatFixed;
function formatInteger(f, n) {
    n = applyScale(f, n);
    var sig = n < 0 ? '-' : '';
    return sig + formatMaskedNumber(f.int, Math.abs(n).toFixed(0), f.thousandSeparator);
}
exports.formatInteger = formatInteger;
function formatScientific(f, n) {
    var alignment = f.mantissa.int.totalPositions;
    var exponent = 0;
    if (alignment) {
        exponent = alignment * Math.floor(Math.log10(Math.abs(n)) / alignment);
    }
    else {
        exponent = Math.ceil(Math.log10(n));
    }
    n *= Math.pow(10, -exponent);
    var s = '';
    if (f.mantissa.type == 'fixed') {
        s = formatFixed(f.mantissa, n);
    }
    else {
        s = formatInteger(f.mantissa, n);
    }
    s += 'E' + (exponent >= 0 ? (f.exponent.sign === '+' ? '+' : '') : '-');
    s += formatMaskedNumber(f.exponent.mask, Math.abs(exponent).toFixed(0), '');
    return s;
}
exports.formatScientific = formatScientific;
function continuedFractionSearch(n, denominatorLimit) {
    var p0 = 0, q0 = 1, p1 = 1, q1 = 0;
    var af = n;
    var quotients = [];
    for (var i = 0; i < 20; ++i) {
        var a = Math.floor(af);
        var q2 = q0 + a * q1;
        var p2 = p0 + a * p1;
        if (q2 > denominatorLimit) {
            break;
        }
        p0 = p1;
        q0 = q1;
        p1 = p2;
        q1 = q2;
        if (af == a) {
            return { intPart: ~~n, numerator: p1 % q1, denominator: q1 };
        }
        af = 1 / (af - a);
    }
    if (Math.abs(p1 / q1 - n) < Math.abs(p0 / q0 - n)) {
        return { intPart: ~~n, numerator: p1 % q1, denominator: q1 };
    }
    else {
        return { intPart: ~~n, numerator: p0 % q0, denominator: q0 };
    }
}
function fixedFractionSearch(n, denominator) {
    var numerator = Math.round(Math.abs(n) * denominator);
    var intPart = numerator / denominator;
    numerator -= intPart * denominator;
    return { intPart: intPart, numerator: numerator, denominator: denominator };
}
function formatFraction(f, n) {
    var s = n < 0 ? '-' : '';
    var _a = f.fraction, numerator = _a.numerator, denominator = _a.denominator;
    var denominator_s;
    var v;
    n = Math.abs(n);
    if (typeof denominator === 'object') {
        v = continuedFractionSearch(n, Math.pow(10, denominator.totalPositions) - 1);
        denominator_s = formatMaskedNumber(denominator, v.denominator.toFixed(), '');
    }
    else {
        v = fixedFractionSearch(n, denominator);
        denominator_s = denominator.toFixed(0);
    }
    if (f.int) {
        s += formatMaskedNumber(f.int, v.intPart.toFixed(0), '');
    }
    else {
        v.numerator += v.denominator * v.intPart;
        v.intPart = 0;
    }
    s += formatMaskedNumber(numerator, v.numerator.toFixed(0), '');
    s += '/' + denominator_s;
    return s;
}
var weekDays = [
    'Sunday', 'Monday', 'Tueseday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];
var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
];
function ampm(date) {
    return (((date.getUTCHours() + 23) % 24) < 12) ? 'am' : 'pm';
}
function excelDateToJSDate(days) {
    return new Date(Math.round((days - 25569) * 864e5));
}
exports.excelDateToJSDate = excelDateToJSDate;
function jsDateToExcelDate(d) {
    return d.getTime() / 86400 + 25569;
}
exports.jsDateToExcelDate = jsDateToExcelDate;
var excelDateOrigin = excelDateToJSDate(0).getTime();
function formatDate(f, date) {
    return f.parts.map(function (t) {
        switch (t.type) {
            case 'time':
                switch (t.mask) {
                    case 'm':
                    case 'mm':
                        return date.getUTCMinutes().toString().padStart(t.mask.length, '0');
                    case 'h':
                    case 'hh':
                        return ((f.clockHours === 12)
                            ? (((date.getUTCHours() + 11) % 12) + 1)
                            : date.getUTCHours()).toString().padStart(t.mask.length, '0');
                    case 's':
                    case 'ss':
                        return date.getUTCSeconds().toString().padStart(t.mask.length, '0');
                    case '.0':
                        return (date.getUTCMilliseconds() / 1000).toFixed(t.zfill).substring(1);
                    case '[s]':
                        return Math.floor((date.getTime() - excelDateOrigin) / 1e3).toString().padStart(t.zfill, '0');
                    case '[m]':
                        return Math.floor((date.getTime() - excelDateOrigin) / 6e4).toString().padStart(t.zfill, '0');
                    case '[h]':
                        return Math.floor((date.getTime() - excelDateOrigin) / 3.6e6).toString().padStart(t.zfill, '0');
                    case 'am/pm':
                        return ampm(date);
                    case 'a/p':
                        return ampm(date)[0];
                    default:
                        throw TypeError('Invalid time mask: ' + JSON.stringify(t));
                }
            case 'date':
                switch (t.mask) {
                    case 'yyyy':
                    case 'eeee':
                        return date.getUTCFullYear().toString();
                    case 'yy':
                    case 'ee':
                        return (date.getUTCFullYear() % 100).toString();
                    case 'm':
                    case 'mm':
                        return (date.getUTCMonth() + 1).toString().padStart(t.mask.length, '0');
                    case 'd':
                    case 'dd':
                        return date.getUTCDate().toString().padStart(t.mask.length, '0');
                    case 'ddd':
                        return weekDays[date.getUTCDay()].substr(0, 3);
                    case 'dddd':
                        return weekDays[date.getUTCDay()];
                    case 'mmm':
                        return monthNames[date.getUTCMonth()].substr(0, 3);
                    case 'mmmm':
                        return monthNames[date.getUTCMonth()];
                    case 'mmmmm':
                        return monthNames[date.getUTCMonth()][0];
                    default:
                        throw TypeError('Invalid date mask: ' + JSON.stringify(t));
                }
            case 'hidden':
                return ' ';
            case 'literal':
                return t.mask;
            default:
                throw TypeError('Invalid token type for date: ' + t.type);
        }
    }).join('');
}
function applyFormat(f, n) {
    switch (f.type) {
        case 'scientific':
            return formatScientific(f, n);
        case 'fixed':
            return formatFixed(f, n);
        case 'integer':
            return formatInteger(f, n);
        case 'fraction':
            return formatFraction(f, n);
        case 'datetime':
            return formatDate(f, excelDateToJSDate(n));
    }
    return n.toString();
}
function formatConditional(f, n) {
    for (var _i = 0, f_1 = f; _i < f_1.length; _i++) {
        var fi = f_1[_i];
        if (!fi.condition || testCondition(fi.condition, n)) {
            return applyFormat(fi.format, n);
        }
    }
    return n.toString();
}
var TextRenderer = (function () {
    function TextRenderer(format) {
        this._format_string = format;
        this._format_data = (0, parse_format_1.parse)(format);
    }
    TextRenderer.prototype.formatNumber = function (n) {
        return formatConditional(this._format_data, n);
    };
    TextRenderer.prototype.formatDate = function (d) {
        return formatConditional(this._format_data, jsDateToExcelDate(d));
    };
    return TextRenderer;
}());
exports.TextRenderer = TextRenderer;
//# sourceMappingURL=text-renderer.js.map