// Mobile nav toggle, mobile sticky CTA visibility, footer year, deal form submission + success state. FAQ accordion uses native <details>/<summary>.
(function () {
  var toggle = document.querySelector('.site-header__toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }
  var dropdown = document.querySelector('.site-nav__dropdown');
  if (dropdown) {
    var trigger = dropdown.querySelector('.site-nav__dropdown-trigger');
    var closeDropdown = function () { dropdown.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); };
    trigger.addEventListener('click', function () {
      var open = trigger.getAttribute('aria-expanded') === 'true';
      dropdown.classList.toggle('is-open', !open);
      trigger.setAttribute('aria-expanded', String(!open));
    });
    document.addEventListener('click', function (e) { if (!dropdown.contains(e.target)) closeDropdown(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDropdown(); });
    if (toggle) toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'false') closeDropdown();
    });
  }
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
  // Mobile sticky CTA: hide while the hero form is on screen so it never covers form fields.
  var cta = document.getElementById('mobile-cta');
  var formCard = document.getElementById('deal-form');
  if (cta && formCard && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      cta.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(formCard);
  }

  // ===== Deal form: show the success message without leaving the page =====
  // Submissions are captured by the AirChatty External Tracking Script (loaded before </body>),
  // which forwards them to GHL. This handler only stops the browser from navigating away.
  // It never calls stopPropagation, keeps every field's name and value in place (full_name, phone as +1XXXXXXXXXX, email, wdc_detials), and swaps in the
  // success message a moment later so the tracker can read the fields and finish sending.
  var form = document.querySelector('form.deal-form');
  var success = document.getElementById('deal-success');

  // ===== Phone: GHL needs E.164 (+1XXXXXXXXXX), or it rejects the contact ("Invalid country calling code") =====
  // Accepts any US format: 6025551234, (602) 555-1234, 602-555-1234, 1 602 555 1234, +1 602 555 1234.
  // Returns '+16025551234', or '' if it isn't a valid 10-digit US number.
  var toE164US = function (raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    if (d.length !== 10) return '';
    if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return ''; // US area code and exchange can't start with 0 or 1
    return '+1' + d;
  };
  var phone = form ? form.querySelector('input[name="phone"]') : null;
  var normalizePhone = function () {
    if (!phone) return true;
    var v = phone.value.trim();
    if (!v) { phone.setCustomValidity(''); return false; } // empty: the required check reports it
    var e164 = toE164US(v);
    if (e164) {
      phone.value = e164; // rewrite the input itself so the tracker reads +1XXXXXXXXXX
      phone.setCustomValidity('');
      return true;
    }
    phone.setCustomValidity('Please enter a 10-digit US phone number, like (602) 555-1234.');
    return false;
  };
  if (phone) {
    phone.addEventListener('blur', normalizePhone);
    phone.addEventListener('change', normalizePhone);
    phone.addEventListener('input', function () { phone.setCustomValidity(''); phone.removeAttribute('aria-invalid'); });
    // Normalize again at submit in the capture phase on window, which runs before any other submit
    // listener (including the tracker's), so every listener sees the +1 number. Doesn't stop the event.
    window.addEventListener('submit', function (e) {
      if (e.target === form) normalizePhone();
    }, true);
  }
  window.toE164US = toE164US;

  if (form && success) {
    var card = form.closest('.hero__form-card');
    var submitBtn = form.querySelector('.deal-form__submit');
    var SWAP_DELAY_MS = 600;

    var showSuccess = function () {
      form.hidden = true;
      success.hidden = false;
      if (card) card.classList.add('is-success');
      success.focus({ preventScroll: true });
    };
    window.showDealSuccess = showSuccess; // preview the success message from the browser console

    form.addEventListener('submit', function (e) {
      // Check required fields first; an invalid form is not submitted, so the tracker gets nothing.
      normalizePhone(); // already done in the capture phase; repeated here in case that listener is missing
      var firstBad = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
        var ok = el.checkValidity();
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !firstBad) firstBad = el;
      });
      e.preventDefault(); // stay on the page (no stopPropagation: the event still reaches the tracker)
      if (firstBad) { firstBad.reportValidity(); firstBad.focus(); return; }
      if (submitBtn) submitBtn.disabled = true; // avoid double submits
      setTimeout(function () {
        showSuccess();
        if (submitBtn) submitBtn.disabled = false;
      }, SWAP_DELAY_MS);
    });

    success.querySelector('.deal-success__again').addEventListener('click', function () {
      form.reset(); // values are only cleared when they choose to send another deal
      success.hidden = true;
      form.hidden = false;
      if (card) card.classList.remove('is-success');
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) { el.removeAttribute('aria-invalid'); });
      var first = form.querySelector('input');
      if (first) first.focus();
    });
  }
})();
