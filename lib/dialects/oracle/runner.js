// Oracle Runner
// ------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

var Promise  = require('../../promise');
var Runner   = require('../../runner');
var helpers    = require('../../helpers');

// Inherit from the `Runner` constructor's prototype,
// so we can add the correct `then` method.
function Runner_Oracle() {
  this.client = client;
  Runner.apply(this, arguments);
}
inherits(Runner_Oracle, Runner);

// Grab a connection, run the query via the Oracle streaming interface,
// and pass that through to the stream we've sent back to the client.
Runner_Oracle.prototype._stream = Promise.method(function(sql, stream, options) {
  var runner = this;
  return new Promise(function(resolver, rejecter) {
    stream.on('error', rejecter);
    stream.on('end', resolver);
    runner.connection.execute(sql.sql, sql.bindings).stream(options).pipe(stream);
  });
});

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Runner_Oracle.prototype._query = Promise.method(function(obj) {
  var sql = obj.sql;
  if (this.isDebugging()) this.debug(obj);
  if (obj.options) sql = _.extend({sql: sql}, obj.options);
  var connection = this.connection;
  if (!sql) throw new Error('The query is empty');
  return new Promise(function(resolver, rejecter) {
    connection.execute(sql, obj.bindings, function(err, rows, fields) {
      if (err) return rejecter(err);

      // make keys lower case
      // TODO: find better way?
      if (rows instanceof Array)
      {
        rows = _.map(rows, function (r) {;
          var key, keys = Object.keys(r);
          var n = keys.length;
          var newobj={}
          while (n--) {
            key = keys[n];
            newobj[key.toLowerCase()] = r[key];
          }
          return newobj;
        });
      }
      obj.response = [rows, fields];

      resolver(obj);
    });
  });
});

// Process the response as returned from the query.
Runner_Oracle.prototype.processResponse = function(obj) {
  var response = obj.response;
  var method   = obj.method;
  var rows     = response[0];
  var fields   = response[1];
  if (obj.output) return obj.output.call(this, rows, fields);
  switch (method) {
    case 'select':
    case 'pluck':
    case 'first':
      var resp = helpers.skim(rows);
      if (method === 'pluck') return _.pluck(resp, obj.pluck);
      return method === 'first' ? resp[0] : resp;
    case 'insert':
      return [rows.insertId];
    case 'del':
    case 'update':
      return rows.affectedRows;
    default:
      return response;
  }
};

// Assign the newly extended `Runner` constructor to the client object.
client.Runner = Runner_Oracle;

};