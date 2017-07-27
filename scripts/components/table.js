'use strict'
// This module controls the City of Boston table component
// ---------------------------
var BostonTable = (function () {

  function columnToTable(tables) {
    // Loop through all vertical tables on the page.
    for (var i = 0, length = tables.length; i < length; i++) {
      // Get all the rows in current table.
      var rows = tables[i].rows;
      // Loop through each row.
      for (var j = 0; j < rows.length; j += 1) {
        // Get the current row.
        var row = tables[i].rows[j];
        // Get all the columns in the current row.
        var columns = row.cells
        // Loop through all the columns in the current row.
        for (var k = 0; k < columns.length; k++) {
          // Get the current column.
          var column = columns[k];
          // Print value.
          console.log(column.innerHTML);
        }
      }
    }
  }

  function start() {
    // Check for vertical tables
    var tables = document.querySelectorAll('.responsive-table--vertical');

    // If there are vertical tables, run...
    if (tables.length > 0) {
      columnToTable(tables);
    }
  }
  return {
    start: start
  }
})();

BostonTable.start();
