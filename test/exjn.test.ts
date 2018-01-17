/**
 * @license
 * Copyright (c) 2015 Ninh Pham <nfam.dev@gmail.com>
 *
 * Use of this source code is governed by the MIT license.
 */

import { Expression, Processors } from '../src/exjn';
import { expect } from 'chai';

const processors: Processors = {
    int: (text: string, radix?: number): string => {
        const v = parseInt(text, radix);
        if (isNaN(v)) {
            throw new Error('invalid number');
        } else {
            return v.toString();
        }
    },
    float: (text: string, fixed?: number): string => {
        const v = parseFloat(text);
        if (fixed !== undefined) {
            return v.toFixed(fixed);
        } else {
            return v.toString();
        }
    },
    notfuncion: ('notfunction' as any)
};

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
const unmatchAt = 'Provided input does not match the expression at ';

describe('Expression', () => {
    describe('fromJSON', () => {
        function helpLoad(json: any, p?: Processors) {
            it('should load ' + JSON.stringify(json), () => {
                const _ = new Expression(json, p);
            });
        }
        function helpFail(json: any, message: string, p?: Processors) {
            it('should fail ' + JSON.stringify(json) + ', and throw `' + message + '`', () => {
                expect(() => new Expression(json, p)).to.throw(message);
            });
        }

        describe('expression', () => {
            helpLoad({});
            helpFail('string', messages.expressionType);
            helpFail([], messages.expressionType);
        });
        describe('expression.contains', () => {
            helpLoad({ contains: 'string' });
            helpLoad({ contains: '' });
            helpFail({ contains: 1 }, messages.containsType);
        });
        describe('expression.within', () => {
            helpLoad({ within: {} });
            helpFail({ within: 1 }, messages.withinType);
            helpFail({ within: [] }, messages.withinType);
        });
        describe('expression.element', () => {
            helpLoad({ element: {} });
            helpFail({ element: 'string' }, messages.elementType);
            helpFail({ element: [] }, messages.elementType);
            helpFail({ element: [], array: 1 }, messages.subexpressions);
            helpFail({ element: [], dictionary: 1 }, messages.subexpressions);
        });
        describe('expression.array', () => {
            helpLoad({ array: { separator: '|' } });
            helpFail({ array: 'string' }, messages.arrayType);
            helpFail({ array: [] }, messages.arrayType);
            helpFail({ array: 1, dictionary: 1 }, messages.subexpressions);
        });
        describe('expression.dictionary', () => {
            helpLoad({ dictionary: {} });
            helpFail({ dictionary: 'string' }, messages.dictionaryType);
            helpFail({ dictionary: [] }, messages.dictionaryType);
        });
        describe('expression.process', () => {
            helpLoad({ process: 'int' }, processors);
            helpFail({ process: 1 }, messages.processType, processors);
            helpFail({ process: 'int1' }, messages.processUndefined.replace('{name}', 'int1'), processors);
        });
        describe('withint.reversed', () => {
            helpLoad({ within: { reversed: true } });
            helpLoad({ within: { reversed: false } });
            helpFail({ within: { reversed: 1 } }, messages.reversedType);
        });
        describe('withint.prefix', () => {
            helpLoad({ within: { prefix: 'string' } });
            helpLoad({ within: { prefix: '' } });
            helpFail({ within: { prefix: 1 } }, messages.prefixType);
            helpFail({ within: { prefix: {} } }, messages.prefixType);
            helpLoad({ within: { prefix: ['string1', 'string2'] } });
            helpLoad({ within: { prefix: ['string1', ''] } });
            helpFail({ within: { prefix: ['string1', 1] } }, messages.prefixType);
        });
        describe('withint.suffix', () => {
            helpLoad({ within: { suffix: 'string' } });
            helpLoad({ within: { suffix: '' } });
            helpFail({ within: { suffix: 1 } }, messages.suffixType);
            helpFail({ within: { suffix: {} } }, messages.suffixType);
            helpLoad({ within: { suffix: ['string1', 'string2'] } });
            helpLoad({ within: { suffix: ['string1', ''] } });
            helpFail({ within: { suffix: ['string1', 1] } }, messages.suffixType);
        });
        describe('withint.trimming', () => {
            helpLoad({ within: { trimming: true } });
            helpLoad({ within: { trimming: false } });
            helpFail({ within: { trimming: 1 } }, messages.trimmingType);
        });
        describe('element.required', () => {
            helpLoad({ element: { required: true } });
            helpLoad({ element: { required: false } });
            helpLoad({ element: { required: 'label' } });
            helpFail({ element: { required: 1 } }, messages.requiredType);
            helpFail({ element: { required: '' } }, messages.requiredType);
        });
        describe('element.contains', () => {
            helpLoad({ element: { contains: 'content' } });
            helpLoad({ element: { contains: '' } });
            helpFail({ element: { contains: 1 } }, messages.containsType);
        });
        describe('element.within', () => {
            helpLoad({ element: { within: {} } });
            helpFail({ element: { within: 1 } }, messages.withinType);
            helpFail({ element: { within: [] } }, messages.withinType);
        });
        describe('element.process', () => {
            helpLoad({ element: { process: 'int' } }, processors);
            helpFail({ element: { process: 1 } }, messages.processType), processors;
            helpFail({ element: { process: 'int1' } }, messages.processUndefined.replace('{name}', 'int1'), processors);
            helpFail({ element: { process: { } } }, messages.processNameMissing, processors);
            helpLoad({ element: { process: { name: 'int' } } }, processors);
            helpLoad({ element: { process: { name: 'int', arg: 2 } } }, processors);
            helpFail({ element: { process: { name: 1 } } }, messages.processNameType, processors);
            helpFail({ element: { process: { name: 'notfunction' } } }, messages.processUndefined.replace('{name}', 'notfunction'), processors);
            helpFail({ element: { process: { name: 'int1' } } }, messages.processUndefined.replace('{name}', 'int1'), processors);
            helpFail({ element: { process: [1] } }, messages.processType, processors);
            helpFail({ element: { process: [{}] } }, messages.processNameMissing, processors);
            helpLoad({ element: { process: ['int', 'float'] } }, processors);
            helpFail({ element: { process: ['int1', 'float'] } }, messages.processUndefined.replace('{name}', 'int1'), processors);
            helpLoad({ element: { process: [{ name: 'int' }, 'float'] } }, processors);
            helpLoad({ element: { process: [{ name: 'int', arg: 2 }, 'float'] } }, processors);
            helpFail({ element: { process: [{ name: 1 }, 'float'] } }, messages.processNameType, processors);
            helpFail({ element: { process: [{ name: 'int1' }, 'float'] } }, messages.processUndefined.replace('{name}', 'int1'), processors);
        });
        describe('array.separator', () => {
            helpFail({ array: { } }, messages.separatorMissing);
            helpLoad({ array: { separator: 'string' } });
            helpFail({ array: { separator: '' } }, messages.separatorType);
            helpFail({ array: { separator: 1 } }, messages.separatorType);
            helpFail({ array: { separator: {} } }, messages.separatorType);
            helpLoad({ array: { separator: ['string1', 'string2'] } });
            helpFail({ array: { separator: ['string1', ''] } }, messages.separatorType);
            helpFail({ array: { separator: ['string1', 1] } }, messages.separatorType);
        });
        describe('array.element', () => {
            helpLoad({ array: { separator: '|', element: {} } });
            helpFail({ array: { separator: '|', element: 'string' } }, messages.elementType);
            helpFail({ array: { separator: '|', element: [] } }, messages.elementType);
            helpFail({ array: { separator: '|', element: [], array: 1 } }, messages.subexpressions);
            helpFail({ array: { separator: '|', element: [], dictionary: 1 } }, messages.subexpressions);
        });
        describe('array.array', () => {
            helpLoad({ array: { separator: '|',  array: { separator: '|' } } });
            helpFail({ array: { separator: '|',  array: 'string' } }, messages.arrayType);
            helpFail({ array: { separator: '|',  array: [] } }, messages.arrayType);
            helpFail({ array: { separator: '|',  array: 1, dictionary: 1 } }, messages.subexpressions);
        });
        describe('dictionary.element', () => {
            helpLoad({ dictionary: { name: {} } });
            helpFail({ dictionary: { name: 'string' } }, messages.dictionaryValueType.replace('{name}', 'name'));
            helpFail({ dictionary: { name: [] } }, messages.dictionaryValueType.replace('{name}', 'name'));
        });
    });
    describe('toJON', () => {
        function helpIt(json: any, p?: Processors) {
            it('should toJSON() equal to ' + JSON.stringify(json), () => {
                expect(JSON.parse(JSON.stringify(new Expression(json, p)))).deep.equal(json);
            });
        }
        [
            {},
            { required: true },
            { required: false },
            { required: ' ' },
            { contains: 'valid' },
            { contains: '' },
            { within: {}},
            { within: { reversed: true }},
            { within: { prefix: '1' }},
            { within: { prefix: '' }},
            { within: { prefix: ['1', '2'] }},
            { within: { prefix: ['1', ''] }},
            { within: { suffix: '1' }},
            { within: { suffix: '' }},
            { within: { suffix: ['1', '2'] }},
            { within: { suffix: ['1', ''] }},
            { within: { trimming: true }},
            { within: { trimming: false }},
            { element: {}},
            { element: { dictionary: { name: { contains: 'valid' }}}},
            { array: { separator: '|' }},
            { array: { separator: ['|'] }},
            { array: { separator: '|', element: { }}},
            { dictionary: { name: { contains: 'valid' }}},
            { process: 'int' },
            { process: { name: 'int' }},
            { process: { name: 'int', arg: 10 }} ,
            { process: ['int'] },
            { process: ['int', { name: 'int' }] },
            { process: ['int', { name: 'int', arg: 2 }] }
        ]
        .forEach(json => helpIt(json, processors));
    });
    describe('extract', () => {
        function helpMatch(json: any, input: string, output: any, p?: Processors) {
            it('should extract with ' + JSON.stringify(json) + ' from "' + input + '" to ' + JSON.stringify(output), () => {
                expect(new Expression(json, p).extract(input)).deep.equal(output);
            });
        }
        function helpFail(json: any, input: string, message: string, p?: Processors) {
            it('should fail with ' + JSON.stringify(json) + ' from "' + input + '", throw `' + message + '`', () => {
                expect(() => new Expression(json, p).extract(input)).throw(message);
            });
        }
        describe('contains', () => {
            helpMatch({ contains: '#' }, ' #0 ', ' #0 ');
            helpFail({ contains: ' ) ' }, ' # ', unmatchAt + 'contains');
        });
        describe('within', () => {
            [
                {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: '' }},
                    result: ' 0 1 2 3 '
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: '0' }},
                    result: ' 1 2 3 '
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: '0', trimming: true }},
                    result: '1 2 3'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: '3', trimming: true }},
                    result: ''
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: ['0', '1'], trimming: true }},
                    result: '2 3'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { suffix: '1', trimming: true }},
                    result: '0'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { suffix: ['', '0'], trimming: true }},
                    result: ''
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { suffix: ['4', '2'], trimming: true }},
                    result: '0 1'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: ['0', '1'], suffix: '3', trimming: true }},
                    result: '2'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, prefix: '1' }},
                    result: ' 0 '
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, prefix: '1', trimming: true }},
                    result: '0'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, prefix: '3', trimming: true }},
                    result: '0 1 2'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, prefix: ['3', '2'], trimming: true }},
                    result: '0 1'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, suffix: '1', trimming: true }},
                    result: '2 3'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, suffix: '0', trimming: true }},
                    result: '1 2 3'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, prefix: ['3', '2'], suffix: '0', trimming: true }},
                    result: '1'
                }
            ]
            .forEach(sample => helpMatch(sample.json, sample.text, sample.result, processors));

            [
                {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: '#' }},
                    at: 'within.prefix'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: ['0', '#'] }},
                    at: 'within.prefix.#(1)'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { suffix: '4' }},
                    at: 'within.suffix'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, prefix: '#' }},
                    at: 'within.prefix'
                }, {
                    text: ' 0 1 2 4 ',
                    json: { within: { reversed: true, prefix: ['0', '#'] }},
                    at: 'within.prefix.#(1)'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { reversed: true, suffix: '4' }},
                    at: 'within.suffix'
                }
            ]
            .forEach(sample => helpFail(sample.json, sample.text, unmatchAt + sample.at, processors));
        });
        describe('element', () => {
            [
                {
                    text: ' 0 1 2 3 ',
                    json: { element: { within: { prefix: '0' }}},
                    result: ' 1 2 3 '
                }
            ]
            .forEach(sample => helpMatch(sample.json, sample.text, sample.result, processors));

            [
                {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: '0' },  element: { within: { prefix: '0' }}},
                    at: 'element.within.prefix'
                }, {
                    text: ' 0 1 2 3 ',
                    json: { within: { prefix: '0' },  element: { within: { prefix: '0' }}},
                    at: 'element.within.prefix'
                }
            ]
            .forEach(sample => helpFail(sample.json, sample.text, unmatchAt + sample.at, processors));
        });
        describe('array', () => {
            [
                {
                    text: ' 0 ',
                    json: { array: { separator: ' ' }},
                    result: ['0']
                }, {
                    text: ' 0 1 2 3 ',
                    json: { array: { separator: ' ' }},
                    result: ['0', '1', '2', '3']
                }, {
                    text: ' 0  1  2  3 ',
                    json: { array: { separator: ' ' }},
                    result: ['0', '1', '2', '3']
                }, {
                    text: ' 0|1|2|3 ',
                    json: { array: { separator: [' ', '|'] }},
                    result: ['0', '1', '2', '3']
                }, {
                    text: ' #0|#1|#2|3 ',
                    json: { array: { separator: [' ', '|'], element: { required: false, contains: '#' }}},
                    result: ['#0', '#1', '#2']
                }, {
                    text: ' #0|#1|#2|#|3 ',
                    json: { array: { separator: [' ', '|'], element: { required: false, within: { prefix: '#' }}}},
                    result: ['0', '1', '2']
                }, {
                    text: ' n1:v1, n2:v2',
                    json: { array: {
                        separator: '|',
                        element: { dictionary: {
                            n1: { within: { prefix: 'n1:', suffix: ',' }},
                            n2: { within: { prefix: 'n2:' }}
                        }}}},
                    result: [{ n1: 'v1', n2: 'v2' }]
                }
            ]
            .forEach(sample => helpMatch(sample.json, sample.text, sample.result, processors));

            [
                {
                    text: '#0|#1|#2|3',
                    json: { array: { separator: '|', element: { within: { prefix: '#' }}}},
                    at: 'array.element.within.prefix'
                }, {
                    text: '#0|#1|#2|3',
                    json: { array: { separator: '|', element: { within: { prefix: '#' }}}},
                    at: 'array.element.within.prefix'
                }
            ]
            .forEach(sample => helpFail(sample.json, sample.text, unmatchAt + sample.at, processors));
        });
        describe('dictonary', () => {
            [
                {
                    text: ' 0 ',
                    json: { dictionary: { name: {}}},
                    result: { name: ' 0 '}
                }, {
                    text: ' 0 ',
                    json: { dictionary: { name: { within: { trimming: true }}}},
                    result: { name: '0'}
                }, {
                    text: ' n0:0 n1: 1# ',
                    json: { dictionary: {
                        n0: { within: { prefix: 'n0:', suffix: ' ' }},
                        n1: { within: { prefix: 'n1:', suffix: '#', trimming: true }
                    }}},
                    result: { n0: '0', n1: '1' }
                }, {
                    text: ' n0:0 n1: 1# ',
                    json: { dictionary: {
                        n0: { within: { prefix: 'n0:', suffix: ' ' }},
                        n1: { required: false, within: { prefix: 'n1:', suffix: '$' }
                    }}},
                    result: { n0: '0' }
                }, {
                    text: ' n0:0 n1: 1# ',
                    json: { dictionary: {
                        n0: { required: 'g', within: { prefix: 'n0:', suffix: ' ' }},
                        n1: { required: 'g', within: { prefix: 'n1:', suffix: '$' }
                    }}},
                    result: { n0: '0' }
                }
            ]
            .forEach(sample => helpMatch(sample.json, sample.text, sample.result, processors));
            [
                {
                    text: ' 0 ',
                    json: { dictionary: { name: { contains: '#' }}},
                    at: 'dictionary.name.contains'
                }, {
                    text: ' 0 ',
                    json: { dictionary: { name: { required: 'g', contains: '#' }}},
                    at: 'dictionary.name(g).contains'
                }, {
                    text: ' 0 ',
                    json: { dictionary: { name: { contains: '#' }}},
                    at: 'dictionary.name.contains'
                }
            ]
            .forEach(sample => helpFail(sample.json, sample.text, unmatchAt + sample.at, processors));
        });
        describe('process', () => {
            [
                {
                    text: ' 0 1th 2 3 ',
                    json: { element: { within: { prefix: '0', trimming: true }, process: 'int' }},
                    result: '1'
                }, {
                    text: ' 0 10th 2 3 ',
                    json: { element: { within: { prefix: '0', trimming: true }, process: { name: 'int', arg: 2 }}},
                    result: '2'
                }
            ]
            .forEach(sample => helpMatch(sample.json, sample.text, sample.result, processors));
            [
                {
                    text: ' 0 th 2 3 ',
                    json: { within: { prefix: '0', trimming: true }, process: 'int' },
                    at: 'process.int(0)'
                },
                {
                    text: ' 0 th 2 3 ',
                    json: { element: { within: { prefix: '0', trimming: true }, process: 'int' }},
                    at: 'element.process.int(0)'
                }
            ]
            .forEach(sample => helpFail(sample.json, sample.text, unmatchAt + sample.at, processors));
        });
    });
});