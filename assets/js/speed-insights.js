// Vercel Speed Insights - Initialization
// This script initializes Vercel Speed Insights for performance monitoring
// Using the recommended approach for static HTML sites

(function() {
  // Initialize the Speed Insights queue
  window.si = window.si || function() {
    (window.siq = window.siq || []).push(arguments);
  };
  
  // The actual Speed Insights script will be injected by Vercel after deployment
  // when the Speed Insights feature is enabled in the Vercel dashboard
  
  // Create and inject the script element
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/speed-insights/script.js';
  document.head.appendChild(script);
})();
