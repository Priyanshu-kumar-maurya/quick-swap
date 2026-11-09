/**
 * =======================================================
 *  QUICKSWAP - APPLE iOS CONTACT DROP & PRIVACY ENGINE
 * =======================================================
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
  linkedin: ''
};

let privacySettings = {
  phone: true,
  whatsapp: true,
  instagram: true,
  email: true,
  linkedin: true
};

let qrCodeInstance = null;

// ==========================================
// 2. DOM ELEMENTS SELECTION
// ==========================================
// Segmented Tabs
const tabBtnProfile = document.getElementById('tab-btn-profile');
const tabBtnShare = document.getElementById('tab-btn-share');
const profileSection = document.getElementById('profile-section');
const shareSection = document.getElementById('share-section');

// Form & Avatar
const profileForm = document.getElementById('profile-form');
const avatarInput = document.getElementById('avatar-input');
const removePhotoBtn = document.getElementById('remove-photo-btn');
const formAvatarPreview = document.getElementById('form-avatar-preview');

// Inputs
const nameInput = document.getElementById('name');
const titleInput = document.getElementById('title');
const phoneInput = document.getElementById('phone');
const whatsappInput = document.getElementById('whatsapp');
const instagramInput = document.getElementById('instagram');
const emailInput = document.getElementById('email');
const linkedinInput = document.getElementById('linkedin');

// Toggles
const togglePhone = document.getElementById('toggle-phone');
const toggleWhatsapp = document.getElementById('toggle-whatsapp');
const toggleInstagram = document.getElementById('toggle-instagram');
const toggleEmail = document.getElementById('toggle-email');
const toggleLinkedin = document.getElementById('toggle-linkedin');

// Toggle Labels
const labelPhone = document.getElementById('toggle-label-phone');
const labelWhatsapp = document.getElementById('toggle-label-whatsapp');
const labelInstagram = document.getElementById('toggle-label-instagram');
const labelEmail = document.getElementById('toggle-label-email');
const labelLinkedin = document.getElementById('toggle-label-linkedin');

// Presets
const presetAll = document.getElementById('preset-all');
const presetWork = document.getElementById('preset-work');
const presetSocial = document.getElementById('preset-social');

// NameDrop Card & QR
const cardAvatar = document.getElementById('card-avatar');
const cardName = document.getElementById('card-name');
const cardTitle = document.getElementById('card-title');
const cardLinks = document.getElementById('card-links');
const qrcodeDiv = document.getElementById('qrcode');
const downloadVcfBtn = document.getElementById('download-vcf-btn');

// ==========================================
// 3. SEGMENTED TAB SWITCHER
// ==========================================
function switchTab(tab) {
  if (tab === 'profile') {
    tabBtnProfile.classList.add('active');
    tabBtnShare.classList.remove('active');
    profileSection.classList.add('active-panel');
    shareSection.classList.remove('active-panel');
  } else {
    tabBtnShare.classList.add('active');
    tabBtnProfile.classList.remove('active');
    shareSection.classList.add('active-panel');
    profileSection.classList.remove('active-panel');
    renderQrCode();
  }
}

tabBtnProfile.addEventListener('click', () => switchTab('profile'));
tabBtnShare.addEventListener('click', () => switchTab('share'));

// ==========================================
// 4. PHOTO UPLOAD (FileReader API)
// ==========================================
avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2.5 * 1024 * 1024) {
    alert('Please choose an image under 2.5MB.');
    avatarInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    userProfile.avatar = event.target.result;
    updateCardAndToggles();
  };
  reader.readAsDataURL(file);
});

removePhotoBtn.addEventListener('click', () => {
  userProfile.avatar = '';
  avatarInput.value = '';
  updateCardAndToggles();
});

// ==========================================
// 5. MASTER FORM SUBMIT
// ==========================================
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();

  userProfile.name = nameInput.value.trim();
  userProfile.title = titleInput.value.trim();
  userProfile.phone = phoneInput.value.trim();
  userProfile.whatsapp = whatsappInput.value.trim();
  userProfile.instagram = instagramInput.value.trim();
  userProfile.email = emailInput.value.trim();
  userProfile.linkedin = linkedinInput.value.trim();

  saveToLocalStorage();
  updateCardAndToggles();
  switchTab('share');
});

// ==========================================
// 6. TOGGLE SWITCH LISTENERS
// ==========================================
const toggleMap = [
  { checkbox: togglePhone, key: 'phone' },
  { checkbox: toggleWhatsapp, key: 'whatsapp' },
  { checkbox: toggleInstagram, key: 'instagram' },
  { checkbox: toggleEmail, key: 'email' },
  { checkbox: toggleLinkedin, key: 'linkedin' }
];

toggleMap.forEach(({ checkbox, key }) => {
  checkbox.addEventListener('change', (e) => {
    privacySettings[key] = e.target.checked;
    saveToLocalStorage();
    updateCardAndToggles();
    renderQrCode();
  });
});

// ==========================================
// 7. PRESET BUTTONS
// ==========================================
function setAllToggles(phone, whatsapp, instagram, email, linkedin) {
  privacySettings.phone = phone;
  privacySettings.whatsapp = whatsapp;
  privacySettings.instagram = instagram;
  privacySettings.email = email;
  privacySettings.linkedin = linkedin;

  togglePhone.checked = phone;
  toggleWhatsapp.checked = whatsapp;
  toggleInstagram.checked = instagram;
  toggleEmail.checked = email;
  toggleLinkedin.checked = linkedin;

  saveToLocalStorage();
  updateCardAndToggles();
  renderQrCode();
}

presetAll.addEventListener('click', () => setAllToggles(true, true, true, true, true));
presetWork.addEventListener('click', () => setAllToggles(true, false, false, true, true));
presetSocial.addEventListener('click', () => setAllToggles(false, true, true, false, false));

// ==========================================
// 8. CARD PREVIEW & LABELS UPDATE
// ==========================================
function updateCardAndToggles() {
  // A. Toggle Labels
  labelPhone.textContent = userProfile.phone || 'Not set';
  labelWhatsapp.textContent = userProfile.whatsapp || 'Not set';
  labelInstagram.textContent = userProfile.instagram ? `@${userProfile.instagram.replace('@', '')}` : 'Not set';
  labelEmail.textContent = userProfile.email || 'Not set';
  labelLinkedin.textContent = userProfile.linkedin ? 'Configured' : 'Not set';

  togglePhone.checked = privacySettings.phone;
  toggleWhatsapp.checked = privacySettings.whatsapp;
  toggleInstagram.checked = privacySettings.instagram;
  toggleEmail.checked = privacySettings.email;
  toggleLinkedin.checked = privacySettings.linkedin;

  // B. Avatar sync in both Tab 1 and Tab 2
  if (userProfile.avatar) {
    formAvatarPreview.innerHTML = `<img src="${userProfile.avatar}" alt="Photo">`;
    cardAvatar.innerHTML = `<img src="${userProfile.avatar}" alt="Photo">`;
    removePhotoBtn.style.display = 'inline-block';
  } else {
    const initial = userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '⚡';
    formAvatarPreview.innerHTML = `<span>${initial}</span>`;
    cardAvatar.innerHTML = `<span>${initial}</span>`;
    removePhotoBtn.style.display = 'none';
  }

  // C. Name & Title
  cardName.textContent = userProfile.name || 'Your Name';
  cardTitle.textContent = userProfile.title || 'Role / Title';

  // D. Active Links
  cardLinks.innerHTML = '';
  let activeLinksCount = 0;

  if (privacySettings.phone && userProfile.phone) {
    activeLinksCount++;
    cardLinks.innerHTML += `
      <div class="ios-link-pill">
        <span>📞 Phone</span>
        <strong>${userProfile.phone}</strong>
      </div>`;
  }

  if (privacySettings.whatsapp && userProfile.whatsapp) {
    activeLinksCount++;
    const cleanWA = userProfile.whatsapp.replace(/[^0-9]/g, '');
    cardLinks.innerHTML += `
      <div class="ios-link-pill">
        <span>💬 WhatsApp</span>
        <strong>+${cleanWA}</strong>
      </div>`;
  }

  if (privacySettings.instagram && userProfile.instagram) {
    activeLinksCount++;
    const cleanInsta = userProfile.instagram.replace('@', '');
    cardLinks.innerHTML += `
      <div class="ios-link-pill">
        <span>📸 Instagram</span>
        <strong>@${cleanInsta}</strong>
      </div>`;
  }

  if (privacySettings.email && userProfile.email) {
    activeLinksCount++;
    cardLinks.innerHTML += `
      <div class="ios-link-pill">
        <span>✉️ Email</span>
        <strong>${userProfile.email}</strong>
      </div>`;
  }

  if (privacySettings.linkedin && userProfile.linkedin) {
    activeLinksCount++;
    cardLinks.innerHTML += `
      <div class="ios-link-pill">
        <span>💼 LinkedIn</span>
        <strong>Connected</strong>
      </div>`;
  }

  if (activeLinksCount === 0) {
    cardLinks.innerHTML = `<p class="empty-hint">All items turned off. Flip switches below to share.</p>`;
  }
}

// ==========================================
// 9. DYNAMIC QR CODE ENGINE
// ==========================================
function renderQrCode() {
  if (!qrcodeDiv) return;

  let qrData = `MECARD:N:${userProfile.name || 'User'};`;
  
  if (privacySettings.phone && userProfile.phone) {
    qrData += `TEL:${userProfile.phone};`;
  }
  if (privacySettings.email && userProfile.email) {
    qrData += `EMAIL:${userProfile.email};`;
  }
  if (privacySettings.whatsapp && userProfile.whatsapp) {
    qrData += `NOTE:WhatsApp:wa.me/${userProfile.whatsapp.replace(/[^0-9]/g, '')};`;
  }
  if (privacySettings.instagram && userProfile.instagram) {
    qrData += `URL:https://instagram.com/${userProfile.instagram.replace('@', '')};`;
  }
  qrData += `;`;

  qrcodeDiv.innerHTML = '';
  qrCodeInstance = new QRCode(qrcodeDiv, {
    text: qrData,
    width: 175,
    height: 175,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

// ==========================================
// 10. APPLE VCARD (.vcf) GENERATOR
// ==========================================
downloadVcfBtn.addEventListener('click', () => {
  if (!userProfile.name) {
    alert('Please enter your name first in Profile tab!');
    return;
  }

  let vcard = `BEGIN:VCARD\nVERSION:3.0\n`;
  vcard += `FN:${userProfile.name}\n`;
  if (userProfile.title) vcard += `TITLE:${userProfile.title}\n`;

  if (privacySettings.phone && userProfile.phone) {
    vcard += `TEL;TYPE=CELL:${userProfile.phone}\n`;
  }
  if (privacySettings.email && userProfile.email) {
    vcard += `EMAIL:${userProfile.email}\n`;
  }
  if (privacySettings.whatsapp && userProfile.whatsapp) {
    vcard += `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${userProfile.whatsapp.replace(/[^0-9]/g, '')}\n`;
  }
  if (privacySettings.instagram && userProfile.instagram) {
    vcard += `X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${userProfile.instagram.replace('@', '')}\n`;
  }
  if (privacySettings.linkedin && userProfile.linkedin) {
    vcard += `URL:${userProfile.linkedin}\n`;
  }
  if (userProfile.avatar && userProfile.avatar.includes('base64,')) {
    const base64Data = userProfile.avatar.split('base64,')[1];
    vcard += `PHOTO;ENCODING=b;TYPE=JPEG:${base64Data}\n`;
  }

  vcard += `END:VCARD`;

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.setAttribute('download', `${(userProfile.name || 'contact').replace(/\s+/g, '_')}.vcf`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
});

// ==========================================
// 11. LOCALSTORAGE PERSISTENCE
// ==========================================
function saveToLocalStorage() {
  try {
    localStorage.setItem('quickswap_profile', JSON.stringify(userProfile));
    localStorage.setItem('quickswap_privacy', JSON.stringify(privacySettings));
  } catch (err) {
    console.error('LocalStorage save error:', err);
  }
}

function loadSavedData() {
  const savedProfile = localStorage.getItem('quickswap_profile');
  const savedPrivacy = localStorage.getItem('quickswap_privacy');

  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
    nameInput.value = userProfile.name || '';
    titleInput.value = userProfile.title || '';
    phoneInput.value = userProfile.phone || '';
    whatsappInput.value = userProfile.whatsapp || '';
    instagramInput.value = userProfile.instagram || '';
    emailInput.value = userProfile.email || '';
    linkedinInput.value = userProfile.linkedin || '';
  }

  if (savedPrivacy) {
    privacySettings = JSON.parse(savedPrivacy);
  }

  updateCardAndToggles();
}

loadSavedData();
