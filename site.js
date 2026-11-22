/* 羽球計分板 DotBadminton 網站共用腳本：手機選單、捲動顯現、標語逐句轉亮。
   三頁共用；頁面上沒有的元件會自動略過。任何一塊出錯都不影響其他塊，
   也絕不會讓內容停在看不見的狀態。 */
(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    reduceMotion = false;
  }

  function showAllReveals() {
    var all = document.querySelectorAll('.reveal');
    Array.prototype.forEach.call(all, function (el) {
      el.classList.add('is-visible');
    });
  }

  /* 手機選單（只有首頁有） */
  function setUpMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var panel = document.getElementById('menu-panel');
    if (!toggle || !panel) {
      return;
    }
    function closeMenu() {
      toggle.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');
      document.documentElement.classList.remove('menu-open');
      window.setTimeout(function () {
        if (toggle.getAttribute('aria-expanded') === 'false') {
          panel.hidden = true;
        }
      }, reduceMotion ? 0 : 500);
    }
    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        return;
      }
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('menu-open');
      window.requestAnimationFrame(function () {
        panel.classList.add('is-open');
      });
    });
    panel.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('a')) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        toggle.focus();
      }
    });
  }

  /* 捲動顯現。threshold 設 0：只要碰到視窗就顯示，
     再補一次 load 後的掃描，避免排版變動讓某個區塊永遠停在透明。 */
  function setUpReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) {
      return;
    }
    if (reduceMotion || typeof IntersectionObserver !== 'function') {
      showAllReveals();
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -48px 0px', threshold: 0 });
    Array.prototype.forEach.call(targets, function (el) {
      observer.observe(el);
    });

    function sweep() {
      Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.is-visible)'), function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    }
    window.addEventListener('load', sweep);
    window.addEventListener('resize', sweep);
    document.addEventListener('toggle', sweep, true);
  }

  /* 標語逐句由淡轉亮（只有首頁有）：以標點斷句，標點跟著前一句 */
  function splitClauses(text) {
    var marks = '，。：、；！？';
    var clauses = [];
    var buffer = '';
    var i;
    for (i = 0; i < text.length; i += 1) {
      buffer += text.charAt(i);
      if (marks.indexOf(text.charAt(i)) !== -1) {
        clauses.push(buffer);
        buffer = '';
      }
    }
    if (buffer) {
      clauses.push(buffer);
    }
    return clauses;
  }

  function setUpTagline() {
    var tagline = document.getElementById('tagline');
    if (!tagline || reduceMotion || typeof IntersectionObserver !== 'function') {
      return;
    }
    var clauses = splitClauses(tagline.textContent.trim());
    if (clauses.length < 2) {
      return;
    }
    tagline.textContent = '';
    clauses.forEach(function (clause, index) {
      var span = document.createElement('span');
      span.className = 'tagline-word';
      span.style.setProperty('--i', String(index));
      span.textContent = clause;
      tagline.appendChild(span);
    });
    tagline.classList.add('is-armed');
    var litObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-lit');
          litObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    litObserver.observe(tagline);
  }

  try {
    setUpMenu();
  } catch (e) {
    /* 桌機導覽與頁面內容不依賴選單 */
  }
  try {
    setUpReveal();
  } catch (e) {
    showAllReveals();
  }
  try {
    setUpTagline();
  } catch (e) {
    var tagline = document.getElementById('tagline');
    if (tagline) {
      tagline.classList.remove('is-armed');
    }
  }
})();
