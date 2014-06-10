// Oracle Column Builder & Compiler
// -------
module.exports = function(client) {

var inherits = require('inherits');
var Schema   = require('../../../schema');
var helpers  = require('../../../helpers');

// Column Builder
// -------

function ColumnBuilder_Oracle() {
  Schema.ColumnBuilder.apply(this, arguments);
}
inherits(ColumnBuilder_Oracle, Schema.ColumnBuilder);

// Column Compiler
// -------

function ColumnCompiler_Oracle() {
  this.Formatter = client.Formatter;
  this.modifiers = ['nullable', 'defaultTo', 'comment'];
  Schema.ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_Oracle, Schema.ColumnCompiler);

// Types
// ------

ColumnCompiler_Oracle.prototype.increments = function() { 
  this.pushAdditional(function() {
    var index = this.tableCompiler._indexCommand('primary', this.tableCompiler.tableNameRaw, this.args[0]);
    this.pushQuery('alter table ' + this.tableCompiler.tableName() + ' add constraint ' + index + ' primary key (id)' );
  });
  // this.pushAdditional(function() {
  //   this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
  //     this.formatter.wrap(this.args[0]) + " is " + "''");
  // });
  return 'number(9) not null'; 
};
ColumnCompiler_Oracle.prototype.bigincrements = 'number(18) not null';
ColumnCompiler_Oracle.prototype.bigint = 'number(18)';
ColumnCompiler_Oracle.prototype.double = function(precision, scale) {
  if (!precision) return 'double';
  return 'decimal(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
};
ColumnCompiler_Oracle.prototype.integer = function(length) {
  length = length ? '(' + this._num(length, 11) + ')' : '';
  return 'number' + length;
};
ColumnCompiler_Oracle.prototype.mediumint = 'mediumint';
ColumnCompiler_Oracle.prototype.smallint = 'smallint';
ColumnCompiler_Oracle.prototype.tinyint = function(length) {
  length = length ? '(' + this._num(length, 1) + ')' : '';
  return 'number' + length;
};
ColumnCompiler_Oracle.prototype.text = function(column) {
  switch (column) {
    case 'medium':
    case 'mediumtext':
      return 'nvarchar2(2000)';
    case 'long':
    case 'longtext':
      return 'long';
    default:
      return 'nvarchar2(2000)';
  }
};
ColumnCompiler_Oracle.prototype.mediumtext = function() {
  return this.text('nvarchar2(2000)');
};
ColumnCompiler_Oracle.prototype.longtext = function() {
  return this.text('long');
};
ColumnCompiler_Oracle.prototype.json = 'long';
ColumnCompiler_Oracle.prototype.float = function(precision, scale) {
  return 'float(' + precision + ',' + scale + ')';
};
ColumnCompiler_Oracle.prototype.typeDecimal = function(precision, scale) {
  return 'decimal(' + precision + ', ' + scale + ')';
};
ColumnCompiler_Oracle.prototype.enu = function(allowed) {
  return 'VARCHAR2(10) check(' + this.args[0] + " in('" + allowed.join("', '")  + "'))";
  return "enum('" + allowed.join("', '")  + "')";
};
ColumnCompiler_Oracle.prototype.datetime = 'date';
ColumnCompiler_Oracle.prototype.timestamp = 'timestamp';
ColumnCompiler_Oracle.prototype.bit = function(length) {
  return length ? 'bit(' + length + ')' : 'bit';
};

// Modifiers
// ------

ColumnCompiler_Oracle.prototype.defaultTo = function(value) {
  var defaultVal = ColumnCompiler_Oracle.super_.prototype.defaultTo.apply(this, arguments);
  if (this.type != 'blob' && this.type.indexOf('text') === -1) {
    return defaultVal;
  }
  return '';
};

ColumnCompiler_Oracle.prototype.comment = function(comment) {
  this.pushAdditional(function() {
    this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' +
      this.formatter.wrap(this.args[0]) + " is " + (comment ? "'" + comment + "'" : "''"));
  }, comment);
};

client.ColumnBuilder = ColumnBuilder_Oracle;
client.ColumnCompiler = ColumnCompiler_Oracle;

};