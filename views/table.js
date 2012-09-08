if (typeof define !== 'function') { var define = require('amdefine')(module) }
define( function(require){

/*
    TableView
*/
var $ = require('jquery');
var Backbone = require('backbone');
var t = require('es_client/templates');

return Backbone.View.extend({
  initialize: function(o){
    this.sheet = this.model;
    this.num_row = this.sheet.rowCount();
    this.num_col = this.sheet.colCount();
    this.elements_initialized = false;
  },
  render: function(){
    this.initializeElements();
    this.renderTable(); 
    return this;
  },
  initializeElements: function(){
    if(this.elements_initialized) return;
    this.$el.html(t.sheet_table({id:this.getId()}));
    this.$table = $('#data-table-'+this.getId());
    this.$table_col_headers = $('#column-headers-'+this.getId());
    this.$table_row_headers = $('#row-headers-'+this.getId());
    this.elements_initialized = true;
  },
  getId: function(){
    return this.model.cid;
  },
  renderTable: function(){
    var html = t.table({num_row:this.num_row,num_col:this.num_col});
    this.$table.html(html);
    html = t.table_col_headers({num_col:this.num_col});
    this.$table_col_headers.html(html);
    html = t.table_row_headers({num_row:this.num_row});
    this.$table_row_headers.html(html);
  }
});

});
