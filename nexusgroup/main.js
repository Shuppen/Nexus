/* /var/www/nexusgroup/main.js  —  объединённая версия без дубликатов */
console.log("✅ main.js загружен");

/* ===== SERVICE WORKER REGISTRATION ===== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
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
    utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js'
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
  
  /* ===== LIBRARIES INIT ===== */
  lucide?.createIcons?.();
  console.log("✅ [DEBUG] main.js загружен и DOM готов");

  /* ===== SCROLL BAR ===== */
  const bar = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
  });
});

/* ===== TRUST COUNTER ===== */
(() => {
  const el = document.getElementById('trust-count');
  if (!el) return;

  /* — настройки — */
  const BASE_START        = 2848;                // сколько было 01-06-2025
  const MONTHLY_INCREMENT = 152;                 // прирост за месяц
  const ANCHOR_DATE       = new Date(2025, 7, 1); // 1 июня 2025 (месяц 0-based)

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

  const TIPS = [
    { t: 'Платите себе сначала',        d: 'Отложите минимум 10 % дохода сразу после получения.' },
    { t: 'Резервный фонд',              d: '3-6 месяцев расходов — на высоколиквидном счёте.' },
    { t: 'Дневник расходов',            d: 'Учёт трат показывает, куда уходит до 20 % бюджета.' },
    { t: 'Правило 24 часов',            d: 'Перед крупной покупкой подождите сутки, чтобы избежать импульса.' },
    { t: 'Автопереводы в инвестиции',   d: 'Автоматические списания дисциплинируют лучше любых обещаний.' },
    { t: 'Диверсификация валют',        d: 'Храните капитал минимум в двух валютах для хеджирования.' },
    { t: 'SMART-цели',                  d: 'Цель без цифры и срока — просто мечта.' },
    { t: 'Комиссии важны',              d: 'Снижение издержек на 0,3 % экономит тысячи за годы.' },
    { t: 'Токсичные кредиты',           d: 'Платёж по кредитам ≤ 30 % ежемесячного дохода.' },
    { t: 'Стоп-лосс по умолчанию',      d: 'Определяйте допустимый убыток до открытия сделки.' },
    { t: 'Ребалансируйте портфель',     d: 'Возвращайте активы к целевым долям раз в квартал.' },
    { t: 'Думайте об инфляции',         d: 'Сравнивайте доходность с реальной, а не номинальной ставкой.' },
    { t: 'Инвестируйте в знания',       d: 'Книги и курсы часто дают больший ROI, чем рисковые сделки.' },
    { t: 'Семейный бюджет',             d: 'Обсуждайте финплан с партнёром — меньше ссор о деньгах.' },
    { t: 'Налоговые льготы',            d: 'ИИС/пенсионные планы экономят до 13 % НДФЛ.' },
    { t: 'Не гонитесь за хайпом',       d: 'Изучите актив сами, даже если о нём «говорят все».' },
    { t: 'Хороший долг ≠ плохой долг',  d: 'Долг под 3 % на образование может быть активом, а не обузой.' },
    { t: 'Ликвидная часть портфеля',    d: 'Имейте «свободный кэш» для неожиданных возможностей.' },
    { t: 'Проверяйте фон',              d: 'Читайте отчёты компаний, а не только новости.' },
    { t: 'Сила сложного процента',      d: 'Раньше начнёте — меньше потребуется капитала к цели.' }
  ];

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
      min: 78.3,  max: 94.2,  ls: 'stat_happy'
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
const testimonialData = [
  {
    text: "Сначала сомневался, но решил попробовать. Оказалось — зря сомневался. Всё устроено грамотно, с фокусом на результат, а не на обещания. Благодарю за профессионализм, терпение и человечность. Не чувствовала себя клиентом на потоке, всё было индивидуально.",
    author: "Максим Х., волонтёр"
  },
  {
    text: "Была на консультации — получила больше, чем от платного курса по инвестициям. Всё по делу, без воды. Не думал, что смогу чему-то научиться в 56 лет, но Nexus доказали обратное. Я стабильно вывожу прибыль уже третий месяц.",
    author: "Владислав Л., аналитик"
  },
  {
    text: "Формат обучения понравился: короткие блоки, поддержка в Telegram и возможность задавать вопросы. Очень удобно для занятых людей. Я даже не верила, что это возможно — получать стабильный доход с телефона, пока не попробовала систему Nexus.",
    author: "Кирилл Д., электрик"
  },
  {
    text: "Прошёл обучение, начал работать по их стратегии, и уже через несколько недель почувствовал реальную отдачу. До этого год искал рабочую модель. Благодаря компании я разобрался, как работает рынок, и перестал бояться инвестировать.",
    author: "Георгий Ц., трейдер"
  },
  {
    text: "Не думала, что финансовая грамотность может быть настолько... увлекательной! Ощущение, будто ты не учишься, а разгадываешь головоломку, где каждая правильная цифра приближает тебя к личной свободе. Спасибо Nexus за эту энергию!",
    author: "Наталья С., гейм-дизайнер"
  },
  {
    text: "Раньше для меня рынок был как шумный базар: все что-то кричат, но ничего не понятно. А теперь я знаю, как отличить стратегию от лотереи. Nexus — это как научиться варить кофе с закрытыми глазами: чётко, точно, на вкус успеха.",
    author: "Рустам А., бариста"
  },
  {
    text: "Как человек, привыкший к креативу, я боялась, что финансовая система меня задавит сухими терминами и графиками. Но наоборот — меня вдохновило, что у денег тоже есть язык. И Nexus говорит на нём чётко и по делу.",
    author: "Екатерина Т., арт-директор"
  },
  {
    text: "У меня руки всегда были золотые — а вот с деньгами было туго. А теперь, благодаря Nexus, у меня не только инструменты в порядке, но и доход стабильный. Кто бы знал, что графики могут стать понятнее, чем чертёж!",
    author: "Вадим Л., слесарь"
  },
  {
    text: "Честно? Я шла за одним — дополнительным доходом. А получила больше: уверенность, чёткую систему и понимание, что стабильность — это не миф. Сейчас рекомендую Nexus даже своим студентам.",
    author: "Алиса В., преподаватель английского"
  },
  {
    text: "Мне 63, и я думала, что всё — поезд ушёл. Но после консультации поняла: начинать никогда не поздно. Теперь каждый вечер с чашкой чая я наблюдаю за рынком, и знаете, это даже увлекательнее, чем сериалы.",
    author: "Людмила П., пенсионерка"
  },
  {
    text: "Я работаю на стройке, и раньше думал: биржа — это только для богатых. Оказалось, просто не хватало нормального объяснения. Nexus объяснили, как своему. Сейчас часть зарплаты сразу перекладываю в работу.",
    author: "Евгений Р., монтажник"
  },
  {
    text: "Когда увидел рекламу, подумал: 'Опять развод'. Но друг настоял — и я прошёл консультацию. Сейчас сам всем советую. Не потому что вау, а потому что работает. Без понтов, без мифов.",
    author: "Арман Г., водитель"
  },
  {
    text: "Для меня всё началось с банального 'хочу больше свободы'. А закончилось пониманием, что свобода — это навык. И этот навык мне дали здесь. Спасибо!",
    author: "Дарья З., SMM-менеджер"
  },
  {
    text: "Nexus — это не про чудо, а про системность. Впервые за много лет я перестала бояться тратить и начала планировать. Даже появился азарт — как выжать из каждого месяца максимум.",
    author: "Инна Ч., экономист"
  },
  {
    text: "Сначала не верил, что смогу вообще в чём-то разобраться. А потом начал задавать вопросы, получил ответы, сделал шаг — и пошло. Не страшно, когда рядом нормальные люди, а не инфоцыгане.",
    author: "Борис С., техник"
  },
  {
    text: "После каждого созвона с куратором чувствовал, что в голове становится больше порядка. Как будто в этой каше с деньгами наконец-то появилась инструкция. Это и есть настоящая поддержка.",
    author: "Олеся В., иллюстратор"
  },
  {
    text: "Консультация позволила мне быстро оценить перспективы и принять взвешенное решение. Впечатлён уровнем экспертизы и структурой сопровождения.",
    author: "Илья Н., юрист"
  },
  {
    text: "Материал подаётся чётко, без лишней информации. Каждая сессия имеет прикладную ценность. Формат подойдёт тем, кто ценит системный подход.",
    author: "Оксана Е., главный бухгалтер"
  },
  {
    text: "После первого месяца работы под наблюдением куратора получил положительную динамику по счёту. Отдельно отмечаю прозрачную стратегию риск-менеджмента.",
    author: "Виктор А., инженер-конструктор"
  },
  {
    text: "Nexus Group предоставили качественную аналитическую базу и грамотную навигацию по финансовым инструментам. Результат ощущается уже в первые недели.",
    author: "Елена К., руководитель отдела закупок"
  },
  {
    text: "Уровень поддержки соответствует заявленному. Вопросы решаются оперативно, обратная связь — персонализированная. Подход серьёзный.",
    author: "Константин Т., предприниматель"
  },
  {
    text: "Программа адаптирована под разный уровень подготовки. В моём случае — позволила выстроить понятную схему действий даже без предварительных знаний.",
    author: "Марина С., специалист по кадрам"
  },
  {
    text: "Благодаря структурированным материалам и постоянному сопровождению я смог перейти от наблюдения к действиям. Это лучший формат обучения из всех, что я проходил.",
    author: "Даниил Л., инвестиционный аналитик"
  },
  {
    text: "Отлично проработан процесс входа: от постановки целей до реализации первых сделок. Нет пустых обещаний — только проверенные действия.",
    author: "Светлана М., управляющий"
  },
  {
    text: "Программа далека от типичных курсов. Это рабочий инструмент, который при правильном использовании даёт конкретные финансовые результаты.",
    author: "Роман Ч., финансовый консультант"
  },
  {
    text: "Серьёзно? Это работает? Я что, зря столько лет боялся всех этих графиков и терминалов? Оказалось, всё проще, чем меню в Тинькофф.",
    author: "Саша Р., студент"
  },
  {
    text: "А почему в школе нас не учили этому? Почему я узнал про капитал только в 29? Вопросы остались, но теперь я хотя бы знаю, куда иду.",
    author: "Инга Л., блогер"
  },
  {
    text: "Так можно было? Просто прийти, послушать, задать вопросы и начать? Где была эта схема, когда я пытался разобраться сам через YouTube?",
    author: "Георгий В., курьер"
  },
  {
    text: "В смысле, можно зарабатывать, не сидя перед графиками по 12 часов? Я думал, это только для суперпродвинутых. А оно вон как.",
    author: "Екатерина Ю., младший редактор"
  },
  {
    text: "Я записался на консультацию просто ради интереса. Спойлер: интерес превратился в стабильную вторую зарплату. Как вообще?",
    author: "Лев М., видеомонтажёр"
  },
  {
    text: "У меня были сомнения. Потом вопросы. Потом удивление. Потом результат. Сейчас уже всё просто — делаю, что сказали, и вижу деньги.",
    author: "Рая Т., кассир"
  },
  {
    text: "Вы серьёзно не продаёте курс за 80 тысяч? И просто объясняете, как всё работает? Ладно, тогда я посоветую другу.",
    author: "Матвей Ж., барбер"
  },
  {
    text: "Первое время ждал подвоха. Вторую неделю — искал уловки. Сейчас сижу и думаю: может, просто так бывает? Спасибо.",
    author: "Нина П., фотограф"
  },
  {
    text: "У меня до сих пор ощущение, что я где-то ошибся, но деньги реально приходят. Это магия или просто рабочая система?",
    author: "Давид И., официант"
  },
  {
    text: "Я просто хотел понять, что делать со своей зарплатой, чтобы она не исчезала к 20 числу. Кажется, я нашёл ответ.",
    author: "Зара А., ассистент юриста"
  },
  {
    text: "Для меня это не просто заработок. Это возможность чувствовать себя уверенно в будущем. А в наше время — это редкость.",
    author: "Алёна М., логист"
  },
  {
    text: "Я как будто всю жизнь ехал на велосипеде, а тут дали мотоцикл. Сначала страшно, потом — свобода. Спасибо команде.",
    author: "Артём С., охранник"
  },
  {
    text: "В этой системе нет магии. Есть структура, цифры и чёткий план. Всё, что мне всегда не хватало в других попытках.",
    author: "Жанна Т., ресторатор"
  },
  {
    text: "Сначала думал, что это будет очередной курс. Но в итоге оказалось, что это был переломный момент. Я начал меняться.",
    author: "Игорь Б., консультант"
  },
  {
    text: "Мне не обещали миллионы. Мне объяснили, как выйти из нуля. И это честнее, чем всё, что я видел до этого.",
    author: "Камила Р., маркетолог"
  },
  {
    text: "Когда на фоне общего хаоса кто-то говорит спокойно и по делу — это уже ценно. А если за этим ещё и результат, то это уровень.",
    author: "Валерий Е., инженер"
  },
  {
    text: "Мне не просто показали, как заработать. Мне дали ощущение, что я способен. А это ощущение стоит дороже денег.",
    author: "Элина Д., архитектор"
  },
  {
    text: "Вы не представляете, насколько важно, когда тебе просто показывают, как сделать первый шаг. А дальше ты уже идёшь сам.",
    author: "Николай А., безработный (в прошлом)"
  },
];

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

