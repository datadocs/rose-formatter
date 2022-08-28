import { Condition, FixedFormat, IntegerFormat, MaskedNumber, ScientificFormat, MultiFormat } from './parse-format2';
export declare function testCondition(cond: Condition, n: number): boolean;
export declare function formatMaskedNumber(f: MaskedNumber, s: string, thousandSeparator: string): string;
export declare function formatLeftAlignedMaskedNumber(f: MaskedNumber, s: string): string;
export declare function applyScale(f: FixedFormat | IntegerFormat, n: number): number;
export declare function formatFixed(f: FixedFormat, n: number): string;
export declare function formatInteger(f: IntegerFormat, n: number): string;
export declare function formatScientific(f: ScientificFormat, n: number): string;
export declare function excelDateToJSDate(days: number): Date;
export declare function jsDateToExcelDate(date: Date): number;
export declare class TextRenderer {
    _format_string: string;
    _format_data: MultiFormat;
    constructor(format: string);
    formatNumber(n: number): string;
}
