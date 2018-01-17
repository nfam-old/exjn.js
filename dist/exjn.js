/**
 * @license
 * Copyright (c) 2015 Ninh Pham <nfam.dev@gmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Decribes the syntax error of provided expression.
     * @export
     * @class ExpressionError
     * @extends {Error}
     */
    var ExpressionError = /** @class */ (function (_super) {
        __extends(ExpressionError, _super);
        function ExpressionError(message, json) {
            var _this = _super.call(this, message) || this;
            _this.json = json;
            return _this;
        }
        return ExpressionError;
    }(Error));
    exports.ExpressionError = ExpressionError;
    /**
     * Describes the location of expression at which the input input did not match.
     * @class ExtractionError
     * @extends {Error}
     */
    var ExtractionError = /** @class */ (function (_super) {
        __extends(ExtractionError, _super);
        function ExtractionError(at) {
            var _this = _super.call(this, 'Provided input does not match the expression at ') || this;
            _this.at = at;
            return _this;
        }
        return ExtractionError;
    }(Error));
    exports.ExtractionError = ExtractionError;
    function isError(result) {
        return (result instanceof Error);
    }
    // substring creates a view on original string instead of generating new one.
    // Force to generate to reduce memory if the original string is too huge.
    function avoidMemoryLeak(item) {
        if (typeof item === 'string') {
            item = (' ' + item).substring(1);
        }
        else if (typeof item === 'object') {
            if (item instanceof Array) {
                for (var i = 0; i < item.length; i += 1) {
                    item[i] = avoidMemoryLeak(item[i]);
                }
            }
            else {
                Object.keys(item).forEach(function (key) {
                    item[key] = avoidMemoryLeak(item[key]);
                });
            }
        }
        return item;
    }
    var messages = {
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
    var Expression = /** @class */ (function () {
        /**
         * Creates an instance of Expression.
         * @param {*} json
         * @param {Processors} [processors]
         * @throws {ExpressionError} if the provided expression does not comply the syntax.
         * @memberof Expression
         */
        function Expression(json, processors) {
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
        Expression.prototype.extract = function (input) {
            var result = this.expression.extract(input);
            if (isError(result)) {
                result.message += result.at + '.';
                throw result;
            }
            else {
                return avoidMemoryLeak(result);
            }
        };
        /**
         * Returns the original expression in JSON format.
         * @returns {*}
         * @memberof Expression
         */
        Expression.prototype.toJSON = function () {
            return this.expression.toJSON();
        };
        return Expression;
    }());
    exports.Expression = Expression;
    function getSubexpression(json, processors) {
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
    var ElementExpression = /** @class */ (function () {
        function ElementExpression(json, processors, root) {
            if (root === void 0) { root = false; }
            this.root = root;
            this.subtype = 'element';
            if (typeof json.element !== 'object' || json.element instanceof Array) {
                throw new ExpressionError(messages.elementType, json);
            }
            json = json.element;
            if (json.hasOwnProperty('required')) {
                if (typeof json.required !== 'boolean' && (typeof json.required !== 'string' ||
                    json.required.length === 0)) {
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
        ElementExpression.prototype.extract = function (input) {
            var str = input;
            if (this.contains && this.contains.length > 0) {
                if (str.indexOf(this.contains) < 0) {
                    return new ExtractionError(this.root ? 'contains' : 'element.contains');
                }
            }
            if (this.within) {
                var result = this.within.extract(str);
                if (isError(result)) {
                    result.at = (this.root ? 'within.' : 'element.within.') + result.at;
                    return result;
                }
                str = result;
            }
            if (this.process) {
                var result = this.process.extract(str);
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
        };
        ElementExpression.prototype.toJSON = function () {
            var json = {};
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
        };
        return ElementExpression;
    }());
    var ArrayExpression = /** @class */ (function () {
        function ArrayExpression(json, processors) {
            this.subtype = 'array';
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
                            json.separator.forEach(function (separator) {
                                if (typeof (separator) !== 'string' || separator.length === 0) {
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
        ArrayExpression.prototype.extract = function (input) {
            var parts = [input];
            var separators = (typeof this.separator === 'string') ? [this.separator] : this.separator;
            for (var si = 0; si < separators.length; si += 1) {
                var groups = [];
                for (var ii = 0; ii < parts.length; ii += 1) {
                    groups[ii] = parts[ii].split(separators[si]);
                }
                parts = [].concat.apply([], groups);
            }
            var array = [];
            for (var i = 0; i < parts.length; i += 1) {
                var item = parts[i];
                if (item.length === 0) {
                    continue;
                }
                if (this.subexpression) {
                    var result = this.subexpression.extract(item);
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
        };
        ArrayExpression.prototype.toJSON = function () {
            var json = { separator: this.separator };
            if (this.subexpression) {
                json[this.subexpression.subtype] = this.subexpression.toJSON();
            }
            return json;
        };
        return ArrayExpression;
    }());
    var DictionaryExpression = /** @class */ (function () {
        function DictionaryExpression(json, processors) {
            var _this = this;
            this.subtype = 'dictionary';
            if (typeof json.dictionary !== 'object' || json.dictionary instanceof Array) {
                throw new ExpressionError(messages.dictionaryType, json);
            }
            json = json.dictionary;
            this.elements = {};
            Object.keys(json).forEach(function (name) {
                var value = json[name];
                if (typeof value !== 'object' || value instanceof Array) {
                    throw new ExpressionError(messages.dictionaryValueType.replace('{name}', name), json);
                }
                _this.elements[name] = new ElementExpression({ element: value }, processors, true);
            });
        }
        DictionaryExpression.prototype.extract = function (input) {
            var dictionary = {};
            var errors = {};
            var names = Object.keys(this.elements);
            for (var i = 0; i < names.length; i += 1) {
                var name_1 = names[i];
                var element = this.elements[name_1];
                var result = element.extract(input);
                if (isError(result)) {
                    if (element.required === undefined || element.required) {
                        if (typeof element.required !== 'string') {
                            result.at = this.subtype + '.' + name_1 + '.' + result.at;
                            return result;
                        }
                        else if (!(element.required in errors)) {
                            result.at = this.subtype + '.' + name_1 + '(' + element.required + ').' + result.at;
                            errors[element.required] = result;
                        }
                    }
                }
                else {
                    if (typeof element.required === 'string') {
                        errors[element.required] = undefined;
                    }
                    dictionary[name_1] = result;
                }
            }
            var requireds = Object.keys(errors);
            for (var i = 0; i < requireds.length; i += 1) {
                var required = requireds[i];
                var error = errors[required];
                if (error !== undefined) {
                    return error;
                }
            }
            return dictionary;
        };
        DictionaryExpression.prototype.toJSON = function () {
            var _this = this;
            var json = {};
            Object.keys(this.elements).forEach(function (name) {
                json[name] = _this.elements[name].toJSON();
            });
            return json;
        };
        return DictionaryExpression;
    }());
    var WithinExpression = /** @class */ (function () {
        function WithinExpression(json) {
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
                            json.prefix.forEach(function (prefix) {
                                if (typeof (prefix) !== 'string') {
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
                            json.suffix.forEach(function (suffix) {
                                if (typeof (suffix) !== 'string') {
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
        WithinExpression.prototype.extract = function (input) {
            var str = input;
            // prefix
            var prefixes = this.prefix === undefined ? []
                : ((typeof this.prefix === 'string') ? [this.prefix]
                    : this.prefix);
            for (var i = 0; i < prefixes.length; i += 1) {
                var prefix = prefixes[i];
                if (prefix.length > 0) {
                    if (this.reversed) {
                        var end = str.lastIndexOf(prefix);
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
                        var start = str.indexOf(prefix);
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
            var suffixes = this.suffix === undefined ? []
                : ((typeof this.suffix === 'string') ? [this.suffix]
                    : this.suffix);
            var suffixed = false;
            var suffixesCount = 0;
            for (var i = 0; i < suffixes.length; i += 1) {
                var suffix = suffixes[i];
                if (suffix.length > 0) {
                    suffixesCount += 1;
                    if (this.reversed) {
                        var start = str.lastIndexOf(suffix);
                        if (start >= 0) {
                            str = str.substring(start + this.suffix.length);
                            suffixed = true;
                            break;
                        }
                    }
                    else {
                        var end = str.indexOf(suffix);
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
        };
        WithinExpression.prototype.toJSON = function () {
            var json = {};
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
        };
        return WithinExpression;
    }());
    var ProcessValueType;
    (function (ProcessValueType) {
        ProcessValueType[ProcessValueType["string"] = 0] = "string";
        ProcessValueType[ProcessValueType["object"] = 1] = "object";
        ProcessValueType[ProcessValueType["array"] = 2] = "array";
    })(ProcessValueType || (ProcessValueType = {}));
    var ProcessExpression = /** @class */ (function () {
        function ProcessExpression(json, processes) {
            var _this = this;
            this.processors = [];
            var processValue = json.process;
            if (typeof processValue === 'string') {
                this.valueType = ProcessValueType.string;
                var process = processes[processValue];
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
                    processValue.forEach(function (item) {
                        if (typeof item === 'string') {
                            var process = processes[item];
                            if (typeof process !== 'function') {
                                throw new ExpressionError(messages.processUndefined.replace('{name}', item), json);
                            }
                            _this.processors.push({
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
                            var process = processes[item.name];
                            if (typeof process !== 'function') {
                                throw new ExpressionError(messages.processUndefined.replace('{name}', item.name), json);
                            }
                            _this.processors.push({
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
                    var process = processes[processValue.name];
                    if (typeof process !== 'function') {
                        throw new ExpressionError(messages.processUndefined.replace('{name}', processValue.name), json);
                    }
                    this.processors.push({
                        name: processValue.name,
                        process: process, arg: processValue.arg,
                        valueType: ProcessValueType.object
                    });
                }
            }
            else {
                throw new ExpressionError(messages.processType, json);
            }
        }
        ProcessExpression.prototype.extract = function (input) {
            var str = input;
            for (var i = 0; i < this.processors.length; i += 1) {
                var processor = this.processors[i];
                try {
                    str = processor.process(str, processor.arg);
                }
                catch (e) {
                    var error = new ExtractionError(processor.name + '(' + i + ')');
                    if (e.stack) {
                        error.stack = e.stack;
                    }
                    return error;
                }
            }
            return str;
        };
        ProcessExpression.prototype.toJSON = function () {
            if (this.valueType === ProcessValueType.string) {
                return this.processors[0].name;
            }
            else if (this.valueType === ProcessValueType.object) {
                var json = { name: this.processors[0].name };
                if (this.processors[0].arg !== undefined) {
                    json.arg = this.processors[0].arg;
                }
                return json;
            }
            else {
                var array_1 = [];
                this.processors.forEach(function (processor) {
                    if (processor.valueType === ProcessValueType.string) {
                        array_1.push(processor.name);
                    }
                    else {
                        var json = { name: processor.name };
                        if (processor.arg !== undefined) {
                            json.arg = processor.arg;
                        }
                        array_1.push(json);
                    }
                });
                return array_1;
            }
        };
        return ProcessExpression;
    }());
});
