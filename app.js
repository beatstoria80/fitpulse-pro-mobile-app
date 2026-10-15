/**
 * FITPULSE PRO • HEALTH & FITNESS TRACKER JAVASCRIPT CORE
 * Tailored for Pak Nandang (USR-4616069)
 * Full Reactive State, LocalStorage Persistence, Calorie Ring SVG Animation,
 * Dynamic Activity & Nutrition Calculators, Export JSON capability.
 */

// Initial Seed Data directly matching user request
const DEFAULT_APP_DATA = {
  user_profile: {
    user_id: "USR-4616069",
    created_at: "2026-10-15T08:00:00Z",
    demographics: {
      age: 46,
      gender: "male",
      marital_status: "single"
    },
    biometrics: {
      height_cm: 160.0,
      weight_kg: 69.0,
      estimated_body_fat_percentage: 26.7,
      target_body_fat_percentage: 22.0,
      bmi: 26.95,
      bmi_status: "Overweight / Obesity Class I"
    },
    fitness_goals: {
      target_weight_kg: 58.5,
      daily_calorie_target: 1800,
      daily_water_target_ml: 2500
    }
  },
  water_tracker: {
    consumed_ml: 1250,
    target_ml: 2500
  },
  activity_logs: [
    {
      activity_log_id: "ACT-20261015-001",
      timestamp_start: "2026-10-15T16:00:00Z",
      timestamp_end: "2026-10-15T16:45:00Z",
      activity_type: "Skateboard",
      metrics: {
        duration_minutes: 45,
        intensity_level: "medium",
        calories_burned: 280,
        average_heart_rate: 125,
        steps_counted: null
      },
      device_source: "Mobile Native Sensor / Apple Watch"
    },
    {
      activity_log_id: "ACT-20261015-002",
      timestamp_start: "2026-10-15T06:00:00Z",
      timestamp_end: "2026-10-15T06:30:00Z",
      activity_type: "Power Walking",
      metrics: {
        duration_minutes: 30,
        intensity_level: "low",
        calories_burned: 150,
        average_heart_rate: 105,
        steps_counted: 3500
      },
      device_source: "iPhone HealthKit"
    }
  ],
  nutrition_logs: [
    {
      nutrition_log_id: "NUT-20261015-092",
      log_date: "2026-10-15",
      meal_time: "breakfast",
      food_items: [
        {
          food_name: "Nasi Merah",
          serving_size: "1 porsi",
          weight_grams: 100,
          calories: 110,
          carbs: 23,
          protein: 3,
          fat: 1
        },
        {
          food_name: "Dada Ayam Panggang",
          serving_size: "1 potong",
          weight_grams: 120,
          calories: 195,
          carbs: 0,
          protein: 32,
          fat: 3.5
        }
      ],
      total_macros_summary: {
        total_calories: 305,
        carbohydrates_g: 28.0,
        protein_g: 35.0,
        fat_g: 4.5
      }
    }
  ]
};

class FitPulseApp {
  constructor() {
    this.storageKey = 'fitpulse_data_usr4616069';
    this.sbUrlKey = 'fitpulse_sb_url';
    this.sbAnonKey = 'fitpulse_sb_key';
    this.supabase = null;
    this.isCloudSync = false;

    this.data = this.loadData();
    this.initElements();
    this.bindEvents();
    this.renderAll();
    this.updateClock();
    setInterval(() => this.updateClock(), 30000);

    // Auto-connect to Supabase if credentials saved
    this.checkAutoConnectSupabase();
  }

  // Load from LocalStorage or seed default
  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Storage error, fallback to defaults", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error("Save error", e);
    }
    this.renderJsonInspector();
  }

  initElements() {
    // Desktop View controls
    this.btnViewMobile = document.getElementById('btnViewMobile');
    this.btnViewFull = document.getElementById('btnViewFull');
    this.btnQuickExport = document.getElementById('btnQuickExport');

    // Bottom Navigation
    this.navItems = document.querySelectorAll('.nav-item');
    this.tabPanes = document.querySelectorAll('.tab-pane');

    // Dashboard dynamic labels
    this.valRemainingCalories = document.getElementById('valRemainingCalories');
    this.valIntakeCalories = document.getElementById('valIntakeCalories');
    this.valBurnCalories = document.getElementById('valBurnCalories');
    this.ringCalories = document.getElementById('ringCalories');

    // Macro bars
    this.labelProtein = document.getElementById('labelProtein');
    this.barProtein = document.getElementById('barProtein');
    this.labelCarbs = document.getElementById('labelCarbs');
    this.barCarbs = document.getElementById('barCarbs');
    this.labelFat = document.getElementById('labelFat');
    this.barFat = document.getElementById('barFat');

    // Biometrics displays
    this.displayCurrentWeight = document.getElementById('displayCurrentWeight');
    this.displayCurrentBodyFat = document.getElementById('displayCurrentBodyFat');

    // Water tracker
    this.valWaterConsumed = document.getElementById('valWaterConsumed');
    this.waterLevelFill = document.getElementById('waterLevelFill');
    this.btnUndoWater = document.getElementById('btnUndoWater');

    // Activity containers
    this.dashboardActivitiesList = document.getElementById('dashboardActivitiesList');
    this.fullActivitiesList = document.getElementById('fullActivitiesList');
    this.totalActiveTime = document.getElementById('totalActiveTime');
    this.totalActiveBurn = document.getElementById('totalActiveBurn');
    this.totalSteps = document.getElementById('totalSteps');

    // Nutrition elements
    this.nutriCurrentCal = document.getElementById('nutriCurrentCal');
    this.nutriRemainingCal = document.getElementById('nutriRemainingCal');
    this.nutriTotalProtein = document.getElementById('nutriTotalProtein');
    this.nutriTotalCarbs = document.getElementById('nutriTotalCarbs');
    this.nutriTotalFat = document.getElementById('nutriTotalFat');

    // Modals
    this.modalAddActivity = document.getElementById('modalAddActivity');
    this.modalAddFood = document.getElementById('modalAddFood');
    this.modalProfile = document.getElementById('modalProfile');
    this.modalSupabase = document.getElementById('modalSupabase');

    // Supabase controls & inputs
    this.btnOpenSupabaseModal = document.getElementById('btnOpenSupabaseModal');
    this.btnCloudChip = document.getElementById('btnCloudChip');
    this.cloudChipText = document.getElementById('cloudChipText');
    this.supabaseStatusLabel = document.getElementById('supabaseStatusLabel');
    this.sbUrl = document.getElementById('sbUrl');
    this.sbKey = document.getElementById('sbKey');
    this.sbDot = document.getElementById('sbDot');
    this.sbStatusText = document.getElementById('sbStatusText');
    this.btnDisconnectSupabase = document.getElementById('btnDisconnectSupabase');
    this.formSupabase = document.getElementById('formSupabase');

    // Activity Form preview
    this.actType = document.getElementById('actType');
    this.actDuration = document.getElementById('actDuration');
    this.actIntensity = document.getElementById('actIntensity');
    this.actCaloriePreview = document.getElementById('actCaloriePreview');

    // Toast
    this.toastContainer = document.getElementById('toastContainer');
    this.jsonPreviewBox = document.getElementById('jsonPreviewBox');
  }

  bindEvents() {
    // 1. Navigation switching
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // 2. Desktop Mode Toggles
    this.btnViewMobile.addEventListener('click', () => {
      document.body.classList.remove('fullscreen-mode');
      document.body.classList.add('device-framed');
      this.btnViewMobile.classList.add('active');
      this.btnViewFull.classList.remove('active');
    });

    this.btnViewFull.addEventListener('click', () => {
      document.body.classList.add('fullscreen-mode');
      document.body.classList.remove('device-framed');
      this.btnViewFull.classList.add('active');
      this.btnViewMobile.classList.remove('active');
    });

    // 3. Quick Export
    this.btnQuickExport.addEventListener('click', () => this.exportJsonFile());
    const btnCopyJson = document.getElementById('btnCopyJson');
    if (btnCopyJson) {
      btnCopyJson.addEventListener('click', () => this.copyJsonToClipboard());
    }

    // 4. Water Quick Adds
    document.querySelectorAll('.btn-water-quick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const amount = parseInt(btn.getAttribute('data-amount'), 10);
        this.addWater(amount);
      });
    });

    if (this.btnUndoWater) {
      this.btnUndoWater.addEventListener('click', () => this.addWater(-250));
    }

    // 5. Modals Open / Close
    const btnOpenAddActivityModal = document.getElementById('btnOpenAddActivityModal');
    if (btnOpenAddActivityModal) {
      btnOpenAddActivityModal.addEventListener('click', () => this.openModal(this.modalAddActivity));
    }

    const btnOpenAddFoodModal = document.getElementById('btnOpenAddFoodModal');
    if (btnOpenAddFoodModal) {
      btnOpenAddFoodModal.addEventListener('click', () => this.openModal(this.modalAddFood));
    }

    const btnOpenProfileModal = document.getElementById('btnOpenProfileModal');
    if (btnOpenProfileModal) {
      btnOpenProfileModal.addEventListener('click', () => this.openProfileModal());
    }

    // Open Supabase Modal
    if (this.btnOpenSupabaseModal) {
      this.btnOpenSupabaseModal.addEventListener('click', () => this.openSupabaseModal());
    }
    if (this.btnCloudChip) {
      this.btnCloudChip.addEventListener('click', () => this.openSupabaseModal());
    }

    // Close buttons on modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close');
        this.closeModal(document.getElementById(targetId));
      });
    });

    // Backdrop click to close
    [this.modalAddActivity, this.modalAddFood, this.modalProfile, this.modalSupabase].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal);
      });
    });

    // 6. Activity Live Calorie Estimator
    const updateActPreview = () => {
      const type = this.actType.value;
      const duration = parseInt(this.actDuration.value, 10) || 0;
      const intensity = this.actIntensity.value;
      const weight = this.data.user_profile.biometrics.weight_kg || 69;
      const estCal = this.calculateEstimatedBurn(type, duration, intensity, weight);
      this.actCaloriePreview.textContent = `~${estCal} kkal`;
    };
    this.actType.addEventListener('change', updateActPreview);
    this.actDuration.addEventListener('input', updateActPreview);
    this.actIntensity.addEventListener('change', updateActPreview);

    // 7. Activity Form Submit
    const formAddActivity = document.getElementById('formAddActivity');
    if (formAddActivity) {
      formAddActivity.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddActivitySubmit();
      });
    }

    // 8. Food Preset Tags
    document.querySelectorAll('.food-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.getElementById('foodName').value = tag.getAttribute('data-name');
        document.getElementById('foodWeight').value = tag.getAttribute('data-g');
        document.getElementById('foodCalories').value = tag.getAttribute('data-cal');
        document.getElementById('foodProtein').value = tag.getAttribute('data-p');
        document.getElementById('foodCarbs').value = tag.getAttribute('data-c');
        document.getElementById('foodFat').value = tag.getAttribute('data-f');
        this.showToast(`Memilih resep: ${tag.getAttribute('data-name')}`);
      });
    });

    // 9. Quick Add Meal Buttons (plus icons on meals list)
    document.querySelectorAll('.btn-quick-add-meal').forEach(btn => {
      btn.addEventListener('click', () => {
        const meal = btn.getAttribute('data-meal');
        const select = document.getElementById('foodMealSelect');
        if (select) select.value = meal;
        this.openModal(this.modalAddFood);
      });
    });

    // 10. Food Form Submit
    const formAddFood = document.getElementById('formAddFood');
    if (formAddFood) {
      formAddFood.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddFoodSubmit();
      });
    }

    // 11. Profile Form Submit
    const formProfile = document.getElementById('formProfile');
    if (formProfile) {
      formProfile.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProfileSubmit();
      });
    }

    // Live BMI Recalculator in Profile modal
    const profHeight = document.getElementById('profHeight');
    const profWeight = document.getElementById('profWeight');
    const updateBmiDisplay = () => {
      const h = parseFloat(profHeight.value) / 100;
      const w = parseFloat(profWeight.value);
      if (h > 0 && w > 0) {
        const bmi = (w / (h * h)).toFixed(2);
        let status = "Normal";
        if (bmi >= 25 && bmi < 30) status = "Overweight / Obesitas I";
        else if (bmi >= 30) status = "Obesitas II";
        else if (bmi < 18.5) status = "Berat Badan Kurang";
        document.getElementById('profBmiCalc').textContent = `BMI ${bmi} • ${status}`;
      }
    };
    if (profHeight && profWeight) {
      profHeight.addEventListener('input', updateBmiDisplay);
      profWeight.addEventListener('input', updateBmiDisplay);
    }

    // Shortcut: See all activities
    const btnSeeAllActivities = document.getElementById('btnSeeAllActivities');
    if (btnSeeAllActivities) {
      btnSeeAllActivities.addEventListener('click', () => this.switchTab('tabActivities'));
    }

    // Shortcut: Info button
    const btnEnergyInfo = document.getElementById('btnEnergyInfo');
    if (btnEnergyInfo) {
      btnEnergyInfo.addEventListener('click', () => {
        this.showToast("BMR 1.465 kkal + Bakar Aktif 430 kkal = TDEE ~2.150 kkal.");
      });
    }

    // 12. Supabase Form Submit & Disconnect
    if (this.formSupabase) {
      this.formSupabase.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveSupabase();
      });
    }
    if (this.btnDisconnectSupabase) {
      this.btnDisconnectSupabase.addEventListener('click', () => {
        this.disconnectSupabase();
      });
    }
  }

  updateClock() {
    const el = document.getElementById('statusClock');
    if (!el) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${hours}:${mins}`;
  }

  switchTab(tabId) {
    this.navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    this.tabPanes.forEach(pane => {
      if (pane.id === tabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Scroll to top of pane
    const content = document.getElementById('appContent');
    if (content) content.scrollTop = 0;
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
  }

  showToast(message, icon = "fa-circle-check") {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${icon} color-green"></i> <span>${message}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ================= WATER TRACKER =================
  addWater(amount) {
    if (!this.data.water_tracker) {
      this.data.water_tracker = { consumed_ml: 0, target_ml: 2500 };
    }
    this.data.water_tracker.consumed_ml = Math.max(0, this.data.water_tracker.consumed_ml + amount);
    this.saveData();
    this.renderWater();

    // Sync to Supabase Cloud if connected
    if (this.supabase && this.isCloudSync) {
      this.syncWaterToSupabase(this.data.water_tracker.consumed_ml, this.data.water_tracker.target_ml);
    }

    if (amount > 0) {
      this.showToast(`+${amount} ml air ditambahkan! Total: ${this.data.water_tracker.consumed_ml} ml`, "fa-droplet");
    }
  }

  renderWater() {
    const consumed = this.data.water_tracker?.consumed_ml || 0;
    const target = this.data.user_profile.fitness_goals.daily_water_target_ml || 2500;
    if (this.valWaterConsumed) {
      this.valWaterConsumed.textContent = `${consumed.toLocaleString('id-ID')}`;
    }
    if (this.waterLevelFill) {
      const pct = Math.min(100, Math.round((consumed / target) * 100));
      this.waterLevelFill.style.width = `${pct}%`;
    }
  }

  // ================= CALORIE & MACRO CALCULATIONS =================
  calculateTotals() {
    let totalIntake = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

    (this.data.nutrition_logs || []).forEach(log => {
      if (log.total_macros_summary) {
        totalIntake += Number(log.total_macros_summary.total_calories || 0);
        totalCarbs += Number(log.total_macros_summary.carbohydrates_g || 0);
        totalProtein += Number(log.total_macros_summary.protein_g || 0);
        totalFat += Number(log.total_macros_summary.fat_g || 0);
      }
    });

    let totalBurn = 0;
    let totalMinutes = 0;
    let totalSteps = 0;

    (this.data.activity_logs || []).forEach(act => {
      if (act.metrics) {
        totalBurn += Number(act.metrics.calories_burned || 0);
        totalMinutes += Number(act.metrics.duration_minutes || 0);
        if (act.metrics.steps_counted) {
          totalSteps += Number(act.metrics.steps_counted || 0);
        }
      }
    });

    const targetCal = this.data.user_profile.fitness_goals.daily_calorie_target || 1800;
    const remainingCal = Math.max(0, targetCal - totalIntake);

    return {
      targetCal,
      totalIntake,
      remainingCal,
      totalBurn,
      totalMinutes,
      totalSteps,
      totalCarbs,
      totalProtein,
      totalFat
    };
  }

  renderEnergyAndMacros() {
    const totals = this.calculateTotals();

    // Values in Hero Card
    if (this.valRemainingCalories) {
      this.valRemainingCalories.textContent = totals.remainingCal.toLocaleString('id-ID');
    }
    if (this.valIntakeCalories) {
      this.valIntakeCalories.textContent = totals.totalIntake.toLocaleString('id-ID');
    }
    if (this.valBurnCalories) {
      this.valBurnCalories.textContent = totals.totalBurn.toLocaleString('id-ID');
    }

    // Dynamic Island
    const islandText = document.querySelector('.island-text');
    if (islandText) {
      islandText.textContent = `${totals.totalBurn} kkal terbakar`;
    }

    // Animated SVG Circular Gauge
    // Circumference = 2 * PI * r = 2 * 3.14159 * 76 = ~477.5
    if (this.ringCalories) {
      const circumference = 477.5;
      const percent = Math.min(1, totals.totalIntake / totals.targetCal);
      const offset = circumference - (percent * circumference);
      this.ringCalories.style.strokeDashoffset = offset;
    }

    // Macro targets for 1800 kcal diet (46 yo, 69kg):
    // Protein target: ~135g (approx 2.0g/kg lean protection)
    // Carbs target: ~180g (stable energy)
    // Fat target: ~50g (healthy hormonal balance)
    const targetProtein = 135;
    const targetCarbs = 180;
    const targetFat = 50;

    if (this.labelProtein) {
      this.labelProtein.textContent = `${totals.totalProtein.toFixed(1)}g / ${targetProtein}g`;
    }
    if (this.barProtein) {
      const pct = Math.min(100, Math.round((totals.totalProtein / targetProtein) * 100));
      this.barProtein.style.width = `${pct}%`;
    }

    if (this.labelCarbs) {
      this.labelCarbs.textContent = `${totals.totalCarbs.toFixed(1)}g / ${targetCarbs}g`;
    }
    if (this.barCarbs) {
      const pct = Math.min(100, Math.round((totals.totalCarbs / targetCarbs) * 100));
      this.barCarbs.style.width = `${pct}%`;
    }

    if (this.labelFat) {
      this.labelFat.textContent = `${totals.totalFat.toFixed(1)}g / ${targetFat}g`;
    }
    if (this.barFat) {
      const pct = Math.min(100, Math.round((totals.totalFat / targetFat) * 100));
      this.barFat.style.width = `${pct}%`;
    }

    // Nutrition Tab Summary
    if (this.nutriCurrentCal) this.nutriCurrentCal.textContent = totals.totalIntake;
    if (this.nutriRemainingCal) this.nutriRemainingCal.textContent = totals.remainingCal;
    if (this.nutriTotalProtein) this.nutriTotalProtein.textContent = `${totals.totalProtein.toFixed(1)}g`;
    if (this.nutriTotalCarbs) this.nutriTotalCarbs.textContent = `${totals.totalCarbs.toFixed(1)}g`;
    if (this.nutriTotalFat) this.nutriTotalFat.textContent = `${totals.totalFat.toFixed(1)}g`;

    // Activity Tab Summary
    if (this.totalActiveTime) this.totalActiveTime.textContent = totals.totalMinutes;
    if (this.totalActiveBurn) this.totalActiveBurn.textContent = totals.totalBurn;
    if (this.totalSteps) this.totalSteps.textContent = totals.totalSteps.toLocaleString('id-ID');
  }

  // ================= ACTIVITIES RENDER =================
  renderActivities() {
    const activities = this.data.activity_logs || [];

    // 1. Dashboard mini preview (last 2)
    if (this.dashboardActivitiesList) {
      this.dashboardActivitiesList.innerHTML = activities.slice(0, 3).map(act => {
        const iconClass = act.activity_type.toLowerCase().includes('skate')
          ? 'fa-solid fa-person-snowboarding skateboard'
          : act.activity_type.toLowerCase().includes('walk')
          ? 'fa-solid fa-person-walking walking'
          : 'fa-solid fa-heart-pulse general';

        const stepsText = act.metrics.steps_counted ? `• ${act.metrics.steps_counted.toLocaleString('id-ID')} steps` : '';
        const timeFormatted = this.formatTimeRange(act.timestamp_start, act.timestamp_end);

        return `
          <div class="activity-item-card">
            <div class="act-left">
              <div class="act-icon-box ${iconClass.split(' ').pop()}">
                <i class="${iconClass}"></i>
              </div>
              <div class="act-details">
                <h4>${act.activity_type}</h4>
                <div class="act-meta">
                  <span>${act.metrics.duration_minutes} mnt</span>
                  <span>${stepsText}</span>
                  <span>Avg HR ${act.metrics.average_heart_rate} bpm</span>
                </div>
              </div>
            </div>
            <div class="act-right">
              <span class="act-burn-val">-${act.metrics.calories_burned} kkal</span>
              <div class="act-hr-val">${timeFormatted}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Full Activities Tab
    if (this.fullActivitiesList) {
      this.fullActivitiesList.innerHTML = activities.map(act => {
        const iconClass = act.activity_type.toLowerCase().includes('skate')
          ? 'fa-solid fa-person-snowboarding skateboard'
          : act.activity_type.toLowerCase().includes('walk')
          ? 'fa-solid fa-person-walking walking'
          : 'fa-solid fa-dumbbell general';

        const intensityBadge = act.metrics.intensity_level === 'high'
          ? '<span class="badge-mini badge-rose">Intensitas Tinggi</span>'
          : act.metrics.intensity_level === 'medium'
          ? '<span class="badge-mini badge-orange">Intensitas Sedang</span>'
          : '<span class="badge-mini badge-green">Intensitas Rendah</span>';

        return `
          <div class="glass-card activity-full-card">
            <div class="card-header-clean">
              <div class="act-left">
                <div class="act-icon-box ${iconClass.split(' ').pop()}">
                  <i class="${iconClass}"></i>
                </div>
                <div>
                  <h4 style="font-size:16px;">${act.activity_type}</h4>
                  <span style="font-size:11px; color:var(--text-tertiary);">${act.device_source || 'Perangkat Pintar'}</span>
                </div>
              </div>
              <div>${intensityBadge}</div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; background:rgba(255,255,255,0.02); padding:10px; border-radius:12px; margin-top:8px;">
              <div style="text-align:center;">
                <span style="font-size:10px; color:var(--text-tertiary); display:block;">DURASI</span>
                <strong style="font-size:15px; color:white;">${act.metrics.duration_minutes} <small>mnt</small></strong>
              </div>
              <div style="text-align:center;">
                <span style="font-size:10px; color:var(--text-tertiary); display:block;">TERBAKAR</span>
                <strong style="font-size:15px; color:#FF512F;">${act.metrics.calories_burned} <small>kkal</small></strong>
              </div>
              <div style="text-align:center;">
                <span style="font-size:10px; color:var(--text-tertiary); display:block;">DETAK JANTUNG</span>
                <strong style="font-size:15px; color:#A78BFA;">${act.metrics.average_heart_rate} <small>bpm</small></strong>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  formatTimeRange(startStr, endStr) {
    if (!startStr) return '';
    try {
      const d1 = new Date(startStr);
      const h1 = String(d1.getHours()).padStart(2, '0');
      const m1 = String(d1.getMinutes()).padStart(2, '0');
      if (!endStr) return `${h1}:${m1}`;
      const d2 = new Date(endStr);
      const h2 = String(d2.getHours()).padStart(2, '0');
      const m2 = String(d2.getMinutes()).padStart(2, '0');
      return `${h1}:${m1} - ${h2}:${m2}`;
    } catch (e) {
      return '';
    }
  }

  // ================= NUTRITION & MEALS RENDER =================
  renderNutritionMeals() {
    const meals = {
      breakfast: { cal: 0, items: [] },
      lunch: { cal: 0, items: [] },
      snack: { cal: 0, items: [] },
      dinner: { cal: 0, items: [] }
    };

    (this.data.nutrition_logs || []).forEach(log => {
      const time = log.meal_time || 'lunch';
      if (!meals[time]) meals[time] = { cal: 0, items: [] };

      meals[time].cal += Number(log.total_macros_summary?.total_calories || 0);
      (log.food_items || []).forEach(item => {
        meals[time].items.push(item);
      });
    });

    // Breakfast
    const itemsBreakfast = document.getElementById('itemsBreakfast');
    const calBreakfast = document.getElementById('calBreakfast');
    if (itemsBreakfast && calBreakfast) {
      calBreakfast.textContent = `${meals.breakfast.cal} kkal`;
      if (meals.breakfast.items.length === 0) {
        itemsBreakfast.innerHTML = `<div class="empty-meal-hint"><i class="fa-regular fa-clock"></i> Belum ada catatan sarapan.</div>`;
      } else {
        itemsBreakfast.innerHTML = meals.breakfast.items.map(item => `
          <div class="food-row-item">
            <div class="food-item-info">
              <span class="food-name">${item.food_name}</span>
              <span class="food-meta">${item.serving_size || item.weight_grams + 'g'} • P: ${item.protein || 0}g, K: ${item.carbs || 0}g, L: ${item.fat || 0}g</span>
            </div>
            <span class="food-cal-badge">${item.calories} kkal</span>
          </div>
        `).join('');
      }
    }

    // Lunch
    const itemsLunch = document.getElementById('itemsLunch');
    const calLunch = document.getElementById('calLunch');
    if (itemsLunch && calLunch) {
      if (meals.lunch.items.length === 0) {
        calLunch.className = 'meal-cal-tag empty';
        calLunch.textContent = '0 kkal • Rekomendasi: ~600 kkal';
        itemsLunch.innerHTML = `
          <div class="empty-meal-hint">
            <i class="fa-regular fa-clock"></i> Belum ada catatan makan siang.
            <button class="suggest-meal-btn" id="btnSuggestLunchAction">💡 Tambahkan Menu Siang Sehat Otomatis</button>
          </div>
        `;
        const btnSuggest = document.getElementById('btnSuggestLunchAction');
        if (btnSuggest) {
          btnSuggest.addEventListener('click', () => this.suggestLunch());
        }
      } else {
        calLunch.className = 'meal-cal-tag';
        calLunch.textContent = `${meals.lunch.cal} kkal`;
        itemsLunch.innerHTML = meals.lunch.items.map(item => `
          <div class="food-row-item">
            <div class="food-item-info">
              <span class="food-name">${item.food_name}</span>
              <span class="food-meta">${item.serving_size || item.weight_grams + 'g'} • P: ${item.protein || 0}g, K: ${item.carbs || 0}g, L: ${item.fat || 0}g</span>
            </div>
            <span class="food-cal-badge">${item.calories} kkal</span>
          </div>
        `).join('');
      }
    }

    // Snack
    const itemsSnack = document.getElementById('itemsSnack');
    const calSnack = document.getElementById('calSnack');
    if (itemsSnack && calSnack) {
      if (meals.snack.items.length === 0) {
        calSnack.className = 'meal-cal-tag empty';
        calSnack.textContent = '0 kkal • Rekomendasi: ~200 kkal';
        itemsSnack.innerHTML = `<div class="empty-meal-hint"><i class="fa-regular fa-clock"></i> Belum ada catatan camilan sore.</div>`;
      } else {
        calSnack.className = 'meal-cal-tag';
        calSnack.textContent = `${meals.snack.cal} kkal`;
        itemsSnack.innerHTML = meals.snack.items.map(item => `
          <div class="food-row-item">
            <div class="food-item-info">
              <span class="food-name">${item.food_name}</span>
              <span class="food-meta">${item.serving_size || item.weight_grams + 'g'} • P: ${item.protein || 0}g, K: ${item.carbs || 0}g, L: ${item.fat || 0}g</span>
            </div>
            <span class="food-cal-badge">${item.calories} kkal</span>
          </div>
        `).join('');
      }
    }

    // Dinner
    const itemsDinner = document.getElementById('itemsDinner');
    const calDinner = document.getElementById('calDinner');
    if (itemsDinner && calDinner) {
      if (meals.dinner.items.length === 0) {
        calDinner.className = 'meal-cal-tag empty';
        calDinner.textContent = '0 kkal • Rekomendasi: ~550 kkal';
        itemsDinner.innerHTML = `<div class="empty-meal-hint"><i class="fa-regular fa-clock"></i> Belum ada catatan makan malam.</div>`;
      } else {
        calDinner.className = 'meal-cal-tag';
        calDinner.textContent = `${meals.dinner.cal} kkal`;
        itemsDinner.innerHTML = meals.dinner.items.map(item => `
          <div class="food-row-item">
            <div class="food-item-info">
              <span class="food-name">${item.food_name}</span>
              <span class="food-meta">${item.serving_size || item.weight_grams + 'g'} • P: ${item.protein || 0}g, K: ${item.carbs || 0}g, L: ${item.fat || 0}g</span>
            </div>
            <span class="food-cal-badge">${item.calories} kkal</span>
          </div>
        `).join('');
      }
    }
  }

  // Suggest nutritious lunch preset
  suggestLunch() {
    const lunchItems = [
      { food_name: "Ikan Kembung Bakar", serving_size: "1 ekor sedang", weight_grams: 120, calories: 200, carbs: 0, protein: 26, fat: 10 },
      { food_name: "Nasi Merah", serving_size: "1 porsi", weight_grams: 100, calories: 110, carbs: 23, protein: 3, fat: 1 },
      { food_name: "Tumis Sayur Bayam Jagung", serving_size: "1 mangkuk kecil", weight_grams: 100, calories: 65, carbs: 8, protein: 3, fat: 2 },
      { food_name: "Tempe Panggang", serving_size: "2 potong", weight_grams: 80, calories: 150, carbs: 8, protein: 15, fat: 6 }
    ];

    const totalCal = lunchItems.reduce((acc, i) => acc + i.calories, 0);
    const totalC = lunchItems.reduce((acc, i) => acc + i.carbs, 0);
    const totalP = lunchItems.reduce((acc, i) => acc + i.protein, 0);
    const totalF = lunchItems.reduce((acc, i) => acc + i.fat, 0);

    const newLog = {
      nutrition_log_id: `NUT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-LUNCH`,
      log_date: new Date().toISOString().slice(0,10),
      meal_time: "lunch",
      food_items: lunchItems,
      total_macros_summary: {
        total_calories: totalCal,
        carbohydrates_g: totalC,
        protein_g: totalP,
        fat_g: totalF
      }
    };

    if (!this.data.nutrition_logs) this.data.nutrition_logs = [];
    this.data.nutrition_logs.push(newLog);
    this.saveData();
    this.renderAll();

    // Sync to Supabase if connected
    if (this.supabase && this.isCloudSync) {
      this.syncNutritionToSupabase(newLog);
    }

    this.showToast(`Menu Makan Siang Sehat (+${totalCal} kkal, ${totalP}g Protein) ditambahkan!`);
  }

  // Calculate estimated burn based on MET formulas
  calculateEstimatedBurn(activityType, durationMinutes, intensity, weightKg) {
    let met = 4.0;
    const lower = activityType.toLowerCase();
    if (lower.includes('skate')) {
      met = intensity === 'high' ? 7.0 : intensity === 'medium' ? 5.5 : 4.0;
    } else if (lower.includes('walk')) {
      met = intensity === 'high' ? 4.5 : intensity === 'medium' ? 3.8 : 3.0;
    } else if (lower.includes('jog') || lower.includes('lari')) {
      met = intensity === 'high' ? 10.0 : intensity === 'medium' ? 8.0 : 6.5;
    } else if (lower.includes('sepeda')) {
      met = intensity === 'high' ? 8.5 : intensity === 'medium' ? 6.0 : 4.0;
    } else if (lower.includes('beban') || lower.includes('gym')) {
      met = intensity === 'high' ? 6.0 : intensity === 'medium' ? 4.5 : 3.5;
    } else if (lower.includes('renang')) {
      met = intensity === 'high' ? 9.0 : intensity === 'medium' ? 7.0 : 5.0;
    } else if (lower.includes('hiit')) {
      met = intensity === 'high' ? 11.0 : intensity === 'medium' ? 8.5 : 6.5;
    }

    // Formula: Burn = (MET * 3.5 * weightKg / 200) * minutes
    const burn = Math.round((met * 3.5 * weightKg / 200) * durationMinutes);
    return Math.max(10, burn);
  }

  // ================= SUBMISSIONS =================
  handleAddActivitySubmit() {
    const type = this.actType.value;
    const duration = parseInt(this.actDuration.value, 10) || 30;
    const intensity = this.actIntensity.value;
    const hr = parseInt(document.getElementById('actHeartRate').value, 10) || 115;
    const stepsInput = document.getElementById('actSteps').value;
    const steps = stepsInput ? parseInt(stepsInput, 10) : null;
    const weight = this.data.user_profile.biometrics.weight_kg || 69;

    const caloriesBurned = this.calculateEstimatedBurn(type, duration, intensity, weight);

    const now = new Date();
    const startTime = new Date(now.getTime() - duration * 60000);

    const newActivity = {
      activity_log_id: `ACT-${now.toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-3)}`,
      timestamp_start: startTime.toISOString(),
      timestamp_end: now.toISOString(),
      activity_type: type,
      metrics: {
        duration_minutes: duration,
        intensity_level: intensity,
        calories_burned: caloriesBurned,
        average_heart_rate: hr,
        steps_counted: steps
      },
      device_source: "Mobile FitPulse Tracker"
    };

    if (!this.data.activity_logs) this.data.activity_logs = [];
    this.data.activity_logs.unshift(newActivity);
    this.saveData();
    this.renderAll();

    // Sync to Supabase if connected
    if (this.supabase && this.isCloudSync) {
      this.syncActivityToSupabase(newActivity);
    }

    this.closeModal(this.modalAddActivity);
    this.showToast(`Latihan ${type} (+${caloriesBurned} kkal) berhasil dicatat!`, "fa-fire");
  }

  handleAddFoodSubmit() {
    const meal = document.getElementById('foodMealSelect').value;
    const name = document.getElementById('foodName').value.trim();
    const weight = parseInt(document.getElementById('foodWeight').value, 10) || 100;
    const cal = parseInt(document.getElementById('foodCalories').value, 10) || 100;
    const carbs = parseFloat(document.getElementById('foodCarbs').value) || 0;
    const protein = parseFloat(document.getElementById('foodProtein').value) || 0;
    const fat = parseFloat(document.getElementById('foodFat').value) || 0;

    const foodItem = {
      food_name: name,
      serving_size: `${weight} gram`,
      weight_grams: weight,
      calories: cal,
      carbs: carbs,
      protein: protein,
      fat: fat
    };

    // Find existing log for this meal or create new one
    let targetLog = (this.data.nutrition_logs || []).find(l => l.meal_time === meal);

    if (targetLog) {
      targetLog.food_items.push(foodItem);
      targetLog.total_macros_summary.total_calories += cal;
      targetLog.total_macros_summary.carbohydrates_g += carbs;
      targetLog.total_macros_summary.protein_g += protein;
      targetLog.total_macros_summary.fat_g += fat;
    } else {
      if (!this.data.nutrition_logs) this.data.nutrition_logs = [];
      targetLog = {
        nutrition_log_id: `NUT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-3)}`,
        log_date: new Date().toISOString().slice(0,10),
        meal_time: meal,
        food_items: [foodItem],
        total_macros_summary: {
          total_calories: cal,
          carbohydrates_g: carbs,
          protein_g: protein,
          fat_g: fat
        }
      };
      this.data.nutrition_logs.push(targetLog);
    }

    this.saveData();
    this.renderAll();

    // Sync to Supabase if connected
    if (this.supabase && this.isCloudSync && targetLog) {
      this.syncNutritionToSupabase(targetLog);
    }

    this.closeModal(this.modalAddFood);
    this.showToast(`Makanan "${name}" (+${cal} kkal) ditambahkan!`);
  }

  openProfileModal() {
    const bio = this.data.user_profile.biometrics;
    const demo = this.data.user_profile.demographics;
    const goals = this.data.user_profile.fitness_goals;

    document.getElementById('profAge').value = demo.age;
    document.getElementById('profGender').value = demo.gender;
    document.getElementById('profHeight').value = bio.height_cm;
    document.getElementById('profWeight').value = bio.weight_kg;
    document.getElementById('profTargetWeight').value = goals.target_weight_kg;
    document.getElementById('profBodyFat').value = bio.estimated_body_fat_percentage;
    document.getElementById('profTargetBodyFat').value = bio.target_body_fat_percentage;
    document.getElementById('profCalorieTarget').value = goals.daily_calorie_target;

    this.openModal(this.modalProfile);
  }

  handleProfileSubmit() {
    const bio = this.data.user_profile.biometrics;
    const demo = this.data.user_profile.demographics;
    const goals = this.data.user_profile.fitness_goals;

    demo.age = parseInt(document.getElementById('profAge').value, 10);
    demo.gender = document.getElementById('profGender').value;
    bio.height_cm = parseFloat(document.getElementById('profHeight').value);
    bio.weight_kg = parseFloat(document.getElementById('profWeight').value);
    goals.target_weight_kg = parseFloat(document.getElementById('profTargetWeight').value);
    bio.estimated_body_fat_percentage = parseFloat(document.getElementById('profBodyFat').value);
    bio.target_body_fat_percentage = parseFloat(document.getElementById('profTargetBodyFat').value);
    goals.daily_calorie_target = parseInt(document.getElementById('profCalorieTarget').value, 10);

    // Recalculate BMI
    const hM = bio.height_cm / 100;
    const bmiVal = Number((bio.weight_kg / (hM * hM)).toFixed(2));
    bio.bmi = bmiVal;
    if (bmiVal >= 25 && bmiVal < 30) {
      bio.bmi_status = "Overweight / Obesity Class I";
    } else if (bmiVal >= 30) {
      bio.bmi_status = "Obesity Class II";
    } else {
      bio.bmi_status = "Normal Weight";
    }

    this.saveData();
    this.renderAll();

    // Sync to Supabase if connected
    if (this.supabase && this.isCloudSync) {
      this.syncProfileToSupabase();
    }

    this.closeModal(this.modalProfile);
    this.showToast("Profil dan target biometrik berhasil diperbarui!");
  }

  // ================= SUPABASE CLOUD METHODS =================
  openSupabaseModal() {
    const savedUrl = localStorage.getItem(this.sbUrlKey) || '';
    const savedKey = localStorage.getItem(this.sbAnonKey) || '';
    if (this.sbUrl) this.sbUrl.value = savedUrl;
    if (this.sbKey) this.sbKey.value = savedKey;
    this.updateSupabaseStatusUI();
    this.openModal(this.modalSupabase);
  }

  async checkAutoConnectSupabase() {
    const savedUrl = localStorage.getItem(this.sbUrlKey);
    const savedKey = localStorage.getItem(this.sbAnonKey);
    if (savedUrl && savedKey) {
      await this.initSupabase(savedUrl, savedKey, false);
    } else {
      this.updateSupabaseStatusUI();
    }
  }

  async handleSaveSupabase() {
    const url = this.sbUrl.value.trim();
    const key = this.sbKey.value.trim();

    if (!url || !key) {
      this.showToast("Silakan masukkan URL dan Anon Key Supabase.");
      return;
    }

    const success = await this.initSupabase(url, key, true);
    if (success) {
      localStorage.setItem(this.sbUrlKey, url);
      localStorage.setItem(this.sbAnonKey, key);
      this.closeModal(this.modalSupabase);
    }
  }

  disconnectSupabase() {
    localStorage.removeItem(this.sbUrlKey);
    localStorage.removeItem(this.sbAnonKey);
    this.supabase = null;
    this.isCloudSync = false;
    if (this.sbUrl) this.sbUrl.value = '';
    if (this.sbKey) this.sbKey.value = '';
    this.updateSupabaseStatusUI();
    this.showToast("Koneksi Supabase diputuskan. Menggunakan mode lokal.", "fa-link-slash");
  }

  updateSupabaseStatusUI() {
    const isConn = !!(this.supabase && this.isCloudSync);
    if (this.sbDot) {
      this.sbDot.className = `status-dot ${isConn ? 'success' : 'warning'}`;
    }
    if (this.sbStatusText) {
      this.sbStatusText.textContent = isConn 
        ? "Status: Terhubung ke Cloud Supabase (Sinkronisasi Otomatis)"
        : "Status: Menggunakan Penyimpanan Lokal (Offline)";
    }
    if (this.cloudChipText) {
      this.cloudChipText.textContent = isConn ? "Cloud Sync" : "Lokal";
    }
    if (this.btnCloudChip) {
      this.btnCloudChip.className = `cloud-status-chip ${isConn ? 'connected' : ''}`;
    }
    if (this.supabaseStatusLabel) {
      this.supabaseStatusLabel.textContent = isConn ? "Supabase: Terhubung" : "Supabase: Lokal";
    }
  }

  async initSupabase(url, key, isManual = false) {
    if (!window.supabase) {
      console.warn("Supabase library not loaded");
      return false;
    }

    try {
      if (this.sbStatusText) this.sbStatusText.textContent = "Status: Menguji koneksi ke Supabase...";
      const client = window.supabase.createClient(url, key);

      // Test query to profiles table
      const { data, error } = await client.from('profiles').select('user_id').limit(1);

      if (error) {
        throw error;
      }

      this.supabase = client;
      this.isCloudSync = true;
      this.updateSupabaseStatusUI();
      
      if (isManual) {
        this.showToast("Berhasil terhubung ke Supabase Cloud!", "fa-cloud");
      }

      // Fetch fresh data from Supabase
      await this.fetchFromSupabase();
      return true;
    } catch (err) {
      console.error("Supabase connection failed:", err);
      this.isCloudSync = false;
      this.updateSupabaseStatusUI();
      if (this.sbStatusText) {
        this.sbStatusText.textContent = `Gagal: ${err.message || 'Periksa URL / Anon Key'}`;
      }
      this.showToast(`Koneksi Supabase gagal: ${err.message || 'Periksa skrip schema.sql'}`, "fa-triangle-exclamation");
      return false;
    }
  }

  async fetchFromSupabase() {
    if (!this.supabase) return;
    try {
      const userId = this.data.user_profile.user_id || 'USR-4616069';

      // 1. Fetch Profile
      const { data: profData } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profData) {
        this.data.user_profile.demographics = {
          age: profData.age,
          gender: profData.gender,
          marital_status: profData.marital_status
        };
        this.data.user_profile.biometrics = {
          height_cm: Number(profData.height_cm),
          weight_kg: Number(profData.weight_kg),
          estimated_body_fat_percentage: Number(profData.estimated_body_fat_percentage),
          target_body_fat_percentage: Number(profData.target_body_fat_percentage),
          bmi: Number(profData.bmi),
          bmi_status: profData.bmi_status
        };
        this.data.user_profile.fitness_goals = {
          target_weight_kg: Number(profData.target_weight_kg),
          daily_calorie_target: Number(profData.daily_calorie_target),
          daily_water_target_ml: Number(profData.daily_water_target_ml)
        };
      }

      // 2. Fetch Activity Logs
      const { data: actData } = await this.supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp_start', { ascending: false });

      if (actData && actData.length > 0) {
        this.data.activity_logs = actData.map(a => ({
          activity_log_id: a.activity_log_id,
          timestamp_start: a.timestamp_start,
          timestamp_end: a.timestamp_end,
          activity_type: a.activity_type,
          metrics: {
            duration_minutes: a.duration_minutes,
            intensity_level: a.intensity_level,
            calories_burned: Number(a.calories_burned),
            average_heart_rate: a.average_heart_rate,
            steps_counted: a.steps_counted
          },
          device_source: a.device_source
        }));
      }

      // 3. Fetch Nutrition Logs
      const { data: nutriData } = await this.supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId);

      if (nutriData && nutriData.length > 0) {
        this.data.nutrition_logs = nutriData.map(n => ({
          nutrition_log_id: n.nutrition_log_id,
          log_date: n.log_date,
          meal_time: n.meal_time,
          food_items: n.food_items || [],
          total_macros_summary: {
            total_calories: Number(n.total_calories),
            carbohydrates_g: Number(n.carbohydrates_g),
            protein_g: Number(n.protein_g),
            fat_g: Number(n.fat_g)
          }
        }));
      }

      // 4. Fetch Water
      const today = new Date().toISOString().slice(0, 10);
      const { data: waterData } = await this.supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle();

      if (waterData) {
        this.data.water_tracker = {
          consumed_ml: waterData.consumed_ml,
          target_ml: waterData.target_ml
        };
      }

      this.saveData();
      this.renderAll();
      this.showToast("Data terbaru disinkronkan dari Supabase!", "fa-arrows-rotate");
    } catch (e) {
      console.warn("Fetch Supabase error:", e);
    }
  }

  async syncActivityToSupabase(act) {
    if (!this.supabase) return;
    try {
      const userId = this.data.user_profile.user_id || 'USR-4616069';
      await this.supabase.from('activity_logs').upsert({
        user_id: userId,
        activity_log_id: act.activity_log_id,
        activity_type: act.activity_type,
        duration_minutes: act.metrics.duration_minutes,
        intensity_level: act.metrics.intensity_level,
        calories_burned: act.metrics.calories_burned,
        average_heart_rate: act.metrics.average_heart_rate,
        steps_counted: act.metrics.steps_counted,
        device_source: act.device_source,
        timestamp_start: act.timestamp_start,
        timestamp_end: act.timestamp_end
      }, { onConflict: 'activity_log_id' });
    } catch (e) {
      console.error("Sync activity error", e);
    }
  }

  async syncNutritionToSupabase(nutri) {
    if (!this.supabase) return;
    try {
      const userId = this.data.user_profile.user_id || 'USR-4616069';
      await this.supabase.from('nutrition_logs').upsert({
        user_id: userId,
        nutrition_log_id: nutri.nutrition_log_id,
        log_date: nutri.log_date,
        meal_time: nutri.meal_time,
        food_items: nutri.food_items,
        total_calories: nutri.total_macros_summary.total_calories,
        carbohydrates_g: nutri.total_macros_summary.carbohydrates_g,
        protein_g: nutri.total_macros_summary.protein_g,
        fat_g: nutri.total_macros_summary.fat_g
      }, { onConflict: 'nutrition_log_id' });
    } catch (e) {
      console.error("Sync nutrition error", e);
    }
  }

  async syncWaterToSupabase(consumed, target) {
    if (!this.supabase) return;
    try {
      const userId = this.data.user_profile.user_id || 'USR-4616069';
      const today = new Date().toISOString().slice(0, 10);
      await this.supabase.from('water_logs').upsert({
        user_id: userId,
        log_date: today,
        consumed_ml: consumed,
        target_ml: target
      }, { onConflict: 'user_id,log_date' });
    } catch (e) {
      console.error("Sync water error", e);
    }
  }

  async syncProfileToSupabase() {
    if (!this.supabase) return;
    try {
      const prof = this.data.user_profile;
      await this.supabase.from('profiles').upsert({
        user_id: prof.user_id,
        age: prof.demographics.age,
        gender: prof.demographics.gender,
        marital_status: prof.demographics.marital_status,
        height_cm: prof.biometrics.height_cm,
        weight_kg: prof.biometrics.weight_kg,
        estimated_body_fat_percentage: prof.biometrics.estimated_body_fat_percentage,
        target_body_fat_percentage: prof.biometrics.target_body_fat_percentage,
        bmi: prof.biometrics.bmi,
        bmi_status: prof.biometrics.bmi_status,
        target_weight_kg: prof.fitness_goals.target_weight_kg,
        daily_calorie_target: prof.fitness_goals.daily_calorie_target,
        daily_water_target_ml: prof.fitness_goals.daily_water_target_ml,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.error("Sync profile error", e);
    }
  }

  // ================= EXPORT & JSON INSPECTOR =================
  renderJsonInspector() {
    if (this.jsonPreviewBox) {
      this.jsonPreviewBox.textContent = JSON.stringify(this.data, null, 2);
    }
  }

  copyJsonToClipboard() {
    const text = JSON.stringify(this.data, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      this.showToast("JSON disalin ke clipboard!", "fa-copy");
    }).catch(() => {
      this.showToast("Gagal menyalin, periksa izin browser.");
    });
  }

  exportJsonFile() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fitpulse-usr4616069-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast("File JSON berhasil diunduh!", "fa-download");
  }

  renderAll() {
    const bio = this.data.user_profile.biometrics;
    if (this.displayCurrentWeight) this.displayCurrentWeight.textContent = bio.weight_kg.toFixed(1);
    if (this.displayCurrentBodyFat) this.displayCurrentBodyFat.textContent = bio.estimated_body_fat_percentage.toFixed(1);

    this.renderEnergyAndMacros();
    this.renderWater();
    this.renderActivities();
    this.renderNutritionMeals();
    this.renderJsonInspector();
  }
}

// Instantiate and expose globally
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new FitPulseApp();
  window.app = app;
});
