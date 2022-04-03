var s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/inject.js');
s.onload = function() {
    this.remove();
};
console.log('src', s.src);
(document.head || document.documentElement).appendChild(s);
