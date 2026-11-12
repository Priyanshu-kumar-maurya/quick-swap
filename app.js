/**
 * ========================================================
 *  QUICKSWAP - APPLE iOS PROFILE HUB & DIRECT LINK ENGINE
 * ========================================================
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
let userProfile = {
  avatar: '',
  name: '',
  title: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  email: '',
  linkedin: '',
  customLinks: [] // [{ label: 'GitHub', value: '...' }]
};

let modeConfigs = {
  work: {
    title: 'Work Contact QR',
    fields: ['phone', 'email', 'linkedin']
  },
  social: {
    title: 'Social Contact QR',
    fields: ['whatsapp', 'instagram']
  },
  all: {
    title: 'Complete Profile QR',
    fields: ['phone', 'whatsapp', 'instagram', 'email', 'linkedin']
  }
};

let customModes = [];
let activeSharingMode = 'work';

let html5QrScanner = null;
let isCameraActive = false;
let qrCodeInstance = null;
let lightboxQrInstance = null;

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
// Floating Toast Notification
const iosToast = document.getElementById('ios-toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');
let toastTimer = null;

// Views
const publicLandingView = document.getElementById('public-landing-view');
const ownerAppContainer = document.getElementById('owner-app-container');

// Public Landing Page Elements
const publicAvatar = document.getElementById('public-avatar');
const publicName = document.getElementById('public-name');
const publicTitle = document.getElementById('public-title');
const publicBadge = document.getElementById('public-badge');
const publicActionsList = document.getElementById('public-actions-list');
const publicDownloadVcfBtn = document.getElementById('public-download-vcf-btn');

// 2-Way Exchange Elements
const exchangeName = document.getElementById('exchange-name');
const exchangePhone = document.getElementById('exchange-phone');
const exchangeSendBtn = document.getElementById('exchange-send-btn');

// Main Owner Navigation
const navBtnScanner = document.getElementById('nav-btn-scanner');
const navBtnMyQr = document.getElementById('nav-btn-myqr');
const scannerView = document.getElementById('scanner-view');
const myqrView = document.getElementById('myqr-view');

// Top Bar Profile Button & Sheet
const openProfileBtn = document.getElementById('open-profile-btn');
const closeProfileBtn = document.getElementById('close-profile-btn');
const profileSheetOverlay = document.getElementById('profile-sheet-overlay');
const headerAvatarCircle = document.getElementById('header-avatar-circle');
const sheetTitle = document.getElementById('sheet-title');
const sheetBackBtn = document.getElementById('sheet-back-btn');

// Profile Sheet Subviews
const profileCardSubview = document.getElementById('profile-card-subview');
const profileEditSubview = document.getElementById('profile-edit-subview');
const modeSettingsSubview = document.getElementById('mode-settings-subview');
const gotoEditProfileBtn = document.getElementById('goto-edit-profile-btn');
const gotoModeSettingsBtn = document.getElementById('goto-mode-settings-btn');

// Form Inputs
const profileForm = document.getElementById('profile-form');
const avatarInput = document.getElementById('avatar-input');
const removePhotoBtn = document.getElementById('remove-photo-btn');
const formAvatarPreview = document.getElementById('form-avatar-preview');
const nameInput = document.getElementById('name');
const titleInput = document.getElementById('title');
const phoneInput = document.getElementById('phone');
const whatsappInput = document.getElementById('whatsapp');
const instagramInput = document.getElementById('instagram');
const emailInput = document.getElementById('email');
const linkedinInput = document.getElementById('linkedin');

// Custom Links in Edit Form
const customFieldsContainer = document.getElementById('custom-fields-container');
const addCustomFieldBtn = document.getElementById('add-custom-field-btn');

// Mode Settings Elements
const workItemsList = document.getElementById('work-items-list');
const socialItemsList = document.getElementById('social-items-list');
const customModesContainer = document.getElementById('custom-modes-container');
const addCustomModeBtn = document.getElementById('add-custom-mode-btn');
const saveModesBtn = document.getElementById('save-modes-btn');

// Digital Card Subview Elements
const cardAvatar = document.getElementById('card-avatar');
const cardName = document.getElementById('card-name');
const cardTitle = document.getElementById('card-title');
const cardLinks = document.getElementById('card-links');

// My QR View Elements
const modeChipsContainer = document.getElementById('mode-chips-container');
const currentModeTitle = document.getElementById('current-mode-title');
const currentModeSummary = document.getElementById('current-mode-summary');
const qrcodeDiv = document.getElementById('qrcode');
const qrWrapperClickable = document.getElementById('qr-wrapper-clickable');
const copyLinkBtn = document.getElementById('copy-link-btn');
const nativeShareBtn = document.getElementById('native-share-btn');
const testLinkBtn = document.getElementById('test-link-btn');
const peekProfileBtn = document.getElementById('peek-profile-btn');

// Lightbox Elements
const qrLightboxModal = document.getElementById('qr-lightbox-modal');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxQr = document.getElementById('lightbox-qr');
const closeLightboxBtn = document.getElementById('close-lightbox-btn');

// Camera & Scanner Elements
const toggleCameraBtn = document.getElementById('toggle-camera-btn');
const cameraBtnText = document.getElementById('camera-btn-text');
const qrFileInput = document.getElementById('qr-file-input');
const laserLine = document.getElementById('laser-line');

// Currently active scanned payload
let currentScannedPayload = null;

// ==========================================
// 3. UX UTILITIES (TOAST & HAPTICS)
// ==========================================
function showToast(message, icon = '✨') {
  if (!iosToast) return;
  toastMessage.textContent = message;
  toastIcon.textContent = icon;
  iosToast.classList.add('toast-show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    iosToast.classList.remove('toast-show');
  }, 2600);
}

function triggerHaptic(duration = 15) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  } catch (e) {}
}

// ==========================================
// 4. CHECK FOR SHARED CONTACT VIA URL HASH (#data=)
// ==========================================
function checkUrlForSharedContact() {
  if (window.location.hash.startsWith('#data=')) {
    const rawData = window.location.hash.substring(6);
    try {
      const decodedJson = decodeURIComponent(escape(atob(decodeURIComponent(rawData))));
      const sharedContact = JSON.parse(decodedJson);
      renderPublicLandingPage(sharedContact);
      return true;
    } catch (e) {
      console.error("Failed to parse shared contact URL:", e);
    }
  }
  return false;
}

// ==========================================
// 5. RENDER PUBLIC LANDING PAGE & 2-WAY SWAP
// ==========================================
function renderPublicLandingPage(data) {
  currentScannedPayload = data;

  ownerAppContainer.style.display = 'none';
  publicLandingView.style.display = 'block';

  publicName.textContent = data.n || 'Contact Profile';
  publicTitle.textContent = data.t || 'QuickSwap Member';

  if (data.a) {
    publicAvatar.innerHTML = `<img src="${data.a}" alt="Photo">`;
  } else {
    const initial = (data.n || '⚡').charAt(0).toUpperCase();
    publicAvatar.innerHTML = `<span>${initial}</span>`;
  }

  publicBadge.textContent = data.m ? `${data.m.toUpperCase()} PROFILE` : 'SHARED PROFILE';
  publicActionsList.innerHTML = '';

  // 1. Instagram
  if (data.i) {
    const cleanInsta = data.i.replace('@', '').trim();
    publicActionsList.innerHTML += `
      <a href="https://instagram.com/${cleanInsta}" target="_blank" rel="noopener noreferrer" class="action-tile" onclick="triggerHaptic()">
        <div class="action-tile-left">
          <div class="action-tile-icon icon-bg-insta">📸</div>
          <div class="action-tile-text">
            <strong>Instagram</strong>
            <span>@${cleanInsta} • Open Profile</span>
          </div>
        </div>
        <span class="action-tile-arrow">↗</span>
      </a>
    `;
  }

  // 2. WhatsApp
  if (data.w) {
    const cleanWA = data.w.replace(/[^0-9]/g, '');
    publicActionsList.innerHTML += `
      <a href="https://wa.me/${cleanWA}" target="_blank" rel="noopener noreferrer" class="action-tile" onclick="triggerHaptic()">
        <div class="action-tile-left">
          <div class="action-tile-icon icon-bg-wa">💬</div>
          <div class="action-tile-text">
            <strong>WhatsApp</strong>
            <span>+${cleanWA} • Start Direct Chat</span>
          </div>
        </div>
        <span class="action-tile-arrow">↗</span>
      </a>
    `;
  }

  // 3. Phone Call
  if (data.p) {
    publicActionsList.innerHTML += `
      <a href="tel:${data.p}" class="action-tile" onclick="triggerHaptic()">
        <div class="action-tile-left">
          <div class="action-tile-icon icon-bg-phone">📞</div>
          <div class="action-tile-text">
            <strong>Phone Call</strong>
            <span>${data.p} • Tap to Call</span>
          </div>
        </div>
        <span class="action-tile-arrow">↗</span>
      </a>
    `;
  }

  // 4. Email
  if (data.e) {
    publicActionsList.innerHTML += `
      <a href="mailto:${data.e}" class="action-tile" onclick="triggerHaptic()">
        <div class="action-tile-left">
          <div class="action-tile-icon icon-bg-email">✉️</div>
          <div class="action-tile-text">
            <strong>Email</strong>
            <span>${data.e} • Send Message</span>
          </div>
        </div>
        <span class="action-tile-arrow">↗</span>
      </a>
    `;
  }

  // 5. LinkedIn
  if (data.l) {
    publicActionsList.innerHTML += `
      <a href="${data.l}" target="_blank" rel="noopener noreferrer" class="action-tile" onclick="triggerHaptic()">
        <div class="action-tile-left">
          <div class="action-tile-icon icon-bg-linkedin">💼</div>
          <div class="action-tile-text">
            <strong>LinkedIn</strong>
            <span>View Professional Profile</span>
          </div>
        </div>
        <span class="action-tile-arrow">↗</span>
      </a>
    `;
  }

  // 6. Custom Links
  if (data.c && Array.isArray(data.c)) {
    data.c.forEach(item => {
      if (item.v) {
        publicActionsList.innerHTML += `
          <a href="${item.v}" target="_blank" rel="noopener noreferrer" class="action-tile" onclick="triggerHaptic()">
            <div class="action-tile-left">
              <div class="action-tile-icon icon-bg-custom">🔗</div>
              <div class="action-tile-text">
                <strong>${item.l || 'Custom Link'}</strong>
                <span>Open ${item.l || 'Link'}</span>
              </div>
            </div>
            <span class="action-tile-arrow">↗</span>
          </a>
        `;
      }
    });
  }
}

// 2-Way Contact Exchange Action
exchangeSendBtn.addEventListener('click', () => {
  triggerHaptic(20);
  const name = exchangeName.value.trim();
  const phone = exchangePhone.value.trim();

  if (!name || !phone) {
    showToast('Please enter your name & phone!', '⚠️');
    return;
  }

  const ownerName = currentScannedPayload ? currentScannedPayload.n : 'Friend';
  const ownerWA = currentScannedPayload && (currentScannedPayload.w || currentScannedPayload.p)
    ? (currentScannedPayload.w || currentScannedPayload.p).replace(/[^0-9]/g, '')
    : '';

  const messageText = `Hi ${ownerName}! I just scanned your QuickSwap card. Here are my contact details:\n👤 Name: ${name}\n📞 Phone: ${phone}\n(Shared via QuickSwap)`;

  if (ownerWA) {
    const waUrl = `https://wa.me/${ownerWA}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
    showToast('Redirecting to WhatsApp...', '💬');
  } else {
    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(messageText);
    showToast('Details copied to clipboard!', '📋');
  }
});

// Download vCard from Public Landing Page
publicDownloadVcfBtn.addEventListener('click', () => {
  triggerHaptic(20);
  if (!currentScannedPayload) return;
  const p = currentScannedPayload;

  let vcard = `BEGIN:VCARD\nVERSION:3.0\n`;
  vcard += `FN:${p.n || 'Contact'}\n`;
  if (p.t) vcard += `TITLE:${p.t}\n`;
  if (p.p) vcard += `TEL;TYPE=CELL:${p.p}\n`;
  if (p.e) vcard += `EMAIL:${p.e}\n`;
  if (p.w) vcard += `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${p.w.replace(/[^0-9]/g, '')}\n`;
  if (p.i) vcard += `X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${p.i.replace('@', '')}\n`;
  if (p.l) vcard += `URL:${p.l}\n`;

  if (p.c && Array.isArray(p.c)) {
    p.c.forEach(item => {
      if (item.v) vcard += `URL;TYPE=${item.l || 'Link'}:${item.v}\n`;
    });
  }
  vcard += `END:VCARD`;

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.setAttribute('download', `${(p.n || 'contact').replace(/\s+/g, '_')}.vcf`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);

  showToast('Contact file downloaded!', '📥');
});

// ==========================================
// 6. GENERATE REAL WEB LINK QR CODE 🌐
// ==========================================
function getActiveModeFields() {
  if (activeSharingMode === 'work') return { title: 'Work Contact QR', fields: modeConfigs.work.fields };
  if (activeSharingMode === 'social') return { title: 'Social Contact QR', fields: modeConfigs.social.fields };
  if (activeSharingMode === 'all') return { title: 'Complete Contact QR', fields: modeConfigs.all.fields };

  const custom = customModes.find(m => m.id === activeSharingMode);
  if (custom) return { title: `${custom.name} QR`, fields: custom.fields };

  return { title: 'Contact QR', fields: [] };
}

function generateShareableWebUrl() {
  const modeInfo = getActiveModeFields();

  const payload = {
    m: activeSharingMode,
    n: userProfile.name || '',
    t: userProfile.title || ''
  };

  if (modeInfo.fields.includes('phone') && userProfile.phone) payload.p = userProfile.phone;
  if (modeInfo.fields.includes('whatsapp') && userProfile.whatsapp) payload.w = userProfile.whatsapp;
  if (modeInfo.fields.includes('instagram') && userProfile.instagram) payload.i = userProfile.instagram;
  if (modeInfo.fields.includes('email') && userProfile.email) payload.e = userProfile.email;
  if (modeInfo.fields.includes('linkedin') && userProfile.linkedin) payload.l = userProfile.linkedin;

  if (activeSharingMode === 'all' && userProfile.customLinks.length > 0) {
    payload.c = userProfile.customLinks.filter(x => x.value);
  }

  const encodedData = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
  const baseUrl = window.location.href.split('#')[0];
  return `${baseUrl}#data=${encodedData}`;
}

function renderSharingQr() {
  if (!qrcodeDiv) return;

  const modeInfo = getActiveModeFields();
  currentModeTitle.textContent = modeInfo.title;

  const activeFieldNames = modeInfo.fields
    .map(k => availableFields.find(f => f.key === k)?.label.split(' ')[1] || k)
    .join(', ');
  currentModeSummary.textContent = activeFieldNames ? `Sharing: ${activeFieldNames}` : 'Nothing selected in this mode';

  const targetWebUrl = generateShareableWebUrl();

  qrcodeDiv.innerHTML = '';
  qrCodeInstance = new QRCode(qrcodeDiv, {
    text: targetWebUrl,
    width: 175,
    height: 175,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

// 1-Tap Copy Link Button
copyLinkBtn.addEventListener('click', async () => {
  triggerHaptic(20);
  const targetUrl = generateShareableWebUrl();
  try {
    await navigator.clipboard.writeText(targetUrl);
    showToast('Card link copied to clipboard!', '📋');
  } catch (err) {
    showToast('Copied: ' + targetUrl.substring(0, 30) + '...', '📋');
  }
});

// Native Web Share API Button
nativeShareBtn.addEventListener('click', async () => {
  triggerHaptic(20);
  const targetUrl = generateShareableWebUrl();
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${userProfile.name || 'QuickSwap'} Contact Card`,
        text: `Here is my contact profile on QuickSwap:`,
        url: targetUrl
      });
      showToast('Shared successfully!', '📤');
    } catch (err) {}
  } else {
    // Fallback: Copy link
    await navigator.clipboard.writeText(targetUrl);
    showToast('Link copied to share!', '📋');
  }
});

// Preview own web card button
testLinkBtn.addEventListener('click', () => {
  triggerHaptic(15);
  const targetUrl = generateShareableWebUrl();
  window.open(targetUrl, '_blank');
});

// Fullscreen Lightbox Trigger
qrWrapperClickable.addEventListener('click', () => {
  triggerHaptic(15);
  const targetUrl = generateShareableWebUrl();
  lightboxTitle.textContent = getActiveModeFields().title;
  lightboxQr.innerHTML = '';

  lightboxQrInstance = new QRCode(lightboxQr, {
    text: targetUrl,
    width: 230,
    height: 230,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  qrLightboxModal.classList.add('active');
});

closeLightboxBtn.addEventListener('click', () => {
  triggerHaptic(15);
  qrLightboxModal.classList.remove('active');
});

qrLightboxModal.addEventListener('click', (e) => {
  if (e.target === qrLightboxModal) {
    qrLightboxModal.classList.remove('active');
  }
});

// ==========================================
// 7. MAIN NAVIGATION: [ SCANNER ] vs [ MY QR ]
// ==========================================
function switchMainView(view) {
  triggerHaptic(15);
  if (view === 'scanner') {
    navBtnScanner.classList.add('active');
    navBtnMyQr.classList.remove('active');
    scannerView.classList.add('active-view');
    myqrView.classList.remove('active-view');
  } else {
    navBtnMyQr.classList.add('active');
    navBtnScanner.classList.remove('active');
    myqrView.classList.add('active-view');
    scannerView.classList.remove('active-view');

    stopCamera();
    renderModeChips();
    renderSharingQr();
  }
}

navBtnScanner.addEventListener('click', () => switchMainView('scanner'));
navBtnMyQr.addEventListener('click', () => switchMainView('myqr'));

// ==========================================
// 8. PROFILE DRAWER NAVIGATION & SUBVIEWS
// ==========================================
function openProfileSheet(subview = 'card') {
  triggerHaptic(15);
  profileSheetOverlay.classList.add('active');
  switchProfileSubview(subview);
}

function closeProfileSheet() {
  triggerHaptic(15);
  profileSheetOverlay.classList.remove('active');
  setTimeout(() => switchProfileSubview('card'), 300);
}

openProfileBtn.addEventListener('click', () => openProfileSheet('card'));
peekProfileBtn.addEventListener('click', () => openProfileSheet('card'));
closeProfileBtn.addEventListener('click', closeProfileSheet);

profileSheetOverlay.addEventListener('click', (e) => {
  if (e.target === profileSheetOverlay) closeProfileSheet();
});

function switchProfileSubview(subview) {
  triggerHaptic(15);
  profileCardSubview.classList.remove('active-subview');
  profileEditSubview.classList.remove('active-subview');
  modeSettingsSubview.classList.remove('active-subview');

  if (subview === 'card') {
    sheetTitle.textContent = 'My Profile';
    sheetBackBtn.style.display = 'none';
    profileCardSubview.classList.add('active-subview');
    renderDigitalCard();
  } else if (subview === 'edit') {
    sheetTitle.textContent = 'Edit Profile';
    sheetBackBtn.style.display = 'inline-block';
    profileEditSubview.classList.add('active-subview');
  } else if (subview === 'settings') {
    sheetTitle.textContent = 'Mode Settings';
    sheetBackBtn.style.display = 'inline-block';
    modeSettingsSubview.classList.add('active-subview');
    renderModeSettingsChecklists();
  }
}

gotoEditProfileBtn.addEventListener('click', () => switchProfileSubview('edit'));
gotoModeSettingsBtn.addEventListener('click', () => switchProfileSubview('settings'));
sheetBackBtn.addEventListener('click', () => switchProfileSubview('card'));

// ==========================================
// 9. DIGITAL CARD RENDERING
// ==========================================
function renderDigitalCard() {
  if (userProfile.avatar) {
    cardAvatar.innerHTML = `<img src="${userProfile.avatar}" alt="Avatar">`;
    headerAvatarCircle.innerHTML = `<img src="${userProfile.avatar}" alt="Avatar">`;
    formAvatarPreview.innerHTML = `<img src="${userProfile.avatar}" alt="Avatar">`;
    removePhotoBtn.style.display = 'inline-block';
  } else {
    const initial = userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '⚡';
    cardAvatar.innerHTML = `<span>${initial}</span>`;
    headerAvatarCircle.innerHTML = `<span>${initial}</span>`;
    formAvatarPreview.innerHTML = `<span>${initial}</span>`;
    removePhotoBtn.style.display = 'none';
  }

  cardName.textContent = userProfile.name || 'Your Name';
  cardTitle.textContent = userProfile.title || 'Role / Headline';

  cardLinks.innerHTML = '';
  let count = 0;

  if (userProfile.phone) {
    count++;
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>📞 Phone</span><strong>${userProfile.phone}</strong></div>`;
  }
  if (userProfile.whatsapp) {
    count++;
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>💬 WhatsApp</span><strong>${userProfile.whatsapp}</strong></div>`;
  }
  if (userProfile.instagram) {
    count++;
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>📸 Instagram</span><strong>@${userProfile.instagram.replace('@', '')}</strong></div>`;
  }
  if (userProfile.email) {
    count++;
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>✉️ Email</span><strong>${userProfile.email}</strong></div>`;
  }
  if (userProfile.linkedin) {
    count++;
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>💼 LinkedIn</span><strong>Connected</strong></div>`;
  }

  userProfile.customLinks.forEach(link => {
    if (link.label && link.value) {
      count++;
      cardLinks.innerHTML += `<div class="ios-link-pill"><span>🔗 ${link.label}</span><strong>${link.value}</strong></div>`;
    }
  });

  if (count === 0) {
    cardLinks.innerHTML = `<p class="empty-hint">No details yet. Click "Edit Profile Details" below to add info.</p>`;
  }
}

// ==========================================
// 10. EDIT FORM & "+ ADD LINK"
// ==========================================
function renderCustomFields() {
  customFieldsContainer.innerHTML = '';
  if (userProfile.customLinks.length > 0) {
    customFieldsContainer.style.display = 'block';
  } else {
    customFieldsContainer.style.display = 'none';
  }

  userProfile.customLinks.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'custom-row';
    row.innerHTML = `
      <input type="text" class="custom-label-input" placeholder="Title (e.g. GitHub)" value="${item.label}">
      <input type="text" class="custom-val-input" placeholder="URL or Handle" value="${item.value}">
      <button type="button" class="delete-row-btn">✕</button>
    `;

    row.querySelector('.custom-label-input').addEventListener('input', (e) => userProfile.customLinks[index].label = e.target.value);
    row.querySelector('.custom-val-input').addEventListener('input', (e) => userProfile.customLinks[index].value = e.target.value);
    row.querySelector('.delete-row-btn').addEventListener('click', () => {
      triggerHaptic(15);
      userProfile.customLinks.splice(index, 1);
      renderCustomFields();
    });

    customFieldsContainer.appendChild(row);
  });
}

addCustomFieldBtn.addEventListener('click', () => {
  triggerHaptic(15);
  userProfile.customLinks.push({ label: 'Link', value: '' });
  renderCustomFields();
});

avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    userProfile.avatar = event.target.result;
    renderDigitalCard();
    showToast('Photo uploaded!', '📸');
  };
  reader.readAsDataURL(file);
});

removePhotoBtn.addEventListener('click', () => {
  triggerHaptic(15);
  userProfile.avatar = '';
  avatarInput.value = '';
  renderDigitalCard();
  showToast('Photo removed', '🗑️');
});

profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  triggerHaptic(20);

  userProfile.name = nameInput.value.trim();
  userProfile.title = titleInput.value.trim();
  userProfile.phone = phoneInput.value.trim();
  userProfile.whatsapp = whatsappInput.value.trim();
  userProfile.instagram = instagramInput.value.trim();
  userProfile.email = emailInput.value.trim();
  userProfile.linkedin = linkedinInput.value.trim();

  saveToLocalStorage();
  renderDigitalCard();
  renderSharingQr();

  switchProfileSubview('card');
  showToast('Profile updated successfully!', '✨');
});

// ==========================================
// 11. CONFIGURE WORK & SOCIAL MODES
// ==========================================
const availableFields = [
  { key: 'phone', label: '📞 Phone Number' },
  { key: 'email', label: '✉️ Email Address' },
  { key: 'linkedin', label: '💼 LinkedIn' },
  { key: 'whatsapp', label: '💬 WhatsApp' },
  { key: 'instagram', label: '📸 Instagram' }
];

function renderModeSettingsChecklists() {
  workItemsList.innerHTML = '';
  availableFields.forEach(f => {
    const isChecked = modeConfigs.work.fields.includes(f.key);
    workItemsList.innerHTML += `
      <div class="mode-checkbox-row">
        <label for="work-${f.key}"><span>${f.label}</span></label>
        <input type="checkbox" id="work-${f.key}" data-field="${f.key}" ${isChecked ? 'checked' : ''}>
      </div>`;
  });

  socialItemsList.innerHTML = '';
  availableFields.forEach(f => {
    const isChecked = modeConfigs.social.fields.includes(f.key);
    socialItemsList.innerHTML += `
      <div class="mode-checkbox-row">
        <label for="social-${f.key}"><span>${f.label}</span></label>
        <input type="checkbox" id="social-${f.key}" data-field="${f.key}" ${isChecked ? 'checked' : ''}>
      </div>`;
  });

  renderCustomModesList();
}

function renderCustomModesList() {
  customModesContainer.innerHTML = '';
  customModes.forEach((mode, index) => {
    const card = document.createElement('div');
    card.className = 'custom-mode-card';
    card.innerHTML = `
      <div class="custom-mode-header">
        <input type="text" value="${mode.name}" placeholder="Section Name">
        <button type="button" class="delete-row-btn" data-index="${index}">✕</button>
      </div>
      <div class="ios-inset-group">
        ${availableFields.map(f => `
          <div class="mode-checkbox-row">
            <label><span>${f.label}</span></label>
            <input type="checkbox" data-field="${f.key}" ${mode.fields.includes(f.key) ? 'checked' : ''}>
          </div>`).join('')}
      </div>
    `;

    card.querySelector('input[type="text"]').addEventListener('input', (e) => customModes[index].name = e.target.value);
    card.querySelector('.delete-row-btn').addEventListener('click', () => {
      triggerHaptic(15);
      customModes.splice(index, 1);
      renderCustomModesList();
    });

    card.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const field = e.target.dataset.field;
        if (e.target.checked) {
          if (!customModes[index].fields.includes(field)) customModes[index].fields.push(field);
        } else {
          customModes[index].fields = customModes[index].fields.filter(x => x !== field);
        }
      });
    });

    customModesContainer.appendChild(card);
  });
}

addCustomModeBtn.addEventListener('click', () => {
  triggerHaptic(15);
  customModes.push({ id: 'custom_' + Date.now(), name: 'New Section', fields: ['phone', 'instagram'] });
  renderCustomModesList();
});

saveModesBtn.addEventListener('click', () => {
  triggerHaptic(20);
  modeConfigs.work.fields = [];
  document.querySelectorAll('#work-items-list input[type="checkbox"]:checked').forEach(c => {
    modeConfigs.work.fields.push(c.dataset.field);
  });

  modeConfigs.social.fields = [];
  document.querySelectorAll('#social-items-list input[type="checkbox"]:checked').forEach(c => {
    modeConfigs.social.fields.push(c.dataset.field);
  });

  saveToLocalStorage();
  renderModeChips();
  renderSharingQr();
  switchProfileSubview('card');
  showToast('Mode settings saved!', '⚙️');
});

function renderModeChips() {
  modeChipsContainer.innerHTML = `
    <button type="button" class="mode-chip ${activeSharingMode === 'work' ? 'active' : ''}" data-mode="work">💼 Work</button>
    <button type="button" class="mode-chip ${activeSharingMode === 'social' ? 'active' : ''}" data-mode="social">🎉 Social</button>
    <button type="button" class="mode-chip ${activeSharingMode === 'all' ? 'active' : ''}" data-mode="all">⚡ All</button>
  `;

  customModes.forEach(m => {
    modeChipsContainer.innerHTML += `
      <button type="button" class="mode-chip ${activeSharingMode === m.id ? 'active' : ''}" data-mode="${m.id}">
        🌟 ${m.name}
      </button>
    `;
  });

  modeChipsContainer.querySelectorAll('.mode-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic(15);
      activeSharingMode = btn.dataset.mode;
      renderModeChips();
      renderSharingQr();
      showToast(`Switched to ${activeSharingMode.toUpperCase()} mode`, '🔄');
    });
  });
}

// ==========================================
// 12. PAYTM CAMERA SCANNER ENGINE
// ==========================================
async function startCamera() {
  triggerHaptic(15);
  if (!html5QrScanner) html5QrScanner = new Html5Qrcode("reader");

  try {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    await html5QrScanner.start(
      { facingMode: "environment" },
      config,
      onScanSuccess,
      () => {}
    );
    isCameraActive = true;
    cameraBtnText.textContent = "🛑 Stop Camera";
    laserLine.style.display = "block";
    showToast('Camera active', '📷');
  } catch (err) {
    showToast('Camera permission denied', '⚠️');
  }
}

async function stopCamera() {
  if (html5QrScanner && isCameraActive) {
    try {
      await html5QrScanner.stop();
      isCameraActive = false;
      cameraBtnText.textContent = "📷 Open Camera";
      laserLine.style.display = "none";
    } catch (err) {}
  }
}

toggleCameraBtn.addEventListener('click', () => {
  if (isCameraActive) stopCamera();
  else startCamera();
});

qrFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!html5QrScanner) html5QrScanner = new Html5Qrcode("reader");

  try {
    const decodedText = await html5QrScanner.scanFile(file, true);
    onScanSuccess(decodedText);
  } catch (err) {
    showToast('No QR code found in photo', '❌');
  }
});

function onScanSuccess(decodedText) {
  triggerHaptic(30);
  stopCamera();

  if (decodedText.includes('#data=')) {
    const hash = decodedText.split('#data=')[1];
    try {
      const decodedJson = decodeURIComponent(escape(atob(decodeURIComponent(hash))));
      const sharedContact = JSON.parse(decodedJson);
      renderPublicLandingPage(sharedContact);
      showToast('Contact card loaded! 🎉', '⚡');
      return;
    } catch (e) {
      console.error(e);
    }
  }

  if (decodedText.startsWith('http')) {
    window.open(decodedText, '_blank');
  } else {
    showToast('Scanned: ' + decodedText.substring(0, 25), '📱');
  }
}

// ==========================================
// 13. LOCALSTORAGE & BOOTSTRAP
// ==========================================
function saveToLocalStorage() {
  localStorage.setItem('quickswap_profile', JSON.stringify(userProfile));
  localStorage.setItem('quickswap_modes', JSON.stringify(modeConfigs));
  localStorage.setItem('quickswap_custom_modes', JSON.stringify(customModes));
}

function loadSavedData() {
  if (checkUrlForSharedContact()) {
    return;
  }

  const savedProfile = localStorage.getItem('quickswap_profile');
  const savedModes = localStorage.getItem('quickswap_modes');
  const savedCustomModes = localStorage.getItem('quickswap_custom_modes');

  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
    if (!userProfile.customLinks) userProfile.customLinks = [];

    nameInput.value = userProfile.name || '';
    titleInput.value = userProfile.title || '';
    phoneInput.value = userProfile.phone || '';
    whatsappInput.value = userProfile.whatsapp || '';
    instagramInput.value = userProfile.instagram || '';
    emailInput.value = userProfile.email || '';
    linkedinInput.value = userProfile.linkedin || '';

    renderCustomFields();
  }

  if (savedModes) modeConfigs = JSON.parse(savedModes);
  if (savedCustomModes) customModes = JSON.parse(savedCustomModes);

  renderDigitalCard();
  renderModeChips();
  renderSharingQr();
}

loadSavedData();
