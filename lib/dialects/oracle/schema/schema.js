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
  this.pushQuery('alter table ' + this.formatter.wrap(tableName) + ' rename to ' + this.formatter.wrap(to));
};

// Check whether a table exists on the query.
SchemaCompiler_Oracle.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select * from user_tables where lower(table_name) = ' +
      this.formatter.parameter(tableName),
    output: function(resp) {
      return resp.length > 0;
    }
  });
};

// Check whether a column exists on the schema.
SchemaCompiler_Oracle.prototype.hasColumn = function(tableName, column) {
  this.pushQuery({
    sql: 'SELECT column_name FROM user_tab_cols WHERE lower(table_name) = :1 AND lower(column_name) = :2',
    bindings: [this.formatter.wrap(tableName), column],
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