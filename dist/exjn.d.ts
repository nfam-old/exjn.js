/**
 * @license
 * Copyright (c) 2015 Ninh Pham <nfam.dev@gmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */
export declare type Process = (input: string, arg?: any) => string;
export declare type Processors = {
    [name: string]: Process;
};
/**
 * Decribes the syntax error of provided expression.
 * @export
 * @class ExpressionError
 * @extends {Error}
 */
export declare class ExpressionError extends Error {
    readonly json: any;
    constructor(message: string, json: any);
}
/**
 * Describes the location of expression at which the input input did not match.
 * @class ExtractionError
 * @extends {Error}
 */
export declare class ExtractionError extends Error {
    at: string;
    constructor(at: string);
}
/**
 * Represents an instance of expression from JSON.
 * @export
 * @class Expression
 */
export declare class Expression {
    private readonly expression;
    /**
     * Creates an instance of Expression.
     * @param {*} json
     * @param {Processors} [processors]
     * @throws {ExpressionError} if the provided expression does not comply the syntax.
     * @memberof Expression
     */
    constructor(json: any, processors?: Processors);
    /**
     * Extracts content in JSON of schema defined by the expression.
     * @param {string} input Input input to extract content from.
     * @returns {*} Result content in JSON format.
     * @throws {ExtractionError} if the input input does not match the expression.
     * @memberof Expression
     */
    extract(input: string): any;
    /**
     * Returns the original expression in JSON format.
     * @returns {*}
     * @memberof Expression
     */
    toJSON(): any;
}
