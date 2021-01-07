'use strict'

var BostonMenu = (function () {
  // Set height
  var secondaryNavs;
  var secondaryTriggers;
  var listItems;
  var secondaryNavItems;
  var backTriggers;
  var burger;
  var placeholder;
  var nav;
  var navMainmenu;
  var sticky;

  // activate class for sticky menu
  function mainMenuonScroll() {
    sticky = navMainmenu.offsetTop;

    if (window.pageYOffset > sticky) {
      navMainmenu.classList.add("sticky");
    } else {
      navMainmenu.classList.remove("sticky");
    }
  }

  function handleTrigger(ev, method) {

    var backTrigger;
    var secondaryNav;
    var trigger = ev.target;
    var parentItem = method === 'reset' ? trigger.parentNode.parentNode.parentNode : trigger.parentNode;
    var title = document.getElementById('nv-m-h-t');

    // Find the secondary nav and trigger
    for (var i = 0; i < parentItem.childNodes.length; i++) {
      if (parentItem.childNodes[i].classList && parentItem.childNodes[i].classList.contains('nv-m-c-l-l')) {
        secondaryNav = parentItem.childNodes[i];
      }

      if (parentItem.childNodes[i].classList && parentItem.childNodes[i].classList.contains('nv-m-c-a')) {
        trigger = parentItem.childNodes[i];
      }
    }

    // Find the backTrigger
    for (var i = 0; i < secondaryNav.childNodes.length; i++) {
      if (secondaryNav.childNodes[i].classList && secondaryNav.childNodes[i].classList.contains('nv-m-c-bc')) {
        backTrigger = secondaryNav.childNodes[i];
      }
    }

    if (method === 'nav') {
      for (var i = 0; i < listItems.length; i++) {
        if (parentItem != listItems[i]) {
          listItems[i].classList.add('nv-m-c-l-i--h');
        }
      }

      // Hide the trigger
      trigger.classList.add('nv-m-c-a--h');

      // Show the secondary nav
      secondaryNav.classList.remove('nv-m-c-l-l--h');

      // Show the back button
      backTrigger.classList.remove('nv-m-c-b--h');

      // Update the title
      title.innerHTML = trigger.innerHTML;
    } else {
      for (var i = 0; i < listItems.length; i++) {
        if (parentItem != listItems[i]) {
          listItems[i].classList.remove('nv-m-c-l-i--h');
        }
      }

      // Hide the trigger
      trigger.classList.remove('nv-m-c-a--h');

      // Show the secondary nav
      secondaryNav.classList.add('nv-m-c-l-l--h');

      // Show the back button
      backTrigger.classList.add('nv-m-c-b--h');

      // Update the title
      title.innerHTML = placeholder;
    }
  }

  function start() {
    burger = document.getElementById('brg-tr');
    listItems = document.querySelectorAll('.nv-m-c-l-i');
    backTriggers = document.querySelectorAll('.nv-m-c-b');
    secondaryTriggers = document.querySelectorAll('.nolink');
    secondaryNavs = document.querySelectorAll('.nv-m-c-l-l');
    secondaryNavItems = document.querySelectorAll('.nv-m-c-a--s');
    navMainmenu = document.getElementById("main-menu");

    var title = document.getElementById('nv-m-h-t');
    placeholder = title ? title.innerHTML : '';

    // Set the nav to display none when tabbing and block if buger is clicked.
    document.addEventListener('keydown', function(e) {
      if (burger) {
        burger.addEventListener('change', function (e) {
          document.querySelector('.nv-m').classList.remove("hidden");
        })
      }
      if (!burger.checked) {
        if (e.keyCode === 9) {
          document.querySelector('.nv-m').classList.add("hidden");
        }
      }
    })

    // Set the secondary navigation menus to hidden
    for (var i = 0; i < secondaryNavs.length; i++) {
      secondaryNavs[i].classList.add('nv-m-c-l-l--h');
    }

    // Get the secondary navigation triggers ready
    for (var i = 0; i < secondaryTriggers.length; i++) {
      // Set to active
      secondaryTriggers[i].classList.add('nolink--a');

      // Handle clicks
      secondaryTriggers[i].addEventListener('click', function(ev) {
        ev.preventDefault();
        handleTrigger(ev, 'nav');
      });
    }

    // Get the secondary navigation triggers ready
    for (var i = 0; i < backTriggers.length; i++) {
      backTriggers[i].addEventListener('click', function(ev) {
        ev.preventDefault();

        handleTrigger(ev, 'reset');
      });
    }

    // Set the secondary navigation menus to hidden
    for (var i = 0; i < secondaryNavItems.length; i++) {
      secondaryNavItems[i].classList.remove('nv-m-c-a--s');
      secondaryNavItems[i].classList.add('nv-m-c-a--p');
    }

    if (navMainmenu) {
      window.onscroll = function() {
        mainMenuonScroll()
      };
    }

  }

  return {
    start: start
  }
})()

BostonMenu.start()
