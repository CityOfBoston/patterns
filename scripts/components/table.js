'use strict'
// This module controls the City of Boston table component
// ---------------------------
var BostonTable = (function () {

  function doit() {
    console.log('table');
  }

  function start() {
    // Check for vertical tables
    var tables = document.querySelectorAll('.responsive-table--vertical');

    // If there are vertical tables, run...
    if (tables.length > 0) {
      doit();
    }
  }
  return {
    start: start
  }
})();

BostonTable.start();
