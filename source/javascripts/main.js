'use strict';

var main = (function() {
    var isTransitioning = false;
    var TRANSITION_DURATION = 1000;

    // Find the currently visible .content element
    var findActiveContent = function() {
        return document.querySelector('.content.shown') ||
               document.querySelector('.content') ||
               null;
    };

    // Initialize perfect-scrollbar if available
    var initScrollbar = function() {
        var container = document.getElementById('container');
        if (container && window.Ps) {
            Ps.initialize(container);
        }
    };

    // Set up the page layout after a PJAX swap
    // Returns the content element (left in .hidden state for animation)
    var setupNewContent = function() {
        var content = document.querySelectorAll('.content');
        for (var i = 0; i < content.length; i++) {
            content[i].classList.remove('shown');
            content[i].classList.add('hidden');
        }
        initScrollbar();
        return content[0] || null;
    };

    // Intercept all internal link clicks for PJAX navigation
    var initializeLinks = function() {
        document.body.addEventListener('click', function(event) {
            var a = event.target.closest('a');
            if (!a) return;

            // Skip external links, downloads, and new-tab links
            if (a.host !== window.location.host) return;
            if (a.hasAttribute('download')) return;
            if (a.getAttribute('target') === '_blank') return;

            // Skip hash-only links (handled by page-specific scripts)
            if (a.pathname === window.location.pathname && a.hash) return;

            event.preventDefault();
            if (isTransitioning) return;

            navigate(a.href);
        });
    };

    var navigate = function(url, isPopState) {
        if (isTransitioning) return;

        var currentUrl = window.location.href;
        if (url === currentUrl && !isPopState) return;

        isTransitioning = true;

        if (!isPopState) {
            history.pushState(null, null, url);
        }

        // Trigger exit animation on current content
        var activePage = findActiveContent();
        if (activePage) {
            activePage.classList.remove('shown');
            activePage.classList.add('hidden');
        }

        // Fetch new page in parallel with exit animation
        var fetchPromise = fetch(url).then(function(response) {
            return response.text();
        });
        var timerPromise = new Promise(function(resolve) {
            setTimeout(resolve, TRANSITION_DURATION);
        });

        Promise.all([fetchPromise, timerPromise]).then(function(results) {
            var htmlText = results[0];

            // Parse and swap DOM
            var parser = new DOMParser();
            var newDoc = parser.parseFromString(htmlText, 'text/html');
            var newWrapper = newDoc.querySelector('.page-wrapper');
            var oldWrapper = document.querySelector('.page-wrapper');

            if (newWrapper && oldWrapper) {
                oldWrapper.parentNode.replaceChild(newWrapper, oldWrapper);
            }

            document.title = newDoc.title;

            // Set up new content in .hidden state
            var newActivePage = setupNewContent();

            // Force reflow, then animate in
            if (newActivePage) {
                void newActivePage.offsetHeight;
            }

            setTimeout(function() {
                if (newActivePage) {
                    newActivePage.classList.remove('hidden');
                    newActivePage.classList.add('shown');
                }
                isTransitioning = false;
            }, 50);

        }).catch(function(err) {
            console.error('Navigation failed', err);
            isTransitioning = false;
            window.location.href = url;
        });
    };

    var init = function() {
        initializeLinks();

        // Handle Back/Forward browser buttons
        window.addEventListener('popstate', function() {
            navigate(window.location.href, true);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

