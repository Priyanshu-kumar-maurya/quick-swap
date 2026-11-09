/**
 * ==========================================
 *  QUICKSWAP - JAVASCRIPT LEARNING PROJECT
 * ==========================================
 * Is file mein hum seekhenge:
 * 1. DOM Elements ko kaise select karte hain (document.getElementById)
 * 2. Events ko kaise sunte hain (addEventListener: 'input', 'change', 'click')
 * 3. FileReader API: Image file ko Base64 string mein convert karna
 * 4. Data ko Objects mein kaise store karte hain
 * 5. LocalStorage mein data kaise save/load karte hain
 * 6. JavaScript Blob se real .vcf contact file (with Photo!) download karwana
 * 7. QR Code dynamically generate karna
 */

// ==========================================
// STEP 1: DOM Elements ko Select Karna
// ==========================================
const profileForm = document.getElementById('profile-form');

// Form Input Fields
const avatarInput = document.getElementById('avatar-input');
const removePhotoBtn = document.getElementById('remove-photo-btn');
const nameInput = document.getElementById('name');
const titleInput = document.getElementById('title');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const whatsappInput = document.getElementById('whatsapp');
const instagramInput = document.getElementById('instagram');
const linkedinInput = document.getElementById('linkedin');

// Preview Card Elements
const cardAvatar = document.getElementById('card-avatar');
const cardName = document.getElementById('card-name');
const cardTitle = document.getElementById('card-title');
const cardLinks = document.getElementById('card-links');

// Action Buttons & QR container
const downloadVcfBtn = document.getElementById('download-vcf-btn');
const toggleQrBtn = document.getElementById('toggle-qr-btn');
const qrContainer = document.getElementById('qr-container');
const qrcodeDiv = document.getElementById('qrcode');

// Global variable QR Code instance ke liye
let qrCodeInstance = null;

// ==========================================
// STEP 2: State (User Profile Object)
// ==========================================
let userProfile = {
  avatar: '', // Base64 image data URL yahan store hoga
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
  // 1. Avatar (Photo ya Initials)
  if (userProfile.avatar) {
    // Agar user ne photo chuni hai, toh image show karein
    cardAvatar.innerHTML = `<img src="${userProfile.avatar}" alt="Profile Photo">`;
    if (removePhotoBtn) removePhotoBtn.style.display = 'inline-block';
  } else {
    // Fallback: Name ka first letter ya emoji
    if (userProfile.name && userProfile.name.trim().length > 0) {
      cardAvatar.textContent = userProfile.name.trim().charAt(0).toUpperCase();
    } else {
      cardAvatar.textContent = '⚡';
    }
    if (removePhotoBtn) removePhotoBtn.style.display = 'none';
  }

  // 2. Name aur Title update karein
  cardName.textContent = userProfile.name || 'Your Name';
  cardTitle.textContent = userProfile.title || 'Your Title / Profession';

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
// STEP 4: Photo Upload with FileReader API 📸
// ==========================================
// Jab user device se photo select karta hai ('change' event)
avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Size limit (2MB tak) taaki browser storage bhar na jaye
  if (file.size > 2 * 1024 * 1024) {
    alert('Please choose an image under 2MB.');
    avatarInput.value = '';
    return;
  }

  // 1. FileReader object create karein
  const reader = new FileReader();

  // 2. File read hone ke baad ye function chalega
  reader.onload = function(event) {
    // event.target.result mein puri Base64 data string hoti hai
    userProfile.avatar = event.target.result;
    updateCardPreview();
  };

  // 3. File ko Data URL (Base64) format mein read karna shuru karein
  reader.readAsDataURL(file);
});

// Photo remove karne ka button
removePhotoBtn.addEventListener('click', () => {
  userProfile.avatar = '';
  avatarInput.value = '';
  updateCardPreview();
});

// ==========================================
// STEP 5: Real-time Text Input Listeners 🪄
// ==========================================
const textInputs = [nameInput, titleInput, phoneInput, emailInput, whatsappInput, instagramInput, linkedinInput];

textInputs.forEach(input => {
  input.addEventListener('input', (e) => {
    const fieldId = e.target.id;
    userProfile[fieldId] = e.target.value;
    updateCardPreview();
  });
});

// ==========================================
// STEP 6: Form Submit (Save to LocalStorage)
// ==========================================
profileForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Page reload hone se rokna

  try {
    // LocalStorage mein save karein
    localStorage.setItem('quickswap_profile', JSON.stringify(userProfile));
    alert('🎉 Profile details saved in browser storage!');
  } catch (err) {
    alert('Could not save to LocalStorage (Image might be too large).');
  }
});

// ==========================================
// STEP 7: Page Load par Data Restore Karna
// ==========================================
function loadSavedProfile() {
  const savedData = localStorage.getItem('quickswap_profile');
  if (savedData) {
    userProfile = JSON.parse(savedData);

    // Form fields ko bhar dein
    nameInput.value = userProfile.name || '';
    titleInput.value = userProfile.title || '';
    phoneInput.value = userProfile.phone || '';
    emailInput.value = userProfile.email || '';
    whatsappInput.value = userProfile.whatsapp || '';
    instagramInput.value = userProfile.instagram || '';
    linkedinInput.value = userProfile.linkedin || '';

    // Card update karein (Photo & Details)
    updateCardPreview();
  }
}

// ==========================================
// STEP 8: vCard (.vcf) with Photo Support 📇
// ==========================================
downloadVcfBtn.addEventListener('click', () => {
  if (!userProfile.name || !userProfile.phone) {
    alert('Please enter at least Name and Phone number to create contact!');
    return;
  }

  // Standard vCard 3.0 format
  let vcard = `BEGIN:VCARD\nVERSION:3.0\n`;
  vcard += `FN:${userProfile.name}\n`;
  if (userProfile.title) vcard += `TITLE:${userProfile.title}\n`;
  if (userProfile.phone) vcard += `TEL;TYPE=CELL:${userProfile.phone}\n`;
  if (userProfile.email) vcard += `EMAIL:${userProfile.email}\n`;
  if (userProfile.whatsapp) vcard += `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${userProfile.whatsapp.replace(/[^0-9]/g, '')}\n`;
  if (userProfile.instagram) vcard += `X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${userProfile.instagram.replace('@', '')}\n`;
  if (userProfile.linkedin) vcard += `URL:${userProfile.linkedin}\n`;

  // Agar photo hai, toh vCard mein Base64 photo embed karein!
  if (userProfile.avatar && userProfile.avatar.includes('base64,')) {
    const base64Data = userProfile.avatar.split('base64,')[1];
    vcard += `PHOTO;ENCODING=b;TYPE=JPEG:${base64Data}\n`;
  }

  vcard += `END:VCARD`;

  // JavaScript Blob se download trigger karein
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.setAttribute('download', `${userProfile.name.replace(/\s+/g, '_')}_contact.vcf`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
});

// ==========================================
// STEP 9: Dynamic QR Code Generator
// ==========================================
toggleQrBtn.addEventListener('click', () => {
  if (qrContainer.style.display === 'none') {
    qrContainer.style.display = 'flex';
    toggleQrBtn.textContent = '❌ Hide QR Code';

    // MECARD format contact data
    let qrData = `MECARD:N:${userProfile.name || 'User'};TEL:${userProfile.phone || ''};EMAIL:${userProfile.email || ''};;`;

    // Purana QR clean karke naya generate karein
    qrcodeDiv.innerHTML = '';
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

// App initialize karein
loadSavedProfile();
