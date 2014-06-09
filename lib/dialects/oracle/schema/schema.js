// Oracle Schema Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_Oracle() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_Oracle, Schema.Builder);

// Schema Compiler
// -------

function SchemaCompiler_Oracle() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_Oracle, Schema.Compiler);

// Rename a table on the schema.
SchemaCompiler_Oracle.prototype.renameTable = function(tableName, to) {
  this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
};

// Check whether a table exists on the query.
SchemaCompiler_Oracle.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select * from information_schema.tables where table_schema = ' +
      this.formatter.parameter(client.database()) +
      ' and table_name = ' +
      this.formatter.parameter(tableName),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

// Check whether a column exists on the schema.
SchemaCompiler_Oracle.prototype.hasColumn = function(tableName, column) {
  this.pushQuery({
    sql: 'show columns from ' + this.formatter.wrap(tableName) +
      ' like ' + this.formatter.parameter(column),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

SchemaCompiler_Oracle.prototype.dropTableIfExists = function(tableName) {
  this.pushQuery('\
      BEGIN \
        EXECUTE IMMEDIATE \'DROP TABLE ' + tableName + '\'; \
      EXCEPTION \
        WHEN OTHERS THEN\
        IF SQLCODE != -942 THEN\
          RAISE;\
        END IF;\
      END;');
};

client.SchemaBuilder = SchemaBuilder_Oracle;
client.SchemaCompiler = SchemaCompiler_Oracle;

};