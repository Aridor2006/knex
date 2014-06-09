// Oracle Formatter
// ------
module.exports = function(client) {

var _            = require('lodash');
var Formatter = require('../../formatter');
var inherits  = require('inherits');

// The "formatter" is used to ensure all output is properly
// escaped & parameterized.
function Formatter_Oracle() {
  this.client = client;
  this.paramCount = 0;
  Formatter.apply(this, arguments);
}
inherits(Formatter_Oracle, Formatter);

Formatter_Oracle.prototype.operators = [
  '=', '<', '>', '<=', '>=', '<>', '!=',
  'like', 'not like', 'between', 'ilike',
  '&', '|', '^', '<<', '>>',
  'rlike', 'regexp', 'not regexp'
];

// Checks whether a value is a function... if it is, we compile it
// otherwise we check whether it's a raw
Formatter_Oracle.prototype.parameter = function(value) {
  var ret = Formatter.prototype.parameter.apply(this, arguments);
  if (ret == '?')
  {
    return ':' + (++this.paramCount);
  }
  return ret;
};

// Wraps a value (column, tableName) with the correct ticks.
Formatter_Oracle.prototype.wrapValue = function(value) {
  if (value === '*') return value;
  var matched = value.match(/(.*?)(\[[0-9]\])/);
  if (matched) return this.wrapValue(matched[1]) + matched[2];
  return value;
};

// Memoize the calls to "wrap" for a little extra perf.
var wrapperMemo = (function(){
  var memo = Object.create(null);
  return function(key) {
    if (memo.key === void 0) {
      memo[key] = this._wrapString(key);
    }
    return memo[key];
  };
}());

Formatter_Oracle.prototype._wrap = wrapperMemo;

// Assign the formatter to the the client.
client.Formatter = Formatter_Oracle;

};