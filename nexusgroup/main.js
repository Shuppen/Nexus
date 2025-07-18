/* /var/www/nexusgroup/main.js  —  объединённая версия без дубликатов */
console.log("✅ main.js загружен");

/* ===== SERVICE WORKER REGISTRATION ===== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
(function autoRedirectByLanguage() {
  const userLang = navigator.language || navigator.userLanguage;
  const isRU = userLang.startsWith('ru') || ['ru','uk','be','kk','uz','az','hy','mo','tj'].includes(userLang.slice(0,2).toLowerCase());
  const isMain = location.pathname.endsWith('/index.html') || location.pathname === '/' || location.pathname === '/index';

  // Проверка: если не на нужной версии — редирект
  if (isMain) {
    if (!isRU && location.pathname !== '/index-en.html') {
      location.replace('/index-en.html');
    }
    if (isRU && location.pathname !== '/index.html') {
      location.replace('/index.html');
    }
  }
})();

function setLang(lang) {
  const target = lang === 'en' ? '/index-en.html' : '/index.html';
  location.href = target;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ [DEBUG] main.js загружен и DOM готов");

  // Глобальная переменная для intl-tel-input
  let iti;

  // Находим поле телефона
  const phoneInput = document.querySelector('#phone');
  if (!phoneInput) {
    console.warn('❌ Поле #phone не найдено');
    return;
  }

  // Инициализируем intl-tel-input
  iti = window.intlTelInput(phoneInput, {
    initialCountry: 'auto',
    geoIpLookup(callback) {
      fetch('/get_country')
        .then(res => res.json())
        .then(data => callback(data))
        .catch(() => callback('ru'));
    },
    nationalMode: false,
    preferredCountries: ['am', 'ru'],
    utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@24.8.2/build/js/utils.js'
  });

  // Глобальная функция для получения полного номера
  window.getFullPhone = () => iti.getNumber() || '';

  // Проверка валидности по blur
  phoneInput.addEventListener('blur', () => {
    if (iti.isValidNumber()) {
      phoneInput.setCustomValidity('');
    } else {
      phoneInput.setCustomValidity('Неверный номер телефона');
    }
    phoneInput.reportValidity();
  });

  // Обработка формы
  const form = document.getElementById('contact-form');
  if (!form) {
    console.warn("⚠️ [DEBUG] Форма #contact-form не найдена");
    return;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    console.log("📨 [DEBUG] Нажата кнопка отправки");

    const fd = new FormData(form);
    const fn = (fd.get('first_name') || '').trim();
    const ln = (fd.get('last_name') || '').trim();
    const em = (fd.get('email') || '').trim();
    const phone = getFullPhone();

    console.log("📋 [DEBUG] Собранные данные:", { first_name: fn, last_name: ln, email: em, phone });

    if (!fn || !ln || !phone || phone.length < 6) {
      alert('Пожалуйста, заполните имя, фамилию и корректный телефон.');
      console.warn("⚠️ [DEBUG] Не заполнены обязательные поля или номер слишком короткий");
      return;
    }

    if (!window.grecaptcha) {
      alert('Ошибка: reCAPTCHA не загружена.');
      console.error("❌ [DEBUG] grecaptcha отсутствует в window");
      return;
    }

    grecaptcha.ready(async () => {
      try {
        const token = await grecaptcha.execute('6Ld3_3ArAAAAAKwd76a3jTmp9Ok8qHR-AetPx54L', { action: 'contact_form' });
        console.log("🔐 [DEBUG] reCAPTCHA token:", token);

        const payload = { first_name: fn, last_name: ln, email: em, phone, recaptcha_token: token };
        console.log("📦 [DEBUG] Payload к отправке:", payload);

        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        console.log("📡 [DEBUG] Запрос отправлен →", form.action, "Статус:", res.status);

        const data = await res.json().catch(() => ({}));
        console.log("📬 [DEBUG] Ответ сервера:", data);

        if (!res.ok) {
          alert(data.reason === 'recaptcha' ? 'Ошибка: капча не прошла проверку.' : 'Ошибка отправки формы.');
          return;
        }

        form.reset();
        alert('✅ Заявка успешно отправлена!');
      } catch (err) {
        alert(`Ошибка: ${err.message}`);
        console.error("❌ [DEBUG] Ошибка во время отправки:", err);
      }
    });
  });
  
  // ===== Бургер-меню =====
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');

  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('open');
  });

  document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      nav.classList.remove('open');
    });
  });




/* ===== TRUST COUNTER ===== */
(() => {
  const el = document.getElementById('trust-count');
  if (!el) return;

  /* — настройки — */
  const BASE_START        = 2848;                // сколько было 01-06-2025
  const MONTHLY_INCREMENT = 152;                 // прирост за месяц
  const ANCHOR_DATE       = new Date(2025, 6, 1); // 1 июня 2025 (месяц 0-based)

  const LS_KEY            = 'trustCount';

  /* — служебные функции — */
  const monthsBetween = (a, b) =>
    (a.getFullYear() - b.getFullYear()) * 12 + a.getMonth() - b.getMonth();

  const goalNow = () => {
    const now     = new Date();
    const mDiff   = Math.max(0, monthsBetween(now, ANCHOR_DATE));
    const floor   = BASE_START + MONTHLY_INCREMENT * mDiff;       // рубеж на 1-е число
    const ceil    = floor + MONTHLY_INCREMENT;                    // рубеж на след. месяц
    const start   = new Date(now.getFullYear(), now.getMonth(), 1);
    const end     = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const k       = (now - start) / (end - start);                // 0…1
    return Math.floor(floor + (ceil - floor) * k);
  };

  const save  = (v) => localStorage.setItem(LS_KEY, v);
  const load  = () => Number(localStorage.getItem(LS_KEY) || BASE_START);

  const animate = (from, to) => {
    const timer = setInterval(() => {
      if (from >= to) { clearInterval(timer); return; }
      from += 1;
      el.textContent = from.toLocaleString('ru-RU');
      save(from);
    }, 2000);        // ≈2 с на одного клиента
  };

  /* — первичный вывод — */
  let current = Math.max(load(), BASE_START);
  const goal  = goalNow();

  el.textContent = current.toLocaleString('ru-RU');
  if (goal > current) animate(current, goal);
  else save(current);

  /* — проверка цели раз в час — */
  setInterval(() => {
    const newGoal = goalNow();
    const nowVal  = Number(localStorage.getItem(LS_KEY));
    if (newGoal > nowVal) animate(nowVal, newGoal);
  }, 3_600_000); // 1 ч
})();


/* ===== QUICK TIPS (3 random cards) ===== */
(function () {
  const cards = document.querySelectorAll('#quicktips .tip');
  if (cards.length !== 3) return; // должны быть именно три карточки

const tips = window.TIPS || [];

  // выбираем случайные 3 неповторяющихся совета
  const pool = [...TIPS];
  cards.forEach(card => {
    const i = Math.floor(Math.random() * pool.length);
    const { t, d } = pool.splice(i, 1)[0]; // извлекаем и удаляем из пула
    card.querySelector('h3').textContent = t;
    card.querySelector('p').textContent  = d;
  });
})();
/* ===== STATS SECTION ===== */
(() => {
  const section = document.querySelector('.stats');
  if (!section) return;

  /* — вспомогалки — */
  const clamp     = (v, min, max) => Math.min(Math.max(v, min), max);
  const toNum     = s => Number(String(s).replace(',', '.'));
  const saveLS    = (key, val) => localStorage.setItem(key, val);
  const loadLS    = key => localStorage.getItem(key);

  /* настройки: подпись → {min, max, lsKey} */
  const MAP = {
    '% клиентов с прибылью': {
      min: 89.5,  max: 97.9,  ls: 'stat_profit'
    },
    'довольных инвесторов': {
      min: 99,  max: 100,  ls: 'stat_happy'
    }
  };

  /* 1. лет на рынке — фиксированное число */
  const yearsCard = section.querySelector('.stat__label')
    ?.closest('.stat');
  if (yearsCard &&
      yearsCard.querySelector('.stat__label')
        .textContent.toLowerCase().includes('лет на рынке')) {
    yearsCard.querySelector('.counter')
      .textContent = new Date().getFullYear() - 2013;
  }

  /* 2. проценты — храним и колеблем */
  section.querySelectorAll('.stat').forEach(card => {
    const label  = card.querySelector('.stat__label')?.textContent.toLowerCase();
    const cfgKey = Object.keys(MAP).find(k => label?.includes(k));
    if (!cfgKey) return;

    const { min, max, ls } = MAP[cfgKey];
    const counter = card.querySelector('.counter');

    /* стартовое значение: пробуем из LS, иначе случайное */
    let cur = loadLS(ls);
    if (cur === null || cur === '' || isNaN(cur)) {
      cur = (Math.random() * (max - min) + min).toFixed(1);
      saveLS(ls, cur);
    }
    counter.textContent = cur;

    /* обновляем каждые 5 мин на ±2 % от текущего */
    setInterval(() => {
      const now = toNum(loadLS(ls));
      const delta = now * (Math.random() * 0.04 - 0.02); // ±2 %
      const next = clamp(now + delta, min, max).toFixed(1);
      counter.textContent = next;
      saveLS(ls, next);
    }, 300_000); // 5 мин
  });
})();


  /* ===== FADE / LAZY IMG ===== */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        if (e.target.dataset.fade) e.target.classList.add('loaded');
      }
    });
  }, { threshold: .15 });
  document.querySelectorAll('.fade-section, img[data-fade]')
          .forEach(el => io.observe(el));




  /* ===== MULTI-STEP LEAD FORM (если присутствует) ===== */
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    const steps = [...leadForm.querySelectorAll('fieldset')];
    leadForm.addEventListener('click', e => {
      if (e.target.classList.contains('next')) {
        const cur  = e.target.closest('fieldset');
        const next = steps[steps.indexOf(cur) + 1];
        cur.hidden = true;
        next.hidden = false;
      }
    });
    leadForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(leadForm));
      fetch('/new_client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      document.getElementById('form-success').hidden = false;
      steps.forEach(fs => fs.hidden = true);
    });
  }

  /* ===== COUNTDOWN (promo timer) ===== */
  const cd = document.getElementById('countdown');
  if (cd) {
    const deadline = new Date('2025-07-31T23:59:59').getTime();
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) { cd.textContent = '00д 00ч 00м 00с'; clearInterval(t); return; }
      const d = Math.floor(diff / 864e5),
            h = Math.floor(diff % 864e5 / 36e5),
            m = Math.floor(diff % 36e5 / 6e4),
            s = Math.floor(diff % 6e4 / 1000);
      cd.textContent =
        `${String(d).padStart(2,'0')}д ${String(h).padStart(2,'0')}ч ` +
        `${String(m).padStart(2,'0')}м ${String(s).padStart(2,'0')}с`;
    };
    tick();
    const t = setInterval(tick, 1000);
  }
// ===== RANDOM TESTIMONIALS =====

const testimonials = window.testimonialData || [];

/* ===== TESTIMONIALS SLIDER ===== */
(() => {
  const section = document.getElementById('testimonials');
  if (!section) return;

  // Массив ваших отзывов (оставляем как есть)
  const data = testimonialData; 

  const slides = section.querySelector('.slides');
  const prev   = section.querySelector('.slider__btn.prev');
  const next   = section.querySelector('.slider__btn.next');
  if (!slides || !prev || !next) return;

  // Выбираем столько отзывов, сколько <li class="slide"> должно быть
  const count =  slides.getAttribute('data-count') 
                 ? Number(slides.dataset.count) 
                 : 3;
  const picks = [...data].sort(() => 0.5 - Math.random()).slice(0, count);

  // Рисуем заново
  slides.innerHTML = '';
  picks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'slide';
    li.innerHTML = `
      <blockquote>
        «${t.text}»
        <footer>— ${t.author}</footer>
      </blockquote>`;
    slides.appendChild(li);
  });

  // Кнопки листают по ширине контейнера
  const step = () => slides.clientWidth;
  prev.addEventListener('click', () => {
    slides.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  next.addEventListener('click', () => {
    slides.scrollBy({ left:  step(), behavior: 'smooth' });
  });
})();

