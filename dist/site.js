const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');

if (menuButton && mobileNav) {
  const closeMenu = () => {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'פתיחת תפריט');
  };
  menuButton.addEventListener('click', () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'סגירת תפריט' : 'פתיחת תפריט');
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

const lightbox = document.querySelector('.lightbox');
if (lightbox) {
  const lightboxImage = lightbox.querySelector('img');
  const caption = lightbox.querySelector('p');
  document.querySelectorAll('.image-open').forEach(button => {
    button.addEventListener('click', () => {
      if (typeof lightbox.showModal !== 'function') {
        window.open(button.dataset.full, '_blank', 'noopener');
        return;
      }
      lightboxImage.src = button.dataset.full;
      lightboxImage.alt = button.dataset.caption || '';
      caption.textContent = button.dataset.caption || '';
      lightbox.showModal();
    });
  });
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    lightboxImage.removeAttribute('src');
  });
}

const contactForm = document.querySelector('#contact-form');
const apiOrigin = 'https://api.rami-heb.joyfulaiteam.net';
const showStaticContactNotice = () => {
  const preview = document.createElement('div');
  preview.className = 'contact-form';
  const heading = document.createElement('h3');
  heading.textContent = 'יצירת קשר';
  const message = document.createElement('p');
  message.textContent = 'טופס הפנייה אינו זמין כאן כרגע. אפשר ליצור קשר דרך וואטסאפ או בטלפון.';
  preview.append(heading, message);
  contactForm.replaceWith(preview);
};
if (contactForm && location.hostname.endsWith('.github.io')) {
  showStaticContactNotice();
} else if (contactForm) {
  const question = contactForm.querySelector('#captcha-question');
  const token = contactForm.querySelector('#captcha-token');
  const answer = contactForm.querySelector('#captcha-answer');
  const status = contactForm.querySelector('#contact-form-status');
  const submit = contactForm.querySelector('.contact-submit');
  const setStatus = (message, kind = '') => {
    status.textContent = message;
    status.className = `contact-form-status ${kind}`;
  };

  async function loadCaptcha() {
    question.textContent = '...';
    token.value = '';
    answer.value = '';
    try {
      const response = await fetch(`${apiOrigin}/api/captcha`, {cache: 'no-store', credentials: 'omit'});
      if (response.status === 404) {
        showStaticContactNotice();
        return;
      }
      if (!response.ok) throw new Error('captcha');
      const data = await response.json();
      question.textContent = `${data.a} + ${data.b}`;
      token.value = data.token;
    } catch {
      question.textContent = 'לא זמינה';
      setStatus('לא ניתן לטעון את הבדיקה כרגע. אפשר לנסות שוב או לפנות בוואטסאפ.', 'error');
    }
  }

  contactForm.querySelector('#captcha-refresh').addEventListener('click', loadCaptcha);
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    if (!token.value) {
      setStatus('הבדיקה עדיין נטענת. נסו שוב בעוד רגע.', 'error');
      return;
    }
    submit.disabled = true;
    setStatus('הפנייה נשלחת...');
    try {
      const fields = Object.fromEntries(new FormData(contactForm));
      const response = await fetch(`${apiOrigin}/api/contact`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'omit',
        body: JSON.stringify(fields)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'אירעה שגיאה בשליחת הפנייה.');
      contactForm.reset();
      setStatus('תודה! הפנייה נשלחה לרמי בהצלחה והוא יחזור אליכם.', 'success');
      await loadCaptcha();
    } catch (error) {
      setStatus(error.message || 'אירעה שגיאה בשליחת הפנייה. נסו שוב.', 'error');
      await loadCaptcha();
    } finally {
      submit.disabled = false;
    }
  });
  loadCaptcha();
}
