'use strict'
// This module controls the City of Boston table component
// ---------------------------
var BostonTable = (function () {

  function columnToTable(tables, reset) {
    // Loop through all vertical tables on the page.
    for (var i = 0, length = tables.length; i < length; i++) {
      if (reset) {
        //console.log(tables[i]);
        var updatedTables = document.querySelectorAll('.responsive-table--vertical');
        for (var j = 0, length = updatedTables.length; j < length; j++) {
          if (i == j) {
            console.log("Existing: ");
            console.log(updatedTables[j]);
            console.log("");
            console.log("Orig: ");
            console.log(tables[i]);
            updatedTables[j].replaceWith(tables[i]);
          }
        }
        return;
      }
      var newTable = document.createElement('table');
      newTable.setAttribute('class', 'responsive-table responsive-table--vertical');
      var maxColumns = 0;
      // Find the max number of columns
      for(var r = 0; r < tables[i].rows.length; r++) {
        if(tables[i].rows[r].cells.length > maxColumns) {
          maxColumns = tables[i].rows[r].cells.length;
        }
      }
      for(var c = 0; c < maxColumns; c++) {
        newTable.insertRow(c);
        for(var r = 0; r < tables[i].rows.length; r++) {
          if(tables[i].rows[r].length <= c) {
            newTable.rows[c].insertCell(r);
            newTable.rows[c].cells[r] = '-';
          }
          else if (tables[i].rows[r].cells[c].tagName != 'TH') {
            newTable.rows[c].insertCell(r);
            // Set the table data value.
            newTable.rows[c].cells[r].innerHTML = tables[i].rows[r].cells[c].innerHTML;
            // Set the table data attributes used by pseudo class.
            newTable.rows[c].cells[r].setAttribute('data-label', tables[i].rows[r].cells[c].getAttribute('data-label'));
          }
        }
      }
      tables[i].replaceWith(newTable);
    }
  }

  function start() {
    // Check for vertical tables.
    var tables = document.querySelectorAll('.responsive-table--vertical');

    window.onresize = function(event) {
    // Get the current window size.
    var width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;

    // If there are vertical tables, and we're on a mobile screen, run...
    if (tables.length > 0 && width <= 768) {
      //console.log("small");
      columnToTable(tables);
    }
    else {
      //console.log("large");
      columnToTable(tables, "reset");
    }
    };
  }
  return {
    start: start
  }
})();

BostonTable.start();
