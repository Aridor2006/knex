// Oracle Table Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Schema   = require('../../../schema');

// Table Builder
// ------

function TableBuilder_Oracle() {
  this.client = client;
  Schema.TableBuilder.apply(this, arguments);
}
inherits(TableBuilder_Oracle, Schema.TableBuilder);

// Table Compiler
// ------

function TableCompiler_Oracle() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Oracle, Schema.TableCompiler);

TableCompiler_Oracle.prototype.createQuery = function(columns) {
  var conn = {}, sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')';

  // Check if the connection settings are set.
  if (client.connectionSettings) {
    conn = client.connectionSettings;
  }

  this.pushQuery(sql);

  var hasComment = _.has(this.single, 'comment');
  if (hasComment) this.comment(this.single.comment);
};

TableCompiler_Oracle.prototype.addColumnsPrefix = 'add ';
TableCompiler_Oracle.prototype.dropColumnPrefix = 'drop ';

// Compiles the comment on the table.
TableCompiler_Oracle.prototype.comment = function(comment) {
  this.pushQuery('comment on table ' + this.tableName() + ' is ' + "'" + (this.single.comment || '') + "'");
};

TableCompiler_Oracle.prototype.changeType = function() {
  // alter table + table + ' modify ' + wrapped + '// type';
};

// Renames a column on the table.
TableCompiler_Oracle.prototype.renameColumn = function(from, to) {
  var table   = this.tableName();
  var wrapped = this.formatter.wrap(from) + ' ' + this.formatter.wrap(to);
  this.pushQuery({
    sql: 'show fields from ' + table + ' where field = ' +
      this.formatter.parameter(from),
    output: function(resp) {
      var column = resp[0];
      return this.query({
        sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
      });
    }
  });
};

TableCompiler_Oracle.prototype.index = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + "(" + this.formatter.columnize(columns) + ")");
};

TableCompiler_Oracle.prototype.primary = function(columns, indexName) {
  indexName = indexName || this._indexCommand('primary', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + " add constraint " + indexName + " primary key (" + this.formatter.columnize(columns) + ")");
};

TableCompiler_Oracle.prototype.unique = function(columns, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + " add constraint " + indexName + " unique (" + this.formatter.columnize(columns) + ")");
};

// Compile a drop index command.
TableCompiler_Oracle.prototype.dropIndex = function(columns, indexName) {
  indexName = indexName || this._indexCommand('index', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
};

// Compile a drop foreign key command.
TableCompiler_Oracle.prototype.dropForeign = function(columns, indexName) {
  indexName = indexName || this._indexCommand('foreign', this.tableNameRaw, columns);
  this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + indexName);
};

// Compile a drop primary key command.
TableCompiler_Oracle.prototype.dropPrimary = function() {
  this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
};

// Compile a drop unique key command.
TableCompiler_Oracle.prototype.dropUnique = function(column, indexName) {
  indexName = indexName || this._indexCommand('unique', this.tableNameRaw, column);
  this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
};

// Compile a foreign key command.
TableCompiler_Oracle.prototype.foreign = function(foreignData) {
  var sql = Schema.TableCompiler.prototype.foreign.apply(this, arguments);
  if (sql) {
    // Once we have the basic foreign key creation statement constructed we can
    // build out the syntax for what should happen on an update or delete of
    // the affected columns, which will get something like 'cascade', etc.
    if (foreignData.onDelete) sql += ' on delete ' + foreignData.onDelete;
    if (foreignData.onUpdate) sql += ' on update ' + foreignData.onUpdate;
    this.pushQuery(sql);
  }
};

TableCompiler_Oracle.prototype._indexCommand = function(type, tableName, columns) {
  return Schema.TableCompiler.prototype._indexCommand.apply(this, arguments).substr(0, 30);
};

client.TableBuilder = TableBuilder_Oracle;
client.TableCompiler = TableCompiler_Oracle;

};