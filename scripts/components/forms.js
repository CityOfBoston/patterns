'use strict'
// This module controls the City of Boston table component
// ---------------------------
var BostonInput = (function () {

  var checkboxes;
    
    // Activate keyboard focus on checkboxes.
    function chkbxfield(){
      for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('keypress', function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          if (checkboxes) {
            if (ev.keyCode === 13) {
              this.click();
            }
          }
        })
      }
    }

  function start() {
    // Find all checkboxes and add click trigger to "enter" keyboard key.
    checkboxes = document.querySelectorAll('input[type="checkbox"]');

    if(checkboxes){
      chkbxfield();
    }

  }
  return {
    start: start
  }
})();

BostonInput.start();
