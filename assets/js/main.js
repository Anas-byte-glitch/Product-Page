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

  // Shipping rates lookup table by Wilaya code
  const shippingPrices = {
    "01": { home: 1400, office: 600 },
    "02": { home: 600, office: 300 },
    "03": { home: 800, office: 500 },
    "04": { home: 500, office: 300 },
    "05": { home: 500, office: 300 },
    "06": { home: 500, office: 300 },
    "07": { home: 800, office: 450 },
    "08": { home: 950, office: 500 },
    "09": { home: 500, office: 300 },
    "10": { home: 600, office: 300 },
    "11": { home: 1600, office: 1000 },
    "12": { home: 700, office: 300 },
    "13": { home: 700, office: 350 },
    "14": { home: 700, office: 300 },
    "15": { home: 500, office: 300 },
    "16": { home: 400, office: 200 },
    "17": { home: 800, office: 350 },
    "18": { home: 600, office: 300 },
    "19": { home: 700, office: 350 },
    "20": { home: 700, office: 350 },
    "21": { home: 700, office: 350 },
    "22": { home: 700, office: 350 },
    "23": { home: 700, office: 350 },
    "24": { home: 700, office: 350 },
    "25": { home: 650, office: 400 },
    "26": { home: 600, office: 300 },
    "27": { home: 650, office: 300 },
    "28": { home: 700, office: 300 },
    "29": { home: 700, office: 350 },
    "30": { home: 1000, office: 500 },
    "31": { home: 700, office: 350 },
    "32": { home: 1000, office: 550 },
    "33": { home: 1700, office: 950 },
    "34": { home: 650, office: 350 },
    "35": { home: 600, office: 300 },
    "36": { home: 700, office: 350 },
    "37": { home: 1500, office: 800 },
    "38": { home: 700, office: 350 },
    "39": { home: 900, office: 500 },
    "40": { home: 600, office: 350 },
    "41": { home: 700, office: 300 },
    "42": { home: 600, office: 300 },
    "43": { home: 600, office: 350 },
    "44": { home: 600, office: 350 },
    "45": { home: 1100, office: 700 },
    "46": { home: 700, office: 350 },
    "47": { home: 1000, office: 500 },
    "48": { home: 700, office: 300 },
    "49": { home: 1400, office: 800 },
    "50": { home: 1200, office: 800 },
    "51": { home: 800, office: 400 },
    "52": { home: 900, office: 500 },
    "53": { home: 1500, office: 700 },
    "54": { home: 1100, office: 500 },
    "55": { home: 1600, office: 1000 },
    "56": { home: 900, office: 500 },
    "57": { home: 1700, office: 950 },
    "58": { home: 1400, office: 800 }
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

  // 9. Inject Order Summary Box dynamically
  injectSummaryBox();

  // Pricing & Offers Logic
  function getPriceDetails(qty) {
    const config = window.productConfig;
    let pricePerUnit = config.price;
    
    if (config.pricingRules && config.pricingRules.length > 0) {
      let applicableRule = null;
      for (const rule of config.pricingRules) {
        if (qty >= rule.minQty) {
          if (!applicableRule || rule.minQty > applicableRule.minQty) {
            applicableRule = rule;
          }
        }
      }
      if (applicableRule) {
        pricePerUnit = applicableRule.price;
      }
    }
    
    return {
      pricePerUnit: pricePerUnit,
      totalPrice: pricePerUnit * qty
    };
  }

  function updatePriceDisplay() {
    const details = getPriceDetails(state.quantity);
    if (el.priceCurrent) {
      if (state.quantity > 1) {
        el.priceCurrent.innerHTML = `${details.totalPrice} <span class="price-currency">دج</span> <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal; margin-right: 8px;">(${details.pricePerUnit} دج / قطعة)</span>`;
      } else {
        el.priceCurrent.innerHTML = `${details.totalPrice} <span class="price-currency">دج</span>`;
      }
    }
  }

  function injectSummaryBox() {
    const orderForm = document.getElementById('order-form');
    if (orderForm && !document.getElementById('order-summary-box')) {
      const submitBtn = orderForm.querySelector('.submit-btn');
      if (submitBtn) {
        const summaryBox = document.createElement('div');
        summaryBox.id = 'order-summary-box';
        summaryBox.className = 'order-summary-box';
        summaryBox.style.cssText = 'background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: var(--radius-sm); padding: 15px; margin-bottom: 20px; display: none; text-align: right; direction: rtl;';
        summaryBox.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 600; color: var(--text-muted); font-size: 0.9rem;">سعر المنتجات:</span>
            <span id="summary-subtotal" style="font-weight: 700; color: var(--dark); font-size: 0.95rem;">0 دج</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 600; color: var(--text-muted); font-size: 0.9rem;">سعر التوصيل (<span id="summary-delivery-type">...</span>):</span>
            <span id="summary-shipping" style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">0 دج</span>
          </div>
          <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 1.05rem;">
            <span style="font-weight: 800; color: var(--dark);">المجموع الإجمالي:</span>
            <span id="summary-total" style="font-weight: 800; color: var(--primary);">0 دج</span>
          </div>
        `;
        orderForm.insertBefore(summaryBox, submitBtn);
      }
    }
  }

  function updateOrderSummary() {
    const summaryBox = document.getElementById('order-summary-box');
    if (!summaryBox) return;

    const wilayaVal = el.wilaya ? el.wilaya.value : '';
    if (!wilayaVal) {
      summaryBox.style.display = 'none';
      return;
    }

    summaryBox.style.display = 'block';

    const priceDetails = getPriceDetails(state.quantity);
    const subtotal = priceDetails.totalPrice;

    const rates = shippingPrices[wilayaVal] || { home: 600, office: 350 };
    const shipping = state.selectedDelivery === 'home' ? rates.home : rates.office;
    const deliveryText = state.selectedDelivery === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب';

    const total = subtotal + shipping;

    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryShipping = document.getElementById('summary-shipping');
    const summaryTotal = document.getElementById('summary-total');
    const summaryDeliveryType = document.getElementById('summary-delivery-type');

    if (summarySubtotal) summarySubtotal.textContent = `${subtotal} دج`;
    if (summaryShipping) summaryShipping.textContent = `${shipping} دج`;
    if (summaryTotal) summaryTotal.textContent = `${total} دج`;
    if (summaryDeliveryType) summaryDeliveryType.textContent = deliveryText;
  }

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
    updatePriceDisplay();
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
      updateOrderSummary();
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
          
          // Bidirectional sync with color option pills
          const colorPills = document.querySelectorAll('#color-container .option-pill');
          if (colorPills && colorPills[idx]) {
            colorPills.forEach(p => p.classList.remove('active'));
            colorPills[idx].classList.add('active');
            state.selectedColor = config.colors[idx];
          }
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
          
          // Bidirectional sync with image gallery thumbnails
          const thumbs = document.querySelectorAll('.thumbnail');
          if (thumbs && thumbs[idx] && !thumbs[idx].classList.contains('active')) {
            thumbs[idx].click();
          }
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
        updateOrderSummary();
      });
    });
  }

  function initQuantityCounter() {
    if (!el.qtyMinus || !el.qtyPlus || !el.qtyVal) return;

    el.qtyMinus.addEventListener('click', () => {
      if (state.quantity > 1) {
        state.quantity--;
        el.qtyVal.value = state.quantity;
        updatePriceDisplay();
        updateOrderSummary();
      }
    });

    el.qtyPlus.addEventListener('click', () => {
      if (state.quantity < 99) {
        state.quantity++;
        el.qtyVal.value = state.quantity;
        updatePriceDisplay();
        updateOrderSummary();
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
      const priceDetails = getPriceDetails(state.quantity);
      const subtotal = priceDetails.totalPrice;
      
      const rates = shippingPrices[wilayaVal] || { home: 600, office: 350 };
      const shipping = state.selectedDelivery === 'home' ? rates.home : rates.office;
      const totalPrice = subtotal + shipping;

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
      if (state.quantity > 1 && priceDetails.pricePerUnit !== config.price) {
        message += `سعر القطعة (في العرض): ${priceDetails.pricePerUnit} دج\n`;
      }
      message += `سعر المنتجات: ${subtotal} دج\n`;
      message += `سعر التوصيل: ${shipping} دج\n`;
      message += `المجموع الإجمالي: ${totalPrice} دج\n`;
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
