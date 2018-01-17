/**
 * @license
 * Copyright (c) 2015 Ninh Pham <nfam.dev@gmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */

export type Process = (input: string, arg?: any) => string;
export type Processors = { [name: string]: Process };

/**
 * Decribes the syntax error of provided expression.
 * @export
 * @class ExpressionError
 * @extends {Error}
 */
export class ExpressionError extends Error {
    public readonly json: any;
    public constructor(message: string, json: any) {
        super(message);
        this.json = json;
    }
}

/**
 * Describes the location of expression at which the input input did not match.
 * @class ExtractionError
 * @extends {Error}
 */
export class ExtractionError extends Error {
    public at: string;
    public constructor(at: string) {
        super('Provided input does not match the expression at ');
        this.at = at;
    }
}

function isError(result: any | ExtractionError): boolean {
    return (result instanceof Error);
}

// substring creates a view on original string instead of generating new one.
// Force to generate to reduce memory if the original string is too huge.
function avoidMemoryLeak(item: any): any {
    if (typeof item === 'string') {
        item = (' ' + item).substring(1);
    }
    else if (typeof item === 'object') {
        if (item instanceof Array) {
            for (let i = 0; i < item.length; i += 1) {
                item[i] = avoidMemoryLeak(item[i]);
            }
        }
        else {
            Object.keys(item).forEach((key) => {
                item[key] = avoidMemoryLeak(item[key]);
            });
        }
    }
    return item;
}

const messages = {
    arrayType: 'Property "array" must be an object.',
    containsType: 'Property "contains" must be a string.',
    dictionaryType: 'Property "dictionary" must be an object.',
    dictionaryValueType: 'Property "{name}" of dictionary must be an object.',
    elementType: 'Property "element" must be an object.',
    expressionType: 'Expression must be an object.',
    prefixType: 'Property "prefix" must be either a string or an array of strings.',
    processType: 'Property "process" must be a string, an object, an array of string or object.',
    processNameMissing: 'Property "name" of process object is missing.',
    processNameType: 'Property "name" of process object must be a string.',
    processUndefined: 'Process "{name}" is not defined as a function.',
    requiredType: 'Property "required" must be boolean or a non-empty string.',
    reversedType: 'Property "reversed" must be boolean.',
    separatorMissing: 'Property "separator" is missing.',
    separatorType: 'Property "separator" must be either a non-empty string or an array of non-empty strings.',
    subexpressions: 'Only one of array, dictionary, or element shall be defined.',
    suffixType: 'Property "suffix" must be either a string or an array of strings.',
    trimmingType: 'Property "trimming" must be boolean.',
    withinType: 'Property "within" must be an object.'
};

/**
 * Represents an instance of expression from JSON.
 * @export
 * @class Expression
 */
export class Expression {
    private readonly expression: ElementExpression;

    /**
     * Creates an instance of Expression.
     * @param {*} json
     * @param {Processors} [processors]
     * @throws {ExpressionError} if the provided expression does not comply the syntax.
     * @memberof Expression
     */
    constructor(json: any, processors?: Processors) {
        if (typeof json !== 'object' || json instanceof Array) {
            throw new ExpressionError(messages.expressionType, json);
        }
        processors = processors || {};
        this.expression = new ElementExpression({ element: json }, processors, true);
    }

    /**
     * Extracts content in JSON of schema defined by the expression.
     * @param {string} input Input input to extract content from.
     * @returns {*} Result content in JSON format.
     * @throws {ExtractionError} if the input input does not match the expression.
     * @memberof Expression
     */
    public extract(input: string): any {
        const result = this.expression.extract(input);
        if (isError(result)) {
            result.message += result.at + '.';
            throw result;
        }
        else {
            return avoidMemoryLeak(result);
        }
    }

    /**
     * Returns the original expression in JSON format.
     * @returns {*}
     * @memberof Expression
     */
    public toJSON(): any {
        return this.expression.toJSON();
    }
}

interface Extractor {
    extract(input: string): any | ExtractionError;
    toJSON(): any;
}

type SubexpressionType = 'element' | 'array' | 'dictionary';
interface Subexpression extends Extractor {
    subtype: SubexpressionType;
    required?: boolean | string;
    toJSON(): any;
}

function getSubexpression(json: any, processors: Processors): Subexpression {
    if (json.hasOwnProperty('element')) {
        if (json.hasOwnProperty('array') || json.hasOwnProperty('dictionary')) {
            throw new ExpressionError(messages.subexpressions, json);
        }
        return new ElementExpression(json, processors);
    }
    else if (json.hasOwnProperty('array')) {
        if (json.hasOwnProperty('dictionary')) {
           throw new ExpressionError(messages.subexpressions, json);
        }
        return new ArrayExpression(json, processors);
    }
    else if (json.hasOwnProperty('dictionary')) {
        return new DictionaryExpression(json, processors);
    }
    else {
        return undefined;
    }
}

class ElementExpression implements Subexpression {
    public readonly subtype: SubexpressionType = 'element';

    public readonly required?: boolean | string;
    public readonly contains?: string;
    public readonly within?: WithinExpression;
    public readonly process?: ProcessExpression;
    public readonly subexpression?: Subexpression;

    constructor(json: any, processors: Processors, private root: boolean = false) {
        if (typeof json.element !== 'object' || json.element instanceof Array) {
            throw new ExpressionError(messages.elementType, json);
        }
        json = json.element;

        if (json.hasOwnProperty('required')) {
            if (typeof json.required !== 'boolean' && (
                typeof json.required !== 'string' ||
                json.required.length === 0
            )) {
                throw new ExpressionError(messages.requiredType, json);
            }
            this.required = json.required;
        }
        if (json.hasOwnProperty('contains')) {
            if (typeof json.contains !== 'string') {
                throw new ExpressionError(messages.containsType, json);
            }
            this.contains = json.contains;
        }
        if (json.hasOwnProperty('within')) {
            this.within = new WithinExpression(json);
        }
        if (json.hasOwnProperty('process')) {
            this.process = new ProcessExpression(json, processors);
        }
        this.subexpression = getSubexpression(json, processors);
    }

    public extract(input: string): any | ExtractionError {
        let str = input;

        if (this.contains && this.contains.length > 0) {
            if (str.indexOf(this.contains) < 0) {
                return new ExtractionError(this.root ? 'contains' : 'element.contains');
            }
        }

        if (this.within) {
            const result = this.within.extract(str);
            if (isError(result)) {
                result.at = (this.root ? 'within.' : 'element.within.') + result.at;
                return result;
            }
            str = result;
        }

        if (this.process) {
            const result = this.process.extract(str);
            if (isError(result)) {
                result.at = (this.root ? 'process.' : 'element.process.') + result.at;
                return result;
            }
            str = result;
        }

        if (this.subexpression) {
            return this.subexpression.extract(str);
        }
        else {
            return str;
        }
    }

    public toJSON() {
        const json: any = { };
        if (this.required !== undefined) {
            json.required = this.required;
        }
        if (this.contains !== undefined) {
            json.contains = this.contains;
        }
        if (this.within !== undefined) {
            json.within = this.within.toJSON();
        }
        if (this.process !== undefined) {
            json.process = this.process.toJSON();
        }
        if (this.subexpression) {
            json[this.subexpression.subtype] = this.subexpression.toJSON();
        }
        return json;
    }
}

class ArrayExpression implements Subexpression {
    public readonly subtype: SubexpressionType = 'array';

    public readonly separator: string | string[];
    public readonly subexpression?: Subexpression;

    constructor(json: any, processors: Processors) {
        if (typeof json.array !== 'object' || json.array instanceof Array) {
            throw new ExpressionError(messages.arrayType, json);
        }
        json = json.array;

        if (json.hasOwnProperty('separator')) {
            switch (typeof json.separator) {
            case 'string':
                if (json.separator.length === 0) {
                    throw new ExpressionError(messages.separatorType, json);
                }
                this.separator = json.separator;
                break;
            case 'object':
                if (json.separator instanceof Array) {
                    json.separator.forEach((separator: any) => {
                        if (typeof(separator) !== 'string' || separator.length === 0) {
                            throw new ExpressionError(messages.separatorType, json);
                        }
                    });
                    this.separator = json.separator;
                }
            }
            if (this.separator === undefined) {
                throw new ExpressionError(messages.separatorType, json);
            }
        }
        else {
            throw new ExpressionError(messages.separatorMissing, json);
        }

        this.subexpression = getSubexpression(json, processors);
    }

    public extract(input: string): any | ExtractionError {
        let parts = [input];
        const separators = (typeof this.separator === 'string') ? [this.separator] : this.separator;
        for (let si = 0; si < separators.length; si += 1) {
            const groups = [];
            for (let ii = 0; ii < parts.length; ii += 1) {
                groups[ii] = parts[ii].split(separators[si]);
            }
            parts = [].concat.apply([], groups);
        }
        const array = [];
        for (let i = 0; i < parts.length; i += 1) {
            const item = parts[i];
            if (item.length === 0) {
                continue;
            }
            if (this.subexpression) {
                const result = this.subexpression.extract(item);
                if (isError(result)) {
                    if (this.subexpression.required === undefined || this.subexpression.required) {
                        result.at = this.subtype + '.' + result.at;
                        return result;
                    }
                }
                else if (typeof result === 'string') {
                    if (result.length > 0) {
                        array.push(result);
                    }
                }
                else {
                    array.push(result);
                }
            }
            else {
                array.push(item);
            }
        }
        return array;
    }

    public toJSON() {
        const json: any = { separator: this.separator };
        if (this.subexpression) {
            json[this.subexpression.subtype] = this.subexpression.toJSON();
        }
        return json;
    }
}

class DictionaryExpression implements Subexpression {
    public subtype: SubexpressionType = 'dictionary';
    private readonly elements: { [name: string]: ElementExpression };

    constructor(json: any, processors: Processors) {
        if (typeof json.dictionary !== 'object' || json.dictionary instanceof Array) {
            throw new ExpressionError(messages.dictionaryType, json);
        }
        json = json.dictionary;

        this.elements = {};
        Object.keys(json).forEach(name => {
            const value = json[name];
            if (typeof value !== 'object' || value instanceof Array) {
                throw new ExpressionError(messages.dictionaryValueType.replace('{name}', name), json);
            }
            this.elements[name] = new ElementExpression({ element: value }, processors, true);
        });
    }

    public extract(input: string): any | ExtractionError {
        const dictionary: { [name: string]: any } = {};
        const errors: { [name: string]: ExtractionError } = {};

        const names = Object.keys(this.elements);
        for (let i = 0; i < names.length; i += 1) {
            const name = names[i];
            const element = this.elements[name];
            const result = element.extract(input);
            if (isError(result)) {
                if (element.required === undefined || element.required) {
                    if (typeof element.required !== 'string') {
                        result.at = this.subtype + '.' + name + '.' + result.at;
                        return result;
                    }
                    else if (!(element.required in errors)) {
                        result.at = this.subtype + '.' + name + '(' + element.required + ').' + result.at;
                        errors[element.required] = result;
                    }
                }
            }
            else {
                if (typeof element.required === 'string') {
                    errors[element.required] = undefined;
                }
                dictionary[name] = result;
            }
        }

        const requireds = Object.keys(errors);
        for (let i = 0; i < requireds.length; i += 1) {
            const required = requireds[i];
            const error = errors[required];
            if (error !== undefined) {
                return error;
            }
        }

        return dictionary;
    }

    public toJSON() {
        const json: any = {};
        Object.keys(this.elements).forEach((name) => {
            json[name] = this.elements[name].toJSON();
        });
        return json;
    }
}

class WithinExpression {

    public readonly reversed?: boolean;
    public readonly prefix?: string | string[];
    public readonly suffix?: string | string[];
    public readonly trimming?: boolean;

    constructor(json: any) {
        if (typeof json.within !== 'object' || json.within instanceof Array) {
            throw new ExpressionError(messages.withinType, json);
        }
        json = json.within;

        if (json.hasOwnProperty('reversed')) {
            if (typeof json.reversed !== 'boolean') {
                throw new ExpressionError(messages.reversedType, json);
            }
            this.reversed = json.reversed;
        }
        if (json.hasOwnProperty('prefix')) {
            switch (typeof json.prefix) {
            case 'string':
                this.prefix = json.prefix;
                break;
            case 'object':
                if (json.prefix instanceof Array) {
                    json.prefix.forEach((prefix: any) => {
                        if (typeof(prefix) !== 'string') {
                            throw new ExpressionError(messages.prefixType, json);
                        }
                    });
                    this.prefix = json.prefix;
                }
            }
            if (this.prefix === undefined) {
                throw new ExpressionError(messages.prefixType, json);
            }
        }
        if (json.hasOwnProperty('suffix')) {
            switch (typeof json.suffix) {
            case 'string':
                this.suffix = json.suffix;
                break;
            case 'object':
                if (json.suffix instanceof Array) {
                    json.suffix.forEach((suffix: any) => {
                        if (typeof(suffix) !== 'string') {
                            throw new ExpressionError(messages.suffixType, json);
                        }
                    });
                    this.suffix = json.suffix;
                }
            }
            if (this.suffix === undefined) {
                throw new ExpressionError(messages.suffixType, json);
            }
        }
        if (json.hasOwnProperty('trimming')) {
            if (typeof json.trimming !== 'boolean') {
                throw new ExpressionError(messages.trimmingType, json);
            }
            this.trimming = json.trimming;
        }
    }

    public extract(input: string): any | ExtractionError {
        let str = input;

        // prefix
        const prefixes = this.prefix === undefined ? []
            : ((typeof this.prefix === 'string') ? [this.prefix]
            : this.prefix);
        for (let i = 0; i < prefixes.length; i += 1) {
            const prefix = prefixes[i];
            if (prefix.length > 0) {
                if (this.reversed) {
                    const end = str.lastIndexOf(prefix);
                    if (end >= 0) {
                        str = str.substring(0, end);
                    }
                    else {
                        if (typeof this.prefix === 'string') {
                            return new ExtractionError('prefix');
                        }
                        else {
                            return new ExtractionError('prefix.' + prefix + '(' + i + ')');
                        }
                    }
                }
                else {
                    const start = str.indexOf(prefix);
                    if (start >= 0) {
                        str = str.substring(start + prefix.length);
                    }
                    else {
                        if (typeof this.prefix === 'string') {
                            return new ExtractionError('prefix');
                        }
                        else {
                            return new ExtractionError('prefix.' + prefix + '(' + i + ')');
                        }
                    }
                }
            }
        }

        // suffix
        const suffixes = this.suffix === undefined ? []
            : ((typeof this.suffix === 'string') ? [this.suffix]
            : this.suffix);
        let suffixed = false;
        let suffixesCount = 0;
        for (let i = 0; i < suffixes.length; i += 1) {
            const suffix = suffixes[i];
            if (suffix.length > 0) {
                suffixesCount += 1;
                if (this.reversed) {
                    const start = str.lastIndexOf(suffix);
                    if (start >= 0) {
                        str = str.substring(start + this.suffix.length);
                        suffixed = true;
                        break;
                    }
                }
                else {
                    const end = str.indexOf(suffix);
                    if (end >= 0) {
                        str = str.substring(0, end);
                        suffixed = true;
                        break;
                    }
                }
            }
        }
        if (!suffixed && suffixesCount > 0) {
            return new ExtractionError('suffix');
        }

        // trimming
        if (this.trimming) {
            str = str.trim();
        }

        return str;
    }

    public toJSON() {
        const json: any = { };
        if (this.reversed !== undefined) {
            json.reversed = this.reversed;
        }
        if (this.prefix !== undefined) {
            json.prefix = this.prefix;
        }
        if (this.suffix !== undefined) {
            json.suffix = this.suffix;
        }
        if (this.trimming !== undefined) {
            json.trimming = this.trimming;
        }
        return json;
    }
}

enum ProcessValueType {
    string,
    object,
    array
}

interface ExpressionProcessor {
    name: string;
    process: Process;
    arg?: any;
    valueType: ProcessValueType.string | ProcessValueType.object;
}

class ProcessExpression {

    private valueType: ProcessValueType;
    private readonly processors: ExpressionProcessor[];

    constructor(json: any, processes: Processors) {
        this.processors = [];
        const processValue = json.process;
        if (typeof processValue === 'string') {
            this.valueType = ProcessValueType.string;
            const process = processes[processValue];
            if (typeof process !== 'function') {
                throw new ExpressionError(messages.processUndefined.replace('{name}', processValue), json);
            }
            this.processors.push({
                name: processValue,
                process: process,
                valueType: ProcessValueType.string
            });
        }
        else if (typeof processValue === 'object') {
            if (processValue instanceof Array) {
                this.valueType = ProcessValueType.array;
                processValue.forEach(item => {
                    if (typeof item === 'string') {
                        const process = processes[item];
                        if (typeof process !== 'function') {
                            throw new ExpressionError(messages.processUndefined.replace('{name}', item), json);
                        }
                        this.processors.push({
                            name: item,
                            process: process,
                            valueType: ProcessValueType.string
                        });
                    }
                    else if (typeof item === 'object' && !(item instanceof Array)) {
                        if (!item.hasOwnProperty('name')) {
                            throw new ExpressionError(messages.processNameMissing, json);
                        }
                        if (typeof item.name !== 'string') {
                            throw new ExpressionError(messages.processNameType, json);
                        }
                        const process = processes[item.name];
                        if (typeof process !== 'function') {
                            throw new ExpressionError(messages.processUndefined.replace('{name}', item.name), json);
                        }
                        this.processors.push({
                            name: item.name,
                            process: process,
                            arg: item.arg,
                            valueType: ProcessValueType.object
                        });
                    }
                    else {
                        throw new ExpressionError(messages.processType, json);
                    }
                });
            }
            else {
                this.valueType = ProcessValueType.object;
                if (!processValue.hasOwnProperty('name')) {
                    throw new ExpressionError(messages.processNameMissing, json);
                }
                if (typeof processValue.name !== 'string') {
                    throw new ExpressionError(messages.processNameType, json);
                }
                const process = processes[processValue.name];
                if (typeof process !== 'function') {
                    throw new ExpressionError(messages.processUndefined.replace('{name}', processValue.name), json);
                }
                this.processors.push({
                    name: processValue.name,
                    process: process, arg:
                    processValue.arg,
                    valueType: ProcessValueType.object
                });
            }
        }
        else {
            throw new ExpressionError(messages.processType, json);
        }
    }

    public extract(input: string): any | ExtractionError {
        let str = input;

        for (let i = 0; i < this.processors.length; i += 1) {
            const processor = this.processors[i];
            try {
                str = processor.process(str, processor.arg);
            }
            catch (e) {
                const error = new ExtractionError(processor.name + '(' + i + ')');
                if (e.stack) {
                    error.stack = e.stack;
                }
                return error;
            }
        }
        return str;
    }

    public toJSON() {
        if (this.valueType === ProcessValueType.string) {
            return this.processors[0].name;
        }
        else if (this.valueType === ProcessValueType.object) {
            const json: any = { name: this.processors[0].name};
            if (this.processors[0].arg !== undefined) {
                json.arg = this.processors[0].arg;
            }
            return json;
        }
        else {
            const array: any[] = [];
            this.processors.forEach((processor) => {
                if (processor.valueType === ProcessValueType.string) {
                    array.push(processor.name);
                }
                else {
                    const json: any = { name: processor.name};
                    if (processor.arg !== undefined) {
                        json.arg = processor.arg;
                    }
                    array.push(json);
                }
            });
            return array;
        }
    }
}
