'use strict';

var main = (function() {
    var navbars;
    var content;
    var activePage;
    var isTransitioning = false;

    // Helper functions for hash routing
    var getPageFromURL = function(hash) {
        return decodeURI(hash || location.hash).replace(/\/$/, '').replace(/^#/, '').replace(/^\//, '');
    };
    var getActivePage = function(hash) {
        if (getPageFromURL(hash) == 'contact') {
            return document.getElementById('contact-content');
        } else if (getPageFromURL(hash) == 'home') {
            return document.getElementById('home-content');
        } else {
            return null; // For non-hash pages like blog or resume
        }
    };

    // The current active ".content" block in the DOM
    var findCurrentActiveContentBox = function() {
        var visibleContents = document.querySelectorAll('.content.shown');
        if (visibleContents.length > 0) return visibleContents[0];
        
        // Fallback for initialization
        return document.querySelector('.content') || null; 
    };

    // Initialize layout (both for first load and post-fetch swaps)
    // When animateIn is true, leaves activePage in .hidden state so caller can animate it.
    // When animateIn is false (initial page load), immediately shows the activePage.
    var setupLayout = function(animateIn) {
        navbars = document.querySelectorAll('.navbar');
        content = document.querySelectorAll('.content');
        
        // Find if there is a hash route requested like /#/home or /#/contact
        var hashPage = getActivePage();
        
        if (hashPage && document.getElementById(hashPage.id)) {
            activePage = hashPage;
        } else {
            activePage = content[0];
        }

        // Hide all contents
        for (var i = content.length - 1; i >= 0; i--) {
            content[i].classList.remove('shown');
            content[i].classList.add('hidden');
        }
        
        if (!animateIn && activePage) {
            // Initial load: show immediately, no animation needed
            activePage.classList.remove('hidden');
            activePage.classList.add('shown');
        }
        // If animateIn is true, leave activePage with .hidden so caller can animate

        // Re-attach standard UI listeners like perfect-scrollbar if needed globally
        var container = document.getElementById('container');
        if (container && window.Ps) {
            Ps.initialize(container);
        }
        
        return activePage;
    };

    var initializeLinks = function() {
        // Intercept all internal anchor clicks
        document.body.addEventListener('click', function(event) {
            // Find closest anchor tag
            var a = event.target.closest('a');
            if (!a) return;

            // Follow external links or anchor links with target="_blank" normally
            if (a.host !== window.location.host || a.hasAttribute('download') || a.getAttribute('target') === '_blank') return;

            // Handle standard internal click
            event.preventDefault();
            if (isTransitioning) return;

            var url = a.href;
            
            // Check if it's just a hash change on the SAME path
            var isSamePathHashChange = (a.pathname === window.location.pathname) && (a.hash.startsWith('#/'));
            
            navigate(url, isSamePathHashChange);
        });
    };

    var navigate = function(url, isLocalHashRoute, isPopState) {
        if (isTransitioning) return;
        
        var currentUrl = window.location.href;
        if (url === currentUrl && !isPopState) return;

        isTransitioning = true;
        
        // Push state if not triggered by back/forward button
        if (!isPopState) {
            history.pushState(null, null, url);
        }

        // Determine if we need to fetch a new page, or just slide panels around 
        // within the same physical HTML document (e.g. index.html /#/home -> /#/contact)
        var pathChanged = (new URL(url).pathname !== new URL(currentUrl).pathname);

        // Hide current active content to trigger exit transition
        activePage = findCurrentActiveContentBox();
        if (activePage) {
            activePage.classList.remove('shown');
            activePage.classList.add('hidden');
        }

        // Wait for CSS exit transition duration (~1000ms based on CSS rule)
        var transitionDuration = 1000;

        if (pathChanged) {
            // We need to fetch and swap the DOM
            var fetchPromise = fetch(url).then(function(response) {
                return response.text();
            });
            var timerPromise = new Promise(function(resolve) {
                setTimeout(resolve, transitionDuration);
            });

            Promise.all([fetchPromise, timerPromise]).then(function(results) {
                var htmlText = results[0];
                
                // Parse the new HTML
                var parser = new DOMParser();
                var newDoc = parser.parseFromString(htmlText, 'text/html');
                
                // Extract new content
                var newMainContent = newDoc.querySelector('.page-wrapper');
                
                // Swap it into current DOM
                var oldMainContent = document.querySelector('.page-wrapper');
                
                if (newMainContent && oldMainContent) {
                    oldMainContent.parentNode.replaceChild(newMainContent, oldMainContent);
                }

                // Update document title
                document.title = newDoc.title;

                // Re-setup the new DOM structure — keep content in .hidden state
                var newActivePage = setupLayout(true);

                // Force a reflow so browser registers the .hidden state
                if (newActivePage) {
                    void newActivePage.offsetHeight;
                }

                // Swap .hidden → .shown to trigger the CSS slide-in transition
                setTimeout(function() {
                    if (newActivePage) {
                        newActivePage.classList.remove('hidden');
                        newActivePage.classList.add('shown');
                    }
                    isTransitioning = false;
                }, 50);

            }).catch(function(err) {
                console.error("Navigation failed", err);
                isTransitioning = false;
                window.location.href = url; // Fallback to normal navigation
            });

        } else {
            // It's just a local hash change within current document (e.g. Home <-> Contact)
            setTimeout(function() {
                var hashVal = new URL(url).hash;
                activePage = getActivePage(hashVal) || content[0];
                
                if (activePage) {
                    activePage.classList.remove('hidden');
                    activePage.classList.add('shown');
                }
                isTransitioning = false;
            }, transitionDuration);
        }
    };

    var init = function() {
        setupLayout(false);  // Initial load: show immediately, no animation
        initializeLinks();

        // Handle Back/Forward browser buttons
        window.addEventListener('popstate', function(event) {
            navigate(window.location.href, false, true);
        });
    };

    // Wait until DOM is ready to initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
