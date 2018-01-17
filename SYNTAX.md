# Syntax
The expression is defined in text and must comply JSON format.

## Syntax overview 
~~~~
expression              :=  { }
                         |  { expression-members }
expression-members      :=  expression-member
                         |  expression-member, expression-members
expression-member       :=  contains
                         |  within
                         |  process
                         |  subexpression

contains                :=  "contains" : string

within                  :=  "within" : { }
                         |  "within" : { within-members }
within-members          :=  within-member
                         |  within-member, within-members 
within-member           :=  reversed
                         |  prefix
                         |  suffix
                         |  trimming

reversed                :=  "reversed" : boolean

prefix                  :=  "prefix" : string
                         |  "prefix" : [ strings ]

suffix                  :=  "suffix" : string
                         |  "suffix" : [ strings ]

strings                 :=  string
                        :=  string , strings

trimming                :=  "trimming" : boolean

process                 :=  "process" : process-option
                         |  "process" : [ process-options ]
process-options         :=  process-option
                         |  process-option , process-options
process-option          :=  string
                         |  { process-option-members }
process-option-members  :=  "name": string
                         |  "name": string , "arg": any

subexpression           :=  element
                         |  array
                         |  dictionary

array                   :=  "array" : { array-members }
array-members           :=  separator
                         |  separator , subexpression

separator               :=  "separator" : string
                         |  "separator" : [ strings ]

dictionary              :=  "dictionary" : { }
                         |  "dictionary" : { dictionary-members }
dictionary-members      :=  dictionary-member
                         |  dictionary-member , dictionary-members
dictionary-member       :=  string : { }
                         |  string : { element-members }

element                 :=  "element" : { }
                        :=  "element" : { element-members }

element-members         :=  expression-members
                         |  expression-members , required

required                :=  "required" : boolean
                         |  "required" : string

~~~~

## Description

### `contains`
This property of `element` defines a string value which input must contain. Checking occurs prior to `within` and `process`.

### `required`
This property of `element` indicates if input must match the `element` expression. Default value is `true`. A `String` is only allowed if the parent expression is `dictionary` expression, in which at least one of dictionary members having the same `required` string value having input match its expression.

### `within`
This expression will return substring of input based on the its `prefix`, `suffix`, and `trimming`.

### `prefix`
This property can be a `string` or `strings`, used to remove the begining part of input. For instance, assume input is `1, 2, 1, 3, 4`; with `prefix` being `1`, then output is `, 2, 1, 3, 4, 5`; with `prefix` being `['2', '1']`, then output is  `, 3, 4, 5`.

