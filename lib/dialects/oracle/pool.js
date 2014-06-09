// Oracle Pool
// ------
module.exports = function(client) {

var inherits = require('inherits');
var Pool = require('../../pool');

function Pool_Oracle() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_Oracle, Pool);

client.Pool = Pool_Oracle;

};