if (typeof define !== 'function') { var define = require('amdefine')(module) }
define( function(require,exports,module){

var _ = require('underscore');
var helpers = require('es_client/helpers');
module.exports = module.exports || {};
module.exports['import_dialog'] = _.template("<div id='es-modal-close'>[close]</div><h2>Import CSV</h2>\n<form action=\"/import/csv\" method=\"post\" enctype=\"multipart/form-data\">\n  <input type=\"file\" name=\"csv_file\"><input type='submit' value='Upload'>\n  <input type=\"hidden\" name=\"sheet_id\" value=\"<%=sheet_id%>\">\n</form>\n\n\n");
module.exports['sheet_table'] = _.template("<div id=\"es-table-<%= id %>\" class=\"es-table-view\">\n  <table id=\"es-column-headers-<%=id%>\" class=\"es-column-headers es-table\">\n    <thead></thead>\n    <tbody></tbody>\n  </table>\n  <table id=\"es-row-headers-<%=id%>\" class=\"es-row-headers es-table\">\n    <thead></thead>\n    <tbody></tbody>\n  </table>\n  <div id=\"es-grid-container-<%= id %>\" class=\"es-grid-container\">\n    <table id=\"es-grid-<%= id %>\" class=\"es-grid es-table\">\n      <thead></thead>\n      <tbody id=\"es-data-table-<%=id%>\"></tbody>\n    </table>\n  </div>\n  <div class=\"es-table-corner\">\n    <div class=\"es-logo es-sidebar-toggle\">ES</div>\n  </div>\n</div>\n");
module.exports['table'] = _.template("<% var _ = require('underscore'); %>\n<% _.each(sheet.rowIds(), function(row_id){ %>\n  <tr id=\"<%= row_id %>\" class=\"es-table-row\" data-row_id=\"<%= row_id %>\">\n    <% _.each(sheet.colIds(), function(col_id){ %>\n      <td id=\"<%= row_id %>-<%= col_id %>\" class=\"<%= sheet.getCellFormatString(row_id,col_id) %>\" data-row_id=\"<%= row_id %>\" data-col_id=\"<%= col_id %>\" data-value=\"<%= sheet.getCellValue(row_id,col_id)%>\"><%= sheet.getCellDisplayById(row_id,col_id) %></td>\n    <% }) %>\n  </tr>\n<% }) %>\n");
module.exports['menu'] = _.template("<h2>EtherSheet</h2>\n<ul id=\"es-menu-list\">\n  <li>\n    <a  id=\"es-menu-add-column\" \n        class=\"es-menu-button\" \n        data-action=\"add_column\"><b>+</b> Add Column</a>\n  </li><li>\n    <a  id=\"es-menu-remove-column\" \n        class=\"es-menu-button\" \n        data-action=\"remove_column\"><b>-</b> Remove Column</a>\n  </li><li>\n    <a  id=\"es-menu-add-row\" \n        class=\"es-menu-button\" \n        data-action=\"add_row\"><b>+</b> Add Row</a>\n  </li><li>\n    <a  id=\"es-menu-remove-column\" \n        class=\"es-menu-button\" \n        data-action=\"remove_row\"><b>-</b> Remove Row</a>\n  </li><li>\n    <a  id=\"es-menu-import-csv\"\n        class=\"es-menu-button\" \n        data-action=\"import_csv\"><b>&lt;&lt;</b> Import CSV</a>\n  </li><li>\n    <a  id=\"es-menu-export-csv\"\n        class=\"es-menu-button\"\n        href=\"<%=document.URL%>.csv\"\n        target=\"_blank\"><b>&gt;&gt;</b> Export CSV</a>\n  </li>\n</ul>\n<div class='clear'></div>\n");
module.exports['es_container'] = _.template("<div id=\"es-container\">\n  <div id=\"es-panel-0\" class=\"es-panel\">\n    <div id=\"es-menu-container\"></div>\n  </div>\n  <div id=\"es-panel-1\" class=\"es-panel\">\n    <div id=\"es-table-container\"></div>\n    <div id=\"es-expression-editor-container\"></div>    \n  </div>\n  <div id=\"es-modal-overlay\"><div id=\"es-modal-box\"></div></div>\n</div>\n");
module.exports['expression_editor'] = _.template("<a id='es-expression-wizard'>&#402;(x)</a>\n<textarea class=\"es-expression-editor-input\" type='text'></textarea>\n");
var templateWrapper = function(template){
  return function(data){
    data = data || {};
    data.require = require;
    return template(data);
  }
};
for(i in module.exports) module.exports[i] = templateWrapper(module.exports[i]);

});
