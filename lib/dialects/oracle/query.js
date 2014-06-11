// Oracle Query Builder & Compiler
// ------
module.exports = function(client) {

var _             = require('lodash');
var inherits      = require('inherits');
var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

// Query Builder
// -------

// Extend the QueryBuilder base class to include the "Formatter"
// which has been defined on the client, as well as the
function QueryBuilder_Oracle() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_Oracle, QueryBuilder);

// Query Compiler
// -------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_Oracle() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_Oracle, QueryCompiler);

QueryCompiler_Oracle.prototype._emptyInsertValue = '() values ()';

QueryCompiler_Oracle.prototype.insert = function() {
  var sql = 'insert into ' + this.tableName + ' ';
  if (_.isEmpty(this.single.insert)) {
    sql += this._emptyInsertValue;
  } else {
    var insertData = this._prepInsert(this.single.insert);
    if (_.isString(insertData)) {
      sql += insertData;
    } else  {
      
      if (insertData.values.length === 1) {
        sql += '(' + this.formatter.columnize(insertData.columns) + ') values (' +
        _.map(insertData.values, this.formatter.parameterize, this.formatter).join('), (') + ')';
      }
      else { // oracle multi workaround
        sql = 'insert all ' + _.map(insertData.values, function(v, index) { 
            return 'into ' + this.tableName 
              + ' (' + insertData.columns.join(', ') + ') values (' + _.map(v, this.formatter.parameterize, this.formatter).join(', ') 
              + ')';
          }.bind(this)).join(' ') + ' select * from dual' 
      }
    }
  }
  return sql;
};

// Update method, including joins, wheres, order & limits.
QueryCompiler_Oracle.prototype.update = function() {
  var join    = this.join();
  var updates = this._prepUpdate(this.single.update);
  var where   = this.where();
  var order   = this.order();
  var limit   = this.limit();
  return 'update ' + this.tableName +
    (join ? ' ' + join : '') +
    ' set ' + updates.join(', ') +
    (where ? ' ' + where : '') +
    (order ? ' ' + order : '') +
    (limit ? ' ' + limit : '');
};

QueryCompiler_Oracle.prototype.forUpdate = function() {
  return 'for update';
};
QueryCompiler_Oracle.prototype.forShare = function() {
  return 'lock in share mode';
};

// Compiles a `columnInfo` query.
QueryCompiler_Oracle.prototype.columnInfo = function() {
  var column = this.single.columnInfo;
  return {
    sql: 'SELECT * FROM user_tab_cols WHERE table_name = :1',
    bindings: [this.single.table],
    output: function(resp) {
      var out = _.reduce(resp, function(columns, val) {
        console.log(val);
        columns[val.COLUMN_NAME] = {
          defaultValue: val.COLUMN_DEFAULT,
          type: val.DATA_TYPE,
          maxLength: val.CHARACTER_MAXIMUM_LENGTH,
          nullable: (val.IS_NULLABLE === 'YES')
        };
        return columns;
      }, {});
      return column && out[column] || out;
    }
  };
};

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
client.QueryBuilder  = QueryBuilder_Oracle;
client.QueryCompiler = QueryCompiler_Oracle;

};