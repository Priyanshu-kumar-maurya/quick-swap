/**
 * ==========================================
 *  QUICKSWAP - JAVASCRIPT LEARNING PROJECT
 * ==========================================
 * Is file mein hum seekhenge:
 * 1. DOM Elements ko kaise select karte hain (document.getElementById)
 * 2. Events ko kaise sunte hain (addEventListener)
 * 3. Data ko Objects mein kaise store karte hain
 * 4. LocalStorage mein data kaise save/load karte hain
 * 5. JavaScript se real .vcf file (Contact) kaise generate hoti hai
 * 6. QR Code kaise dynamically generate karte hain
 */

// ==========================================
// STEP 1: DOM Elements ko Select Karna
// ==========================================
const profileForm = document.getElementById('profile-form');

// Form Input Fields
const nameInput = document.getElementById('name');
const titleInput = document.getElementById('title');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const whatsappInput = document.getElementById('whatsapp');
const instagramInput = document.getElementById('instagram');
const linkedinInput = document.getElementById('linkedin');

// Preview Card Elements
const cardName = document.getElementById('card-name');
const cardTitle = document.getElementById('card-title');
const cardLinks = document.getElementById('card-links');
const cardAvatar = document.getElementById('card-avatar');

// Action Buttons & QR container
const downloadVcfBtn = document.getElementById('download-vcf-btn');
const toggleQrBtn = document.getElementById('toggle-qr-btn');
const qrContainer = document.getElementById('qr-container');
const qrcodeDiv = document.getElementById('qrcode');

// Global variable QR Code instance ke liye
let qrCodeInstance = null;

// ==========================================
// STEP 2: State (Data Object)
// ==========================================
// User ka saara data hum ek JavaScript Object mein rakhenge:
let userProfile = {
  name: '',
  title: '',
  phone: '',
  email: '',
  whatsapp: '',
  instagram: '',
  linkedin: ''
};

// ==========================================
// STEP 3: Preview Card ko Update Karne ka Function
// ==========================================
function updateCardPreview() {
  // 1. Name aur Title update karein
  cardName.textContent = userProfile.name || 'Your Name';
  cardTitle.textContent = userProfile.title || 'Your Title / Profession';

  // 2. Avatar ka pehla letter dikhayein
  if (userProfile.name && userProfile.name.trim().length > 0) {
    cardAvatar.textContent = userProfile.name.trim().charAt(0).toUpperCase();
  } else {
    cardAvatar.textContent = '⚡';
  }

  // 3. Links ko dynamically HTML mein generate karein
  cardLinks.innerHTML = '';
  let hasAnyLink = false;

  // Phone Call Link
  if (userProfile.phone) {
    hasAnyLink = true;
    cardLinks.innerHTML += `
      <a href="tel:${userProfile.phone}" class="link-pill">
        <span>📞 Phone</span>
        <span>${userProfile.phone}</span>
      </a>
    `;
  }

  // WhatsApp Link
  if (userProfile.whatsapp) {
    hasAnyLink = true;
    const cleanNumber = userProfile.whatsapp.replace(/[^0-9]/g, '');
    cardLinks.innerHTML += `
      <a href="https://wa.me/${cleanNumber}" target="_blank" class="link-pill">
        <span>💬 WhatsApp</span>
        <span>Chat</span>
      </a>
    `;
  }

  // Email Link
  if (userProfile.email) {
    hasAnyLink = true;
    cardLinks.innerHTML += `
      <a href="mailto:${userProfile.email}" class="link-pill">
        <span>✉️ Email</span>
        <span>${userProfile.email}</span>
      </a>
    `;
  }

  // Instagram Link
  if (userProfile.instagram) {
    hasAnyLink = true;
    const cleanInsta = userProfile.instagram.replace('@', '').trim();
    cardLinks.innerHTML += `
      <a href="https://instagram.com/${cleanInsta}" target="_blank" class="link-pill">
        <span>📸 Instagram</span>
        <span>@${cleanInsta}</span>
      </a>
    `;
  }

  // LinkedIn Link
  if (userProfile.linkedin) {
    hasAnyLink = true;
    cardLinks.innerHTML += `
      <a href="${userProfile.linkedin}" target="_blank" class="link-pill">
        <span>💼 LinkedIn</span>
        <span>View Profile</span>
      </a>
    `;
  }

  if (!hasAnyLink) {
    cardLinks.innerHTML = `<p class="empty-hint">Fill the form to see your card details</p>`;
  }
}

// ==========================================
// STEP 4: Real-time Input Listeners (Magic 🪄)
// ==========================================
// Jaise hi user form mein kuch type karega, card live update hoga!
const inputs = [nameInput, titleInput, phoneInput, emailInput, whatsappInput, instagramInput, linkedinInput];

inputs.forEach(input => {
  input.addEventListener('input', (e) => {
    const fieldId = e.target.id;
    userProfile[fieldId] = e.target.value;
    updateCardPreview();
  });
});

// ==========================================
// STEP 5: Form Submit (Save to LocalStorage)
// ==========================================
profileForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Page refresh hone se rokna

  // LocalStorage mein save karein (Objects ko string mein convert karke)
  localStorage.setItem('quickswap_profile', JSON.stringify(userProfile));
  alert('🎉 Profile details saved in browser storage!');
});

// ==========================================
// STEP 6: Page Load par Data Restore Karna
// ==========================================
function loadSavedProfile() {
  const savedData = localStorage.getItem('quickswap_profile');
  if (savedData) {
    // String ko wapas Object mein convert karein
    userProfile = JSON.parse(savedData);

    // Form fields ko bhar dein
    nameInput.value = userProfile.name || '';
    titleInput.value = userProfile.title || '';
    phoneInput.value = userProfile.phone || '';
    emailInput.value = userProfile.email || '';
    whatsappInput.value = userProfile.whatsapp || '';
    instagramInput.value = userProfile.instagram || '';
    linkedinInput.value = userProfile.linkedin || '';

    // Card update karein
    updateCardPreview();
  }
}

// ==========================================
// STEP 7: vCard (.vcf) File Generator (The Core Feature!)
// ==========================================
downloadVcfBtn.addEventListener('click', () => {
  if (!userProfile.name || !userProfile.phone) {
    alert('Please enter at least Name and Phone number to create contact!');
    return;
  }

  // Standard vCard 3.0 format text structure:
  let vcard = `BEGIN:VCARD\nVERSION:3.0\n`;
  vcard += `FN:${userProfile.name}\n`;
  if (userProfile.title) vcard += `TITLE:${userProfile.title}\n`;
  if (userProfile.phone) vcard += `TEL;TYPE=CELL:${userProfile.phone}\n`;
  if (userProfile.email) vcard += `EMAIL:${userProfile.email}\n`;
  if (userProfile.whatsapp) vcard += `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${userProfile.whatsapp.replace(/[^0-9]/g, '')}\n`;
  if (userProfile.instagram) vcard += `X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${userProfile.instagram.replace('@', '')}\n`;
  if (userProfile.linkedin) vcard += `URL:${userProfile.linkedin}\n`;
  vcard += `END:VCARD`;

  // JavaScript Blob: Text ko virtual file mein convert karna
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Dynamic <a> tag banakar download trigger karna
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.setAttribute('download', `${userProfile.name.replace(/\s+/g, '_')}_contact.vcf`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
});

// ==========================================
// STEP 8: QR Code Generator & Toggle
// ==========================================
toggleQrBtn.addEventListener('click', () => {
  if (qrContainer.style.display === 'none') {
    qrContainer.style.display = 'flex';
    toggleQrBtn.textContent = '❌ Hide QR Code';

    // QR Code mein contact details vCard format mein encode karna
    let qrData = `MECARD:N:${userProfile.name || 'User'};TEL:${userProfile.phone || ''};EMAIL:${userProfile.email || ''};;`;

    // Purana QR clean karein
    qrcodeDiv.innerHTML = '';

    // Naya QR banayein using QRCode.js
    qrCodeInstance = new QRCode(qrcodeDiv, {
      text: qrData,
      width: 180,
      height: 180,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    qrContainer.style.display = 'none';
    toggleQrBtn.textContent = '📱 Show QR Code';
  }
});

// App initialize karein jab page load ho
loadSavedProfile();
