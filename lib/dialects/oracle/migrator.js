// Oracle Migrator
// ------
module.exports = function(client) {

var Migrator = require('../../migrate');
var inherits = require('inherits');

function Migrator_Oracle() {
  this.client = client;
  Migrator.apply(this, arguments);
}
inherits(Migrator_Oracle, Migrator);

client.Migrator = Migrator_Oracle;

};