/**
 * Premium E-commerce SPLP Main JavaScript Controller
 * Core Logic for dynamic rendering, gallery, form handling & WhatsApp API routing
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure product config is loaded
  if (!window.productConfig) {
    console.error('Product configuration is missing!');
    showToast('خطأ في تحميل بيانات المنتج!', 'error');
    return;
  }

  // State Management
  const state = {
    selectedColor: '',
    selectedSize: '',
    selectedDelivery: 'home', // default
    quantity: 1
  };

  // DOM Elements
  const el = {
    badge: document.getElementById('badge-discount'),
    title: document.getElementById('product-title'),
    priceCurrent: document.getElementById('price-current'),
    priceOld: document.getElementById('price-old'),
    galleryMain: document.getElementById('gallery-main'),
    galleryThumbnails: document.getElementById('gallery-thumbnails'),
    colorSection: document.getElementById('color-section'),
    colorContainer: document.getElementById('color-container'),
    sizeSection: document.getElementById('size-section'),
    sizeContainer: document.getElementById('size-container'),
    descriptionContent: document.getElementById('description-content'),
    trustBadges: document.getElementById('trust-badges'),
    
    // Form Inputs
    form: document.getElementById('order-form'),
    fullName: document.getElementById('full-name'),
    phone: document.getElementById('phone-number'),
    wilaya: document.getElementById('select-wilaya'),
    commune: document.getElementById('select-commune'),
    deliveryCards: document.querySelectorAll('.delivery-card'),
    qtyMinus: document.getElementById('qty-minus'),
    qtyPlus: document.getElementById('qty-plus'),
    qtyVal: document.getElementById('qty-val'),
    notes: document.getElementById('order-notes'),
    
    // UI Helpers
    stickyCta: document.getElementById('sticky-cta'),
    stickyCtaBtn: document.getElementById('sticky-cta-btn')
  };

  // 1. Initialize Product UI from config
  initProductUI();
  
  // 2. Initialize Wilayas & Communes Dropdowns
  initWilayaSelect();

  // 3. Setup Gallery Actions
  initGallery();

  // 4. Setup Custom Options (Colors & Sizes)
  initOptions();

  // 5. Setup Delivery Options Card Toggle
  initDeliveryToggle();

  // 6. Setup Quantity Counter Actions
  initQuantityCounter();

  // 7. Setup Scroll Listener for Mobile Sticky CTA
  initStickyCtaScroll();

  // 8. Form Submission & WhatsApp Routing
  initFormSubmission();


  // ==========================================
  // Core Functions
  // ==========================================

  function initProductUI() {
    const config = window.productConfig;

    // Badges & Texts
    if (el.badge) {
      if (config.badge) {
        el.badge.textContent = config.badge;
      } else {
        el.badge.style.display = 'none';
      }
    }
    if (el.title) el.title.textContent = config.name;
    if (el.priceCurrent) {
      el.priceCurrent.innerHTML = `${config.price} <span class="price-currency">دج</span>`;
    }
    if (el.priceOld) {
      if (config.oldPrice) {
        el.priceOld.innerHTML = `${config.oldPrice} دج`;
      } else {
        el.priceOld.style.display = 'none';
      }
    }
    
    // Description HTML
    if (el.descriptionContent) {
      el.descriptionContent.innerHTML = config.description || '';
    }

    // Trust Features Custom Injection
    if (el.trustBadges && config.features) {
      el.trustBadges.innerHTML = config.features.map(f => {
        let iconClass = 'fa-shipping-fast';
        if (f.icon === 'cod') iconClass = 'fa-wallet';
        if (f.icon === 'warranty') iconClass = 'fa-shield-alt';
        
        return `
          <div class="trust-badge-card">
            <div class="trust-icon">
              <i class="fas ${iconClass}"></i>
            </div>
            <span class="trust-text">${f.text}</span>
          </div>
        `;
      }).join('');
    }
  }

  function initWilayaSelect() {
    if (!el.wilaya || !el.commune) return;

    // Add placeholder to Wilaya select
    el.wilaya.innerHTML = '<option value="" disabled selected>اختر الولاية...</option>';
    el.commune.innerHTML = '<option value="" disabled selected>اختر البلدية...</option>';
    el.commune.disabled = true;

    // Populate Wilayas using algerianWilayas array from wilayas.js
    if (typeof algerianWilayas !== 'undefined') {
      algerianWilayas.forEach(w => {
        const option = document.createElement('option');
        option.value = w.code;
        option.textContent = `${w.code} - ${w.name_ar} (${w.name_en})`;
        el.wilaya.appendChild(option);
      });
    }

    // Event listener on Wilaya change
    el.wilaya.addEventListener('change', (e) => {
      const selectedCode = e.target.value;
      populateCommunes(selectedCode);
    });
  }

  function populateCommunes(wilayaCode) {
    if (!el.commune) return;
    
    el.commune.innerHTML = '<option value="" disabled selected>اختر البلدية...</option>';
    el.commune.disabled = true;

    if (typeof algerianWilayas === 'undefined') return;

    const wilayaObj = algerianWilayas.find(w => w.code === wilayaCode);
    if (wilayaObj && wilayaObj.communes) {
      el.commune.disabled = false;
      wilayaObj.communes.forEach(c => {
        const option = document.createElement('option');
        option.value = c.name_ar;
        option.textContent = `${c.name_ar} / ${c.name_en}`;
        el.commune.appendChild(option);
      });
    }
  }

  function initGallery() {
    const config = window.productConfig;
    if (!el.galleryMain || !config.images || config.images.length === 0) return;

    // Load first image as main
    el.galleryMain.src = config.images[0];
    
    // Clear & Populate Thumbnails
    if (el.galleryThumbnails) {
      el.galleryThumbnails.innerHTML = '';
      config.images.forEach((imgSrc, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `thumbnail ${idx === 0 ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${imgSrc}" alt="صورة المنتج ${idx + 1}" loading="lazy">`;
        
        thumb.addEventListener('click', () => {
          // Switch main image
          el.galleryMain.classList.remove('zoomed');
          el.galleryMain.src = imgSrc;
          
          // Switch active class
          document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        });

        el.galleryThumbnails.appendChild(thumb);
      });
    }

    // Add click zoom effect to main gallery image
    el.galleryMain.addEventListener('click', () => {
      el.galleryMain.classList.toggle('zoomed');
    });
  }

  function initOptions() {
    const config = window.productConfig;

    // Colors Setup
    if (config.colors && config.colors.length > 0) {
      el.colorSection.style.display = 'block';
      el.colorContainer.innerHTML = '';
      config.colors.forEach((color, idx) => {
        const pill = document.createElement('div');
        pill.className = `option-pill ${idx === 0 ? 'active' : ''}`;
        pill.textContent = color;
        
        if (idx === 0) state.selectedColor = color;

        pill.addEventListener('click', () => {
          document.querySelectorAll('#color-container .option-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.selectedColor = color;
        });

        el.colorContainer.appendChild(pill);
      });
    } else {
      el.colorSection.style.display = 'none';
      state.selectedColor = '';
    }

    // Sizes Setup
    if (config.sizes && config.sizes.length > 0) {
      el.sizeSection.style.display = 'block';
      el.sizeContainer.innerHTML = '';
      config.sizes.forEach((size, idx) => {
        const pill = document.createElement('div');
        pill.className = `option-pill ${idx === 0 ? 'active' : ''}`;
        pill.textContent = size;

        if (idx === 0) state.selectedSize = size;

        pill.addEventListener('click', () => {
          document.querySelectorAll('#size-container .option-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.selectedSize = size;
        });

        el.sizeContainer.appendChild(pill);
      });
    } else {
      el.sizeSection.style.display = 'none';
      state.selectedSize = '';
    }
  }

  function initDeliveryToggle() {
    el.deliveryCards.forEach(card => {
      card.addEventListener('click', () => {
        el.deliveryCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.selectedDelivery = card.dataset.delivery;
      });
    });
  }

  function initQuantityCounter() {
    if (!el.qtyMinus || !el.qtyPlus || !el.qtyVal) return;

    el.qtyMinus.addEventListener('click', () => {
      if (state.quantity > 1) {
        state.quantity--;
        el.qtyVal.value = state.quantity;
      }
    });

    el.qtyPlus.addEventListener('click', () => {
      if (state.quantity < 99) {
        state.quantity++;
        el.qtyVal.value = state.quantity;
      }
    });
  }

  function initStickyCtaScroll() {
    if (!el.stickyCta || !el.form || !el.stickyCtaBtn) return;

    // Throttle scroll execution
    let isScrolling;
    window.addEventListener('scroll', () => {
      clearTimeout(isScrolling);
      isScrolling = setTimeout(() => {
        const formRect = el.form.getBoundingClientRect();
        
        // If the form's top is below the viewport bottom (not yet reached)
        // or form's bottom is above the viewport top (scrolled past it)
        const isFormInvisible = formRect.top > window.innerHeight || formRect.bottom < 0;

        if (isFormInvisible) {
          el.stickyCta.classList.add('visible');
        } else {
          el.stickyCta.classList.remove('visible');
        }
      }, 50);
    });

    // Sticky CTA click scrolls to form
    el.stickyCtaBtn.addEventListener('click', () => {
      el.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.fullName.focus();
    });
  }

  function initFormSubmission() {
    if (!el.form) return;

    el.form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Form Validation
      const nameVal = el.fullName.value.trim();
      const phoneVal = el.phone.value.trim();
      const wilayaVal = el.wilaya.value;
      const communeVal = el.commune.value;
      const notesVal = el.notes.value.trim();

      // 1. Validation Name
      if (nameVal.length < 3) {
        showToast('الرجاء إدخال الاسم الكامل بشكل صحيح (3 أحرف على الأقل)', 'error');
        el.fullName.focus();
        return;
      }

      // 2. Validation Phone Number (Algerian numbers format checks: 10 digits starting with 05, 06, 07 or 9 digits starting with 5, 6, 7)
      const phoneClean = phoneVal.replace(/\s+/g, '');
      const dzPhonePattern = /^(05|06|07|02|03|04|5|6|7)[0-9]{8}$/;
      if (!dzPhonePattern.test(phoneClean)) {
        showToast('الرجاء إدخال رقم هاتف جزائري صالح (مثال: 0550123456)', 'error');
        el.phone.focus();
        return;
      }

      // 3. Validation Wilaya
      if (!wilayaVal) {
        showToast('الرجاء اختيار الولاية من القائمة', 'error');
        el.wilaya.focus();
        return;
      }

      // 4. Validation Commune
      if (!communeVal) {
        showToast('الرجاء اختيار البلدية من القائمة', 'error');
        el.commune.focus();
        return;
      }

      // Compile data for submission
      const selectedWilayaObj = algerianWilayas.find(w => w.code === wilayaVal);
      const wilayaName = selectedWilayaObj ? selectedWilayaObj.name_ar : wilayaVal;
      
      const deliveryText = state.selectedDelivery === 'home' ? 'توصيل إلى المنزل' : 'توصيل إلى المكتب';

      // Price compilation
      const config = window.productConfig;
      const totalPrice = config.price * state.quantity;

      // Construct Message Template
      let message = `طلب جديد:\n`;
      message += `المنتج: ${config.name}\n`;
      
      if (state.selectedColor) {
        message += `اللون: ${state.selectedColor}\n`;
      }
      if (state.selectedSize) {
        message += `المقاس: ${state.selectedSize}\n`;
      }
      
      message += `الكمية: ${state.quantity}\n`;
      message += `السعر الإجمالي: ${totalPrice} دج\n`;
      message += `الاسم: ${nameVal}\n`;
      message += `الهاتف: ${phoneVal}\n`;
      message += `الولاية: ${wilayaName}\n`;
      message += `البلدية: ${communeVal}\n`;
      message += `التوصيل: ${deliveryText}`;
      
      if (notesVal) {
        message += `\nملاحظات: ${notesVal}`;
      }

      // Format WhatsApp URL
      const whatsappPhone = config.whatsappNumber; // e.g. "213550123456"
      const encodedText = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodedText}`;

      // Show success toast
      showToast('جاري تحويلك إلى واتساب لتأكيد الطلب...', 'success');

      // Delayed redirection for better UX
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1500);
    });
  }

  // ==========================================
  // Helper Toast Notification
  // ==========================================
  function showToast(message, type = 'success') {
    // Create toast container if not exists
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas ${icon}"></i>
      </div>
      <div class="toast-message">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation frame for CSS transition
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Remove toast after delay
    setTimeout(() => {
      toast.classList.remove('show');
      // Wait for slide-out transition to complete
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 4000);
  }
});
