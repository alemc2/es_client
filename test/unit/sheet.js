if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(function (require) {

var Sheet = require('es_client/models/sheet');
var config = require('es_client/config');
var expect = require('chai').expect;
var should = require('chai').should();
var sinon = require('sinon');
var connect = require('es_client/lib/share_db').connect;
var disconnect = require('es_client/lib/share_db').disconnect;
var uid = require('es_client/helpers/uid');

describe('Sheet', function(){
  var sheet, events, data;

  beforeEach(function(done){
    initializeSheet({},done);
  });

  afterEach(function(done){
    resetSheet(done);
  });


  function initializeSheet(sheet_options,done){
    if(data){
      return resetSheet(function(){
        initializeSheet(sheet_options,done);
      });
    }
    var o = {id: 'test-'+uid()}

    connect(o, function(err,test_data){
      events = [];
      data = test_data;
      if(sheet_options) data.sheets.addSheet(sheet_options);
      sheet = data.sheets.last();
      sheet.on('all',function(){
        events.push({
          name: arguments[0],
          args: Array.prototype.slice.call(arguments,1)
        });
      });
      done(err);
    });
  }
  
  function resetSheet(done){
    if(!data) return done();
    disconnect(data,function(err){
      data = undefined;
      sheet = undefined;
      events = undefined;
      done(err);
    });
  }

  var addCell = function(row,col,val){
    sheet.updateCell(row,col,val);
    sheet.commitCell(row,col);
  };
  
  var clearEvents = function(){
    events = [];
  };

  describe('default initialization', function(){

    it('rowCount should get row count', function(){
      sheet.rowCount().should.equal(config.DEFAULT_ROW_COUNT);
    });

    it('colCount should get column count', function(){
      sheet.colCount().should.equal(config.DEFAULT_COL_COUNT);
    });

    it('rowIds should return an array of ids', function(){
      var row_ids = sheet.rowIds();
      row_ids.length.should.equal(config.DEFAULT_ROW_COUNT);
    });

    it('colIds should return an array of ids', function(){
      var col_ids = sheet.colIds();
      col_ids.length.should.equal(config.DEFAULT_COL_COUNT);
    });
    it('colAt should return the id of the column at index', function(){
      var col_id = sheet.colIds()[0];
      sheet.colAt(0).should.equal(col_id);
    });
    it('rowAt should return the id of the row at index', function(){
      var row_id = sheet.rowIds()[0];
      sheet.rowAt(0).should.equal(row_id);
    });
    it('letterToIndex should return an index of a given letter in the alphabet', function(){
      sheet.identifierToIndex('A').should.equal(0);
      sheet.identifierToIndex('a').should.equal(0);
      sheet.identifierToIndex('Z').should.equal(25);
      sheet.identifierToIndex('AA').should.equal(26);
      sheet.identifierToIndex('BA').should.equal(52);
      sheet.identifierToIndex('ZZ').should.equal(701);
      sheet.identifierToIndex('ZZZ').should.equal(18277);
    });
  });


  describe('initialization with data', function(){
    var data;

    beforeEach(function(done){
      default_cell = function(rowcol){ return {value:rowcol, display_value: rowcol, type: 'string', styles: [] } } ;
      data = {
        cols: ['a','b','c'],
        rows: ['1','2','3','4'],
        cells:{
          '1':{'a':default_cell('a1'),'b':default_cell('b1'),'c':default_cell('c1')},
          '2':{'a':default_cell('a2'),'b':default_cell('b2'),'c':default_cell('c2')},
          '3':{'a':default_cell('a3'),'b':default_cell('b3'),'c':default_cell('c3')},
          '4':{'a':default_cell('a4'),'b':default_cell('b4'),'c':default_cell('c4')}
        }
      };
      initializeSheet(data,done);
    });

    it('rowCount should get row count', function(){
      sheet.rowCount().should.equal(data.rows.length);
    });

    it('colCount should get column count', function(){
      sheet.colCount().should.equal(data.cols.length);
    });

    it('rowIds should return an array of ids', function(){
      var row_ids = sheet.rowIds();
      row_ids.should.deep.equal(data.rows);
    });

    it('colIds should return an array of ids', function(){
      var col_ids = sheet.colIds();
      col_ids.should.deep.equal(data.cols);
    });

    it('colAt should return the id of the column at index', function(){
      sheet.colAt(0).should.equal('a');
    });

    it('rowAt should return the id of the row at index', function(){
      sheet.rowAt(0).should.equal('1');
    });
    it('getCell should return the correct cell', function(){
      sheet.getCell('1','a').should.deep.equal(default_cell('a1'));
    });
    it('getCells should return the correct data', function(){
      sheet.getCells().should.deep.equal(data.cells);
    });
  });

  describe('sheet#updateCell', function(){
    var new_value,row_id, col_id, success;

    beforeEach(function(done){
      initializeSheet({},function(){
        new_value = 5;
        row_id = sheet.rowIds()[0];
        col_id = sheet.colIds()[0];
        success = sheet.updateCell(row_id,col_id,new_value);
        done();
      });
    });

    it('should return true', function(){
      success.should.equal(true);
    });

    it('should create a new object in cells if none exists', function(){
      var cell = sheet.getCell(row_id,col_id);
      cell.value.should.equal(new_value);
    });

    it('should upate object in modified cells if it already exists', function(){
      sheet.updateCell(row_id,col_id,8);
      var cell = sheet.getCell(row_id,col_id);
      cell.value.should.equal(8);
    });

    it('should trigger an update_cell and send event',function(){
      clearEvents();
      sheet.updateCell(row_id,col_id,new_value);
      events.length.should.equal(2);
      events[0].name.should.equal('update_cell');
      events[1].name.should.equal('send');
    });

    it('update_cell event should contain correct data',function(){
      var cell = events[0].args[0];
      cell.row_id.should.equal(row_id);
      cell.col_id.should.equal(col_id);
      cell.cell_display.should.equal(new_value);
      cell.id.should.equal(sheet.id);
    });
  });

  describe('sheet#commitCell', function(){
    var new_value,row_id, col_id, success;

    beforeEach(function(done){
      initializeSheet({},function(){
        new_value = "=1+1";
        row_id = sheet.rowIds()[0];
        col_id = sheet.colIds()[0];
        row2 = sheet.rowIds()[0];
        col2 = sheet.colIds()[0];
        sheet.updateCell(row_id,col_id,new_value);
        sheet.updateCell(row_id,col_id,new_value);
        sheet.commitCell(row_id,col_id);
        done();
      });
    });

    it('determines cell type', function(){
      sheet.updateCell(row2,col2,3);
      sheet.commitCell(row2,col2);
      sheet.getCell(row2,col2).type.should.not.be.empty;
      sheet.getCell(row2,col2).type.should.not.eql('new');
    });

    it('calls Sheet#getCellDisplay', function(done){
      var called = false;
      sheet.getCellDisplay = function(){
        called = true;
      };
      sheet.commitCell(row2,col2);
      called.should.equal(true);
      done();
    });

    it('replaces original cell with updated cell', function(){
      sheet.updateCell(row2,col2,3);
      sheet.commitCell(row2,col2);
      sheet.getCell(row2,col2).value.should.equal(3);
      sheet.getCell(row2,col2).type.should.equal('number');
      sheet.updateCell(row2,col2,'test');
      sheet.commitCell(row2,col2);
      sheet.getCell(row2,col2).type.should.equal('string');
      sheet.getCell(row2,col2).value.should.equal('test');
    });
    
    it('should call sheet#refreshCell for each formula cell in the sheet', function(){
      var count = 0;
      sheet.cells = {};
      sheet.updateCell('0','0','=1+1');
      sheet.updateCell('0','1','=1+1');
      sheet.commitCell('0','0');
      sheet.commitCell('0','1');
      sheet.refreshCell = function(){
        count += 1;
      };
      sheet.updateCell('0','2','foo');
      sheet.commitCell('0','2');
      count.should.equal(2);
    });

    it('should change the cell value', function(){
      sheet.getCell(row_id,col_id).value.should.equal(new_value.toString());
    });

    it('should parse the display value', function(done){
      initializeSheet({},function(){
        sheet.updateCell(row_id,col_id,'=1+1');
        sheet.commitCell(row_id,col_id);
        sheet.getCellDisplay(sheet.getCell(row_id,col_id)).should.equal(2);
        done();
      });
    });

    it('should emit a commit_cell event', function(){
      clearEvents();
      sheet.commitCell(row_id,col_id);
      events.length.should.equal(4);
      events[0].name.should.equal('commit_cell');
      events[1].name.should.equal('send');
    });

    it('should return same display value for non formulas', function(){
      sheet.updateCell(row_id,col_id,'foo');
      sheet.commitCell(row_id,col_id);
      sheet.getCellDisplay(sheet.getCell(row_id,col_id)).should.equal('foo');
    });

  });

  describe('sheet#refreshCell', function(){
    var new_value,row_id, col_id, success;

    beforeEach(function(done){
      initializeSheet({},function(){
        row_id = sheet.rowIds()[0];
        col_id = sheet.colIds()[0];
        done();
      });
    });

    it('should recalculate a cells value', function(){
      sheet.updateCell(row_id,col_id,'=1+1');
      sheet.commitCell(row_id,col_id);
      cell = sheet.getCell(row_id,col_id);
      sheet.refreshCell(row_id,col_id).should.equal(2);
      cell.value = '=2+1';
      sheet.refreshCell(row_id,col_id).should.equal(3);
    });

    it('should emit cell_updated event',function(){
      clearEvents();
      sheet.refreshCell(row_id,col_id);
      events.length.should.eql(1);
      events[0].name.should.eql('update_cell');
    });
  });

  describe('sheet#getCellType', function(){
    it('should return "number" if value is a number',function(){
      sheet.getCellType(3).should.equal('number');
      sheet.getCellType('3').should.equal('number');
      sheet.getCellType('onetwo3').should.not.equal('number');
      sheet.getCellType('=3+3').should.not.equal('number');
    });
    it('should return "string" if value is a string', function(){
      sheet.getCellType('onetwo3').should.equal('string');
      sheet.getCellType('3').should.not.equal('string');
      sheet.getCellType('=3+3').should.not.equal('string');
    });
    it('should return "formula" if vlaue is a formula', function(){
      sheet.getCellType('=3+3').should.equal('formula');
      sheet.getCellType('"=3"').should.not.equal('formula');
      sheet.getCellType(3).should.not.equal('formula');
    });
  });

  describe('insert row', function(){
    var old_row_id, new_row_id;
  
    beforeEach(function(done){
      initializeSheet({},function(){
        sheet.disableSend();
        old_row_id = sheet.rowIds()[1];
        new_row_id = sheet.insertRow(1);
        done();
      });
    });
    
    it('should put the new row in the correct position', function(){
      sheet.rowIds()[1].should.equal(new_row_id);
    });

    it('should move the original row over by one position', function(){
      sheet.rowIds()[2].should.equal(old_row_id);
    });

    it('should trigger an insert_row event',function(){
      events.length.should.equal(1);
      events[0].name.should.equal('insert_row');
      events[0].args[0].row_id.should.equal(new_row_id);
      events[0].args[0].sheet_id.should.equal(sheet.id);
    });
  });

  describe('delete row', function(){
    var row_id, col_id, cell_id;

    beforeEach(function(done){
      initializeSheet({},function(){
        sheet.disableSend();
        row_id = sheet.rowIds()[0];
        col_id = sheet.colIds()[0];
        cell_id = sheet.updateCell(row_id,col_id,5);
        clearEvents(); 
        sheet.deleteRow(row_id);
        done();
      });
    });

    it('should remove a single row', function(){
      sheet.rowIds()[0].should.not.equal(row_id);
    });

    it('should remove the deleted row\'s cells', function(){
      expect(sheet.getCell(row_id,col_id)).to.be.undefined;
    });
    
    it('should trigger a delete row event',function(){
      events.length.should.equal(1);
      events[0].name.should.equal('delete_row');
      events[0].args[0].row_id.should.equal(row_id);
      events[0].args[0].sheet_id.should.equal(sheet.id);
    });
  });

  describe('sort rows', function(){
    var col_id;

    beforeEach(function(done){
      initializeSheet({},function(){
        col_id = sheet.colAt(0);
        sheet.updateCell(sheet.rowAt(0),col_id,"c");
        sheet.updateCell(sheet.rowAt(1),col_id,"a");
        sheet.updateCell(sheet.rowAt(2),col_id,"b");
        sheet.sortRows(col_id);
        done();
      });
    });
    
    it('should put the new row in the correct position', function(){
      sheet.getCellValue(sheet.rowAt(0),col_id).should.equal("a");
      sheet.getCellValue(sheet.rowAt(1),col_id).should.equal("b");
      sheet.getCellValue(sheet.rowAt(2),col_id).should.equal("c");
    });
  });

  describe('insert column', function(){
    var second_col_id, new_row_id, new_col_id;
    
    beforeEach(function(done){
        initializeSheet({},function(){
        sheet.disableSend();
        second_col_id = sheet.colIds()[1];
        new_col_id = sheet.insertCol(1);
        done();
      });
    });

    it('should put the col in the correct position', function(){
      sheet.colIds()[1].should.equal(new_col_id);
    });

    it('should move the original call over one position', function(){
      sheet.colIds()[2].should.equal(second_col_id);
    });

    it('should trigger an insert column event',function(){
      events.length.should.equal(1);
      events[0].name.should.equal('insert_col');
      events[0].args[0].col_id.should.equal(new_col_id);
      events[0].args[0].sheet_id.should.equal(sheet.id);
    });
  });

  describe('delete column', function(){
    var row_id, col_id, cell_id;

    beforeEach(function(done){
      initializeSheet({},function(){
        sheet.disableSend();
        row_id = sheet.rowIds()[0];
        col_id = sheet.colIds()[0];
        cell_id = sheet.updateCell(row_id,col_id,5);
        clearEvents(); 
        sheet.deleteCol(col_id);
        done();
      });
    });

    it('should remove a single column', function(){
      sheet.colIds()[0].should.not.equal(col_id);
    });

    it('should remove the deleted column\'s cells', function(){
      expect(sheet.getCell(row_id,col_id)).to.be.undefined;
    });
    
    it('should trigger a delete column event',function(){
      events.length.should.equal(1);
      events[0].name.should.equal('delete_col');
      events[0].args[0].col_id.should.equal(col_id);
      events[0].args[0].sheet_id.should.equal(sheet.id);
    });
  });

  describe('formula parsing', function(){
    beforeEach(function(done){
        initializeSheet({},function(){
        row_id = sheet.rowAt(0);
        col_id = sheet.colAt(0);
        a1_value = '3';
        a11_value = '11';
        sheet.updateCell(row_id, col_id, a1_value);
        sheet.commitCell(row_id, col_id);
        new_row = sheet.rowAt(0); 
        new_col = sheet.colAt(1); 
        done();
      });
    });

    it('should reference a cell by identifier', function(done){
      sheet.updateCell(new_row, new_col, '=A1');
      sheet.commitCell(new_row, new_col);
      sheet.getCellDisplay(sheet.getCell(new_row, new_col)).should.equal(a1_value);
      done();
    });

    it('should reference cells in double digit ranges', function(done){
      sheet.updateCell('10', '0', a11_value);
      sheet.commitCell('10', '0');
      sheet.updateCell(new_row, new_col, '=A11');
      sheet.commitCell(new_row, new_col);
      sheet.getCellDisplay(sheet.getCell(new_row, new_col)).should.equal(a11_value);
      done();
    });

    it('should have a cell reference function', function(done){
      sheet.updateCell(row_id, col_id, a1_value);
      sheet.commitCell(row_id, col_id);
      sheet.updateCell(new_row,new_col,"=cellReference('" + sheet.id +"','0','0')");
      sheet.getCellDisplay(sheet.getCell(new_row, new_col)).should.equal(a1_value);
      done();
    });
    it('should convert excel style cell references to ethersheet style cell references', function(){
      sheet.updateCell(row_id, col_id, '=B2');
      sheet.commitCell(row_id, col_id);
      sheet.getCell(row_id,col_id).value.should.equal('=cellReference("' + sheet.id +'", "1", "1")');
    });
  
    it('should convert es style cell reference to excel style when getDisplayFormula is called', function(){
      sheet.updateCell(row_id, col_id, '=B2');
      sheet.commitCell(row_id, col_id);
      sheet.getDisplayFormula(row_id,col_id).should.equal('=B2');
    });

    it('should deal with deleting or adding columns and rows', function(){
      addCell('0','0', '123');
      addCell('0','1', '=A1'); 
      sheet.insertCol(0); 
      sheet.getDisplayFormula('0', '1').should.equal('=B1'); 
    });

    it('should deal with math on nested cell references', function(){
      test_val = '123';
      addCell('0','0', test_val);
      addCell('0','1', '=A1');
      addCell('0','2', '=B1 * 2');
      sheet.getCellDisplay(sheet.getCell('0','2')).should.equal(test_val * 2);
    });
  });
  describe('add formatting to cell', function(){
    it('should add a formatting class to the cell', function(){
      var row_id = sheet.rowAt(0);
      var col_id = sheet.colAt(0);
      var cls = 'bg-red';
      sheet.addCell(row_id,col_id,{value:'1', type:'new'});
      sheet.addFormatToCell(row_id,col_id,cls);
      sheet.getCell(row_id,col_id).formatting.length.should.equal(1);
      sheet.getCell(row_id,col_id).formatting[0].should.equal(cls);
    });
  });
  describe('userland functions', function(){
    it('should display an error when the function does not exist', function(){
      addCell('0','0', '=KITTENS(123)');
      sheet.getCellDisplayById('0','0').should.equal('ERR: No such function.');
    });
    it('should not care about capitalization', function(){
      addCell('0','0', '=sum(2,2,4)');
      sheet.getCellDisplayById('0','0').should.equal(8);
      addCell('0','0', '=SuM(2,2,4)');
      sheet.getCellDisplayById('0','0').should.equal(8);
    });
    it('should have SUM(...)', function(){
      addCell('0','0', '=SUM(2,2,4)');
      sheet.getCellDisplayById('0','0').should.equal(8);
      addCell('0', '1', '=SUM(A1,2)');
      sheet.getCellDisplayById('0','1').should.equal(10);
    });
    it('should typecast arguments', function(){
      addCell('0', '0', '123');
      addCell('0', '1', '123');
      addCell('0', '2', '=SUM(A1,B1)');
      sheet.getCellDisplayById('0','2').should.equal(246);
    });
  });

});

});
