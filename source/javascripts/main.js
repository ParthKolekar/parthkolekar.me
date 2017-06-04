'use strict';

var main = (function() {
    var navbars;
    var activePage;
    var content;
    var animateContent = function(event) {
        var index = Array.prototype.indexOf.call(navbars, event.target);
        activePage.classList.remove('shown');
        activePage.classList.add('hidden');
        activePage = content[index];
        history.pushState(null, null, '#/' + activePage.id.split('-')[0]);
        activePage.classList.remove('hidden');
        activePage.classList.add('shown');
    };
    var getPageFromURL = function() {
        return decodeURI(location.hash).replace(/\/$/, '').replace(/^#/, '').replace(/^\//, '');
    };
    var getActivePage = function() {
        if (getPageFromURL() == 'contact') {
            return document.getElementById('contact-content');
        } else {
            return document.getElementById('home-content');
        }
    };
    var init = function() {
        navbars = document.querySelectorAll('.navbar');
        content = document.querySelectorAll('.content');
        activePage = getActivePage();
        if (!activePage) {
            activePage = content[0];
        }
        activePage.classList.remove('hidden');
        activePage.classList.add('shown');
        addEventListener('popstate', function() {
            activePage.classList.remove('shown');
            activePage.classList.add('hidden');
            activePage = getActivePage();
            if (!activePage) {
                activePage = content[0];
            }
            activePage.classList.remove('hidden');
            activePage.classList.add('shown');
        });
        for (var i = navbars.length - 1; i >= 0; i--) {
            if (navbars[i].id != 'resume-button' && navbars[i].id != 'blog-button') {
                navbars[i].addEventListener('click', animateContent, true);
            }
        }
    };
    init();
})();
