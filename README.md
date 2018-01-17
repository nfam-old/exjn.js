# exjn

[![build][travis-badge]][travis-url]
[![coverage][coveralls-badge]][coveralls-url]
![license][license-badge]

Extract content with simple expression defined in JSON. Javascript Implementation.

## Examples

### Extract a single text value

```javascript
// Expression defined in JSON configuration file.
var singleExpressionJSON = {
  "contains": "must have content",  // sample must have this value to consider extracting
  "within": {                       // scope content
    "prefix": ["The", "content"],   // content must be prefixed with
    "suffix": "to",                 // content must be suffixed with
    "trimming": true,               // trim whitespace of the final content of within
  }
}

// Instantiate an expression
var exjn = require('exjn');
var singleExpression = new exjn.Expression(singleExpressionJSON);

// The sample to extract
var singleSample = "The sample text must have content XYZ to extract."

// Extract out 'XYZ'
var result = singleExpression.extract(singleSample);

// result = 'XYZ'
```

### Extract an array

```javascript
// Expression defined in JSON configuration file.
var arrayExpressionJSON = {
  "contains": "Signature",
  "within": {
    "prefix": ["*start"]
    "suffix": "#end"
  },
  "array": {
  	"separator": " | ",
    "element": {
      "within": {
        "prefix": ["<span>"],
        "suffix": "</span>",
        "trimming": true
      }
    }
  }
}

// Instantiate an expression
var exjn = require('exjn');
var arrayExpression = new exjn.Expression(arrayExpressionJSON);

// The sample to extract
var arraySample = ' | *start Signature<s> 1 </s> | <s> 2  </s>| <s> 3 </s> | error. #end';

// Extract out an array of strings
var result = arrayExpression.extract(singleSample);

// Please be advised that </s>| <s> between 2 and 3 does not comply with separator " | ".
// Therefore only 4 elements are separated by the separator which are
//   "Signature<s> 1 </s>"
//   "<s> 2  </s>| <s> 3 </s>"
//   "error."
// After applying within to extract content, only the first two elements meet the spec,
// leading the result
//
// result = ["1", "2"]
```

### Extract a dictionary

```javascript
// Expression defined in JSON configuration file.
var dictionaryExpressionJSON = {
  "dictionary": {
    "title": {
      "within": {
        "prefix": ["<span>", "Title:"],
        "suffix": "</span>",
        "trimming": true
      },
    },
    "author": {
      "within": {
        "prefix": ["<span>", "Author:"],
        "suffix": "</span>",
        "trimming": true
      }
    },
    "artist": {
      "within": {
        "prefix": ["<span>", "Artist:"],
        "suffix": "</span>",
        "trimming": true
      }
    }
  }
}

// Instantiate an expression
var exjn = require('exjn');
var dictionaryExpression = new exjn.Expression(dictionaryExpressionJSON);

// The sample to extract
var arraySample = ' <span>Title: The Title</span> <span> Author:The Author  </span><span> Artis:</span>';

// Extract out a dictionary
var result = dictionaryExpression.extract(singleSample);

// The result should be
//
// result = {
//   "title": "The Title",
//   "author: "The Author"
//  }
//
// Be reminded that "Artis:" does not match "Artist:"
```


[travis-badge]: https://travis-ci.org/nfam/exjn.js.svg
[travis-url]: https://travis-ci.org/nfam/exjn.js

[coveralls-badge]: https://coveralls.io/repos/nfam/exjn.js/badge.svg
[coveralls-url]: https://coveralls.io/github/nfam/exjn.js

[license-badge]: https://img.shields.io/github/license/nfam/exjn.js.svg