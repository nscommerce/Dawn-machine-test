// Recently Viewed Products

class RecentlyViewed extends HTMLElement {
  constructor() {
    super();
    this.container = null;
  }

  async connectedCallback() {
    const currentHandle = this.getAttribute('current-handle');
    const storageKey = 'recently_viewed_products';
    let handles = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Update localStorage
    handles = handles.filter(handle => handle !== currentHandle);
    handles.unshift(currentHandle);
    handles = handles.slice(0, 8);
    localStorage.setItem(storageKey, JSON.stringify(handles));

    const displayHandles = handles.filter(handle => handle !== currentHandle);
    if (displayHandles.length === 0) {
      this.innerHTML = '<p>No recently viewed products.</p>';
      return;
    }

    // Get slider config from attributes
    const slidesPerViewDesktop = parseInt(this.dataset.desktopItems || 4);
    const slidesPerViewMobile = parseInt(this.dataset.mobileItems || 1);
    const showArrows = this.dataset.sliderArrow === 'true';
    const showDots = this.dataset.sliderDots === 'true';

    // Base HTML for Swiper
    this.innerHTML = `
      <div class="recently-viewed-wrapper swiper">
        <div class="swiper-wrapper"></div>
        ${showArrows ? `<div class="swiper-button-prev"></div><div class="swiper-button-next"></div>` : ''}
        ${showDots ? `<div class="swiper-pagination"></div>` : ''}
      </div>
    `;

    const swiperWrapper = this.querySelector('.swiper-wrapper');
    const productData = await recentlyViewed(displayHandles);
    const widths = [180, 240, 320, 440, 600];

    productData.forEach(product => {
      const productImg = imagePaths(product.featured_image, widths);
      const html = `
        <div class="swiper-slide">
          <div class="product-card">
            <a href="${product.url}">
              <img src="${productImg}" alt="${product.title}" />
              <h4>${product.title}</h4>
              <div class="price"><p>${Shopify.formatMoney(product.price)}</p></div>
            </a>
          </div>
        </div>
      `;
      swiperWrapper.insertAdjacentHTML('beforeend', html);
    });

    // Initialize Swiper
    new Swiper(this.querySelector('.swiper'), {
      slidesPerView: slidesPerViewDesktop,
      spaceBetween: 16,
      navigation: showArrows ? {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      } : false,
      pagination: showDots ? {
        el: '.swiper-pagination',
        clickable: true,
      } : false,
      breakpoints: {
        0: {
          slidesPerView: slidesPerViewMobile,
        },
        768: {
          slidesPerView: slidesPerViewDesktop,
        },
      },
    });
  }
}

customElements.define('recently-viewed', RecentlyViewed);


// get recently viewed products 
async function recentlyViewed(handles) {
  const productOptions = [];
  for (const handle of handles) {
    try {
      const response = await fetch(`/products/${handle}.js`);
      if(!response.ok) throw new Error(`Failed to fetch ${handle}: ${response.status}`);
      const product = await response.json();
      // Pick required fields
      const filtered = {
        title: product.title,
        price: product.price,
        featured_image: product.featured_image,
        available: product.available,
        url: product.url
      };

      productOptions.push(filtered);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  }
  return productOptions; 
}

// Image Urls generate with multiples widths.
function imagePaths(imgurl,widths) {
  if(imgurl == null) return [];
  if (widths) {
      const imageUrls = [];

      widths.forEach(width => {
        let url = `${imgurl}?width=${width}`;
        if (width === widths[widths.length - 1]) {
          url += ` ${width}w`
        } else {
          url += ` ${width}w,`
        }
        imageUrls.push(url);
      })
      return imageUrls;
    } else {
      return [imgurl];
    }
}

// Theme currency helper
Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') {
    cents = cents.replace('.', '');
  }
  var value = '';
  var placeholderRegex = /{{\s*(\w+)\s*}}/;
  var formatString = (format || this.money_format);
  function defaultOption(opt, def) {
      return (typeof opt == 'undefined' ? def : opt);
  }
  function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal = defaultOption(decimal, '.');
      if (isNaN(number) || number == null) {
          return 0;
      }
      number = (number / 100.0).toFixed(precision);
      var parts = number.split('.'),
          dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
          cents = parts[1] ? (decimal + parts[1]) : '';
      return dollars + cents;
  }
  switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
          value = formatWithDelimiters(cents, 2);
          break;
      case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
      case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
      case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
  }
  return formatString.replace(placeholderRegex, value);
};

// Custom weather api
class CustomWeather extends HTMLElement {
  connectedCallback() {
    const CACHE_KEY = 'weatherData', CACHE_TIME = 30 * 60 * 1000;
    const update = (city, temp) => this.textContent = `(${temp}°C in ${city})`;

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_TIME) {
        update(data.city, data.temp);
        return;
      }
    }

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(loc => {
        const city = loc.city || 'your area';
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://wttr.in/${city}?format=j1`)}`;
        
        fetch(proxyUrl)
          .then(res => res.json())
          .then(data => {
            const weather = JSON.parse(data.contents);
            const temp = weather.current_condition[0].temp_C;
            update(city, temp);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ city, temp, timestamp: Date.now() }));
          });
      })
      .catch(() => {
        this.textContent = '(Weather unavailable)';
      });
  }
}
customElements.define('custom-weather', CustomWeather);



// modal js
class CustomPopup extends HTMLElement {
  connectedCallback() {
    const popupId = this.id;

    // Wrap existing content in structure
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const box = document.createElement('div');
    box.className = 'popup-box';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-popup';
    closeBtn.innerHTML = '&times;';

    // Move content inside box
    while (this.firstChild) {
      box.appendChild(this.firstChild);
    }

    box.insertBefore(closeBtn, box.firstChild);
    overlay.appendChild(box);
    this.appendChild(overlay);

    // Bind open triggers
    const triggers = document.querySelectorAll(`.trigger-popup[data-target="${popupId}"]`);
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        this.classList.add('active');
        document.body.classList.add('popup-open'); // Disable background scroll
      });
    });

    // Close logic
    closeBtn.addEventListener('click', () => this.closePopup());
    overlay.addEventListener('click', e => {
      if (e.target === overlay) this.closePopup();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closePopup();
    });
  }

  closePopup() {
    this.classList.remove('active');
    document.body.classList.remove('popup-open');
  }
}

customElements.define('custom-popup', CustomPopup);

// custom variant swatches

class CustomVariantSelects extends HTMLElement {
  constructor() {
    super();
    this.productData = JSON.parse(this.dataset.product);
    this.productHandle = this.dataset.handle;
    this.sectionid = this.dataset.sectionid;
    this.bindEvents();
  }

  bindEvents() {
    this.removeEventListener('click', this.onVariantClick);
    this.addEventListener('click', this.onVariantClick.bind(this));
  }

  onVariantClick(event) {
    if (!event.target.classList.contains('variant-btn')) return;

    // Active state toggle
    const group = event.target.closest('.variant-options');
    group.querySelectorAll('.variant-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Collect selected options
    const selectedOptions = Array.from(
      this.querySelectorAll('.variant-btn.active')
    ).map(btn => btn.textContent.trim());

    // Find the matching variant
    const matchedVariant = this.productData.variants.find(variant => {
      return JSON.stringify(variant.options) === JSON.stringify(selectedOptions);
    });

    if (!matchedVariant) return;

    const variantId = matchedVariant.id;

    // Update browser URL without reload
    const newUrl = `${window.location.pathname}?variant=${variantId}`;
    window.history.replaceState({}, '', newUrl);

    // Fetch new section HTML with updated variant
    const url = `/products/${this.productHandle}?variant=${variantId}&section_id=${this.sectionid}`;
    fetch(url)
      .then(res => res.text())
      .then(html => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Replace product media (gallery)
        const newMedia = tempDiv.querySelector('.product__media-wrapper, .grid__item .product__media-wrapper');
        const currentMedia = document.querySelector('.product__media-wrapper, .grid__item .product__media-wrapper');
        if (newMedia && currentMedia) currentMedia.replaceWith(newMedia);

        // Replace price
        const newPrice = tempDiv.querySelector('div.price');
        const currentPrice = document.querySelector('div.price');
        if (newPrice && currentPrice) currentPrice.replaceWith(newPrice);

        // Replace product form (for correct variant ID in cart)
        const newForm = tempDiv.querySelector('product-form');
        const currentForm = document.querySelector('product-form');
        if (newForm && currentForm) currentForm.replaceWith(newForm);

        // Replace variant selects (and re-bind events)
        const newVariantSelects = tempDiv.querySelector('custom-variant-selects');
        const currentVariantSelects = document.querySelector('custom-variant-selects');
        if (newVariantSelects && currentVariantSelects) {
          currentVariantSelects.replaceWith(newVariantSelects);
          newVariantSelects.bindEvents?.();
        }
      });
  }
}

// Register element only once
if (!customElements.get('custom-variant-selects')) {
  customElements.define('custom-variant-selects', CustomVariantSelects);
}