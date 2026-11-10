/**
 * ========================================================
 *  QUICKSWAP - PAYTM STYLE SCANNER & iOS PROFILE HUB
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
  customLinks: [] // [{ label: 'GitHub', value: 'https://github.com/...' }]
};

let privacySettings = {
  phone: true,
  whatsapp: true,
  instagram: true,
  email: true,
  linkedin: true
};

let html5QrScanner = null;
let isCameraActive = false;
let qrCodeInstance = null;

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
// Navigation & Views
const navBtnScanner = document.getElementById('nav-btn-scanner');
const navBtnMyQr = document.getElementById('nav-btn-myqr');
const scannerView = document.getElementById('scanner-view');
const myqrView = document.getElementById('myqr-view');

// Top Bar Profile Button & Sheet
const openProfileBtn = document.getElementById('open-profile-btn');
const closeProfileBtn = document.getElementById('close-profile-btn');
const profileSheetOverlay = document.getElementById('profile-sheet-overlay');
const headerAvatarCircle = document.getElementById('header-avatar-circle');

// Camera & Scanner Controls
const toggleCameraBtn = document.getElementById('toggle-camera-btn');
const cameraBtnText = document.getElementById('camera-btn-text');
const qrFileInput = document.getElementById('qr-file-input');
const laserLine = document.getElementById('laser-line');

// Scanned Result Modal
const scanResultModal = document.getElementById('scan-result-modal');
const closeScanResultBtn = document.getElementById('close-scan-result-btn');
const scannedName = document.getElementById('scanned-name');
const scannedDetail = document.getElementById('scanned-detail');
const scannedActionsContainer = document.getElementById('scanned-actions-container');

// Profile Form Elements
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

// Custom Links Container
const customFieldsContainer = document.getElementById('custom-fields-container');
const addCustomFieldBtn = document.getElementById('add-custom-field-btn');

// QR View Elements
const cardAvatar = document.getElementById('card-avatar');
const cardName = document.getElementById('card-name');
const cardTitle = document.getElementById('card-title');
const cardLinks = document.getElementById('card-links');
const qrcodeDiv = document.getElementById('qrcode');
const downloadVcfBtn = document.getElementById('download-vcf-btn');

// Toggles
const togglePhone = document.getElementById('toggle-phone');
const toggleWhatsapp = document.getElementById('toggle-whatsapp');
const toggleInstagram = document.getElementById('toggle-instagram');
const toggleEmail = document.getElementById('toggle-email');
const toggleLinkedin = document.getElementById('toggle-linkedin');

const labelPhone = document.getElementById('toggle-label-phone');
const labelWhatsapp = document.getElementById('toggle-label-whatsapp');
const labelInstagram = document.getElementById('toggle-label-instagram');
const labelEmail = document.getElementById('toggle-label-email');
const labelLinkedin = document.getElementById('toggle-label-linkedin');

const presetAll = document.getElementById('preset-all');
const presetWork = document.getElementById('preset-work');
const presetSocial = document.getElementById('preset-social');

// ==========================================
// 3. MAIN NAVIGATION: [ SCANNER ] vs [ MY QR ]
// ==========================================
function switchMainView(view) {
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

    // Agar camera chal raha ho toh band karein
    stopCamera();
    renderQrCode();
  }
}

navBtnScanner.addEventListener('click', () => switchMainView('scanner'));
navBtnMyQr.addEventListener('click', () => switchMainView('myqr'));

// ==========================================
// 4. PAYTM STYLE CAMERA SCANNER (html5-qrcode)
// ==========================================
async function startCamera() {
  if (!html5QrScanner) {
    html5QrScanner = new Html5Qrcode("reader");
  }

  try {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    await html5QrScanner.start(
      { facingMode: "environment" }, // Rear phone camera
      config,
      onScanSuccess,
      (err) => { /* ignore frame errors */ }
    );
    isCameraActive = true;
    cameraBtnText.textContent = "🛑 Stop Camera";
    laserLine.style.display = "block";
  } catch (err) {
    console.error("Camera access error:", err);
    alert("Camera permission denied or camera not available on this device.");
  }
}

async function stopCamera() {
  if (html5QrScanner && isCameraActive) {
    try {
      await html5QrScanner.stop();
      isCameraActive = false;
      cameraBtnText.textContent = "📷 Open Camera";
      laserLine.style.display = "none";
    } catch (err) {
      console.error(err);
    }
  }
}

toggleCameraBtn.addEventListener('click', () => {
  if (isCameraActive) {
    stopCamera();
  } else {
    startCamera();
  }
});

// Scan from Photo Gallery Fallback
qrFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!html5QrScanner) {
    html5QrScanner = new Html5Qrcode("reader");
  }

  try {
    const decodedText = await html5QrScanner.scanFile(file, true);
    onScanSuccess(decodedText);
  } catch (err) {
    alert("No QR code found in this photo. Try another image.");
  }
});

// Jab QR successfully scan ho jaye:
function onScanSuccess(decodedText) {
  stopCamera();

  // Contact info parse karein
  let contact = parseScannedQr(decodedText);

  scannedName.textContent = contact.name || "Scanned Contact";
  scannedDetail.textContent = contact.phone || contact.email || contact.url || decodedText;

  scannedActionsContainer.innerHTML = '';

  // 1-Click Save button
  if (contact.vcard) {
    const blob = new Blob([contact.vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    scannedActionsContainer.innerHTML += `
      <a href="${url}" download="${(contact.name || 'contact').replace(/\s+/g, '_')}.vcf" class="ios-action-btn apple-save-btn">
        📥 Save to Phonebook (.vcf)
      </a>
    `;
  } else if (contact.phone) {
    scannedActionsContainer.innerHTML += `
      <a href="tel:${contact.phone}" class="ios-action-btn primary-action">
        📞 Call ${contact.phone}
      </a>
    `;
  }

  if (contact.url) {
    scannedActionsContainer.innerHTML += `
      <a href="${contact.url}" target="_blank" class="ios-action-btn ios-pill-btn secondary">
        🌐 Open Link
      </a>
    `;
  }

  scanResultModal.classList.add('active');
}

closeScanResultBtn.addEventListener('click', () => {
  scanResultModal.classList.remove('active');
});

// MECARD / VCARD / URL text parser
function parseScannedQr(text) {
  let contact = { name: '', phone: '', email: '', url: '', vcard: '' };

  if (text.startsWith('BEGIN:VCARD')) {
    contact.vcard = text;
    const fnMatch = text.match(/FN:(.+)/);
    if (fnMatch) contact.name = fnMatch[1].trim();
    const telMatch = text.match(/TEL.*:(.+)/);
    if (telMatch) contact.phone = telMatch[1].trim();
  } else if (text.startsWith('MECARD:')) {
    const nMatch = text.match(/N:([^;]+)/);
    if (nMatch) contact.name = nMatch[1];
    const telMatch = text.match(/TEL:([^;]+)/);
    if (telMatch) contact.phone = telMatch[1];
    const emailMatch = text.match(/EMAIL:([^;]+)/);
    if (emailMatch) contact.email = emailMatch[1];
  } else if (text.startsWith('http://') || text.startsWith('https://')) {
    contact.url = text;
    contact.name = "Web Link";
  } else if (/^\+?[0-9\s-]{7,15}$/.test(text.trim())) {
    contact.phone = text.trim();
    contact.name = "Phone Number";
  } else {
    contact.name = "QR Information";
  }

  return contact;
}

// ==========================================
// 5. SLIDE-UP PROFILE DRAWER
// ==========================================
openProfileBtn.addEventListener('click', () => {
  profileSheetOverlay.classList.add('active');
});

closeProfileBtn.addEventListener('click', () => {
  profileSheetOverlay.classList.remove('active');
});

profileSheetOverlay.addEventListener('click', (e) => {
  if (e.target === profileSheetOverlay) {
    profileSheetOverlay.classList.remove('active');
  }
});

// ==========================================
// 6. DYNAMIC "+ ADD CUSTOM LINK" FEATURE ➕
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
      <button type="button" class="delete-row-btn" data-index="${index}">✕</button>
    `;

    // Row ke input changes track karein
    const labelInp = row.querySelector('.custom-label-input');
    const valInp = row.querySelector('.custom-val-input');
    const delBtn = row.querySelector('.delete-row-btn');

    labelInp.addEventListener('input', (e) => {
      userProfile.customLinks[index].label = e.target.value;
    });

    valInp.addEventListener('input', (e) => {
      userProfile.customLinks[index].value = e.target.value;
    });

    delBtn.addEventListener('click', () => {
      userProfile.customLinks.splice(index, 1);
      renderCustomFields();
      updateCardAndToggles();
    });

    customFieldsContainer.appendChild(row);
  });
}

addCustomFieldBtn.addEventListener('click', () => {
  userProfile.customLinks.push({ label: 'Link', value: '' });
  renderCustomFields();
});

// ==========================================
// 7. PHOTO UPLOAD (FileReader API)
// ==========================================
avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

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

// Profile Form Submit
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
  profileSheetOverlay.classList.remove('active');
  alert('Profile updated successfully! ✨');
});

// ==========================================
// 8. PRIVACY TOGGLE CONTROLS
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
// 9. UPDATE CARD, AVATARS & LABELS
// ==========================================
function updateCardAndToggles() {
  // Top Header Avatar Circle
  if (userProfile.avatar) {
    headerAvatarCircle.innerHTML = `<img src="${userProfile.avatar}" alt="Me">`;
    formAvatarPreview.innerHTML = `<img src="${userProfile.avatar}" alt="Me">`;
    cardAvatar.innerHTML = `<img src="${userProfile.avatar}" alt="Me">`;
    removePhotoBtn.style.display = 'inline-block';
  } else {
    const initial = userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '⚡';
    headerAvatarCircle.innerHTML = `<span>${initial}</span>`;
    formAvatarPreview.innerHTML = `<span>${initial}</span>`;
    cardAvatar.innerHTML = `<span>${initial}</span>`;
    removePhotoBtn.style.display = 'none';
  }

  // Card Text
  cardName.textContent = userProfile.name || 'Your Name';
  cardTitle.textContent = userProfile.title || 'Role / Headline';

  // Toggle Labels
  labelPhone.textContent = userProfile.phone || 'Not set';
  labelWhatsapp.textContent = userProfile.whatsapp || 'Not set';
  labelInstagram.textContent = userProfile.instagram ? `@${userProfile.instagram.replace('@', '')}` : 'Not set';
  labelEmail.textContent = userProfile.email || 'Not set';
  labelLinkedin.textContent = userProfile.linkedin ? 'Configured' : 'Not set';

  // Card Links
  cardLinks.innerHTML = '';
  if (privacySettings.phone && userProfile.phone) {
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>📞 Phone</span><strong>${userProfile.phone}</strong></div>`;
  }
  if (privacySettings.whatsapp && userProfile.whatsapp) {
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>💬 WhatsApp</span><strong>${userProfile.whatsapp}</strong></div>`;
  }
  if (privacySettings.instagram && userProfile.instagram) {
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>📸 Instagram</span><strong>@${userProfile.instagram.replace('@', '')}</strong></div>`;
  }
  if (privacySettings.email && userProfile.email) {
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>✉️ Email</span><strong>${userProfile.email}</strong></div>`;
  }
  if (privacySettings.linkedin && userProfile.linkedin) {
    cardLinks.innerHTML += `<div class="ios-link-pill"><span>💼 LinkedIn</span><strong>Connected</strong></div>`;
  }

  // Custom Links
  userProfile.customLinks.forEach(link => {
    if (link.label && link.value) {
      cardLinks.innerHTML += `<div class="ios-link-pill"><span>🔗 ${link.label}</span><strong>${link.value}</strong></div>`;
    }
  });
}

// ==========================================
// 10. GENERATE QR CODE
// ==========================================
function renderQrCode() {
  if (!qrcodeDiv) return;

  let qrData = `MECARD:N:${userProfile.name || 'User'};`;
  if (privacySettings.phone && userProfile.phone) qrData += `TEL:${userProfile.phone};`;
  if (privacySettings.email && userProfile.email) qrData += `EMAIL:${userProfile.email};`;
  if (privacySettings.whatsapp && userProfile.whatsapp) qrData += `NOTE:WhatsApp:wa.me/${userProfile.whatsapp.replace(/[^0-9]/g, '')};`;
  if (privacySettings.instagram && userProfile.instagram) qrData += `URL:https://instagram.com/${userProfile.instagram.replace('@', '')};`;
  
  // Custom links in QR
  userProfile.customLinks.forEach(item => {
    if (item.value) qrData += `NOTE:${item.label}:${item.value};`;
  });

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
// 11. VCARD (.vcf) GENERATION
// ==========================================
downloadVcfBtn.addEventListener('click', () => {
  if (!userProfile.name) {
    alert('Please enter your name first in Profile!');
    profileSheetOverlay.classList.add('active');
    return;
  }

  let vcard = `BEGIN:VCARD\nVERSION:3.0\n`;
  vcard += `FN:${userProfile.name}\n`;
  if (userProfile.title) vcard += `TITLE:${userProfile.title}\n`;
  if (privacySettings.phone && userProfile.phone) vcard += `TEL;TYPE=CELL:${userProfile.phone}\n`;
  if (privacySettings.email && userProfile.email) vcard += `EMAIL:${userProfile.email}\n`;
  if (privacySettings.whatsapp && userProfile.whatsapp) vcard += `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${userProfile.whatsapp.replace(/[^0-9]/g, '')}\n`;
  if (privacySettings.instagram && userProfile.instagram) vcard += `X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${userProfile.instagram.replace('@', '')}\n`;
  if (privacySettings.linkedin && userProfile.linkedin) vcard += `URL:${userProfile.linkedin}\n`;

  userProfile.customLinks.forEach(item => {
    if (item.value) vcard += `URL;TYPE=${item.label}:${item.value}\n`;
  });

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
// 12. STORAGE HELPERS
// ==========================================
function saveToLocalStorage() {
  localStorage.setItem('quickswap_profile', JSON.stringify(userProfile));
  localStorage.setItem('quickswap_privacy', JSON.stringify(privacySettings));
}

function loadSavedData() {
  const savedProfile = localStorage.getItem('quickswap_profile');
  const savedPrivacy = localStorage.getItem('quickswap_privacy');

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
  } else {
    // Pehli baar kholne par Profile sheet auto-open karein taaki user details daal sake!
    profileSheetOverlay.classList.add('active');
  }

  if (savedPrivacy) {
    privacySettings = JSON.parse(savedPrivacy);
  }

  updateCardAndToggles();
}

loadSavedData();
