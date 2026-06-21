import { db, auth } from './firebase-config.js';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ADMIN_USERNAME = 'EmilyQueenSlay';
const ADMIN_PASSWORD = 'EmilyQueenSlay#31TR';

const GAME_NAMES = {
  obby: 'Obby (Parkur)',
  tycoon: 'Tycoon',
  simulator: 'Simulator',
  horror: 'Horror',
  pvp: 'PvP / Fighting',
  racing: 'Racing',
  custom: 'Ozel / Diger'
};

let isAdmin = false;

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const adminDoc = await getDocs(query(
      collection(db, 'admins'),
      where('uid', '==', user.uid)
    ));
    
    if (!adminDoc.empty) {
      isAdmin = true;
      document.getElementById('loginSection').style.display = 'none';
      document.getElementById('adminContent').style.display = 'block';
      document.getElementById('logoutBtn').style.display = 'inline-block';
      loadEvents();
    }
  }
});

window.adminLogin = async function() {
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  const msg = document.getElementById('loginMessage');

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    msg.textContent = 'Hatali kullanici adi veya sifre.';
    msg.className = 'message error';
    return;
  }

  try {
    // Otomatik admin kaydi
    const existingAdmin = await getDocs(query(
      collection(db, 'admins'),
      where('username', '==', ADMIN_USERNAME)
    ));

    if (existingAdmin.empty) {
      await addDoc(collection(db, 'admins'), {
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, 'admins', existingAdmin.docs[0].id), {
        uid: auth.currentUser.uid,
        lastLogin: serverTimestamp()
      });
    }

    isAdmin = true;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    loadEvents();
  } catch (error) {
    msg.textContent = 'Giris hatasi: ' + error.message;
    msg.className = 'message error';
  }
};

window.logout = function() {
  auth.signOut();
  location.reload();
};

window.createEvent = async function() {
  if (!isAdmin) return alert('Yetkisiz erisim.');

  const name = document.getElementById('eventName').value.trim();
  const prize = document.getElementById('eventPrize').value.trim();
  const capacity = parseInt(document.getElementById('eventCapacity').value);
  const date = document.getElementById('eventDate').value;
  const desc = document.getElementById('eventDesc').value.trim();
  const gameLink = document.getElementById('gameLink').value.trim();
  const requirements = document.getElementById('eventRequirements').value.trim();
  const game = document.getElementById('eventGame').value;

  if (!name || !prize || !capacity || !date) {
    return alert('Zorunlu alanlari doldurun: Ad, Odul, Kontenjan, Tarih');
  }

  try {
    await addDoc(collection(db, 'events'), {
      name, prize, capacity, date,
      description: desc,
      game,
      gameLink,
      requirements,
      currentParticipants: 0,
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid
    });

    alert('Etkinlik olusturuldu.');
    clearForm();
  } catch (error) {
    alert('Hata: ' + error.message);
  }
};

function loadEvents() {
  const container = document.getElementById('adminEventsList');
  
  const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
  
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      container.innerHTML = '<p class="empty-text">Henuz etkinlik yok.</p>';
      return;
    }

    container.innerHTML = snapshot.docs.map(doc => {
      const e = doc.data();
      const gameName = GAME_NAMES[e.game] || e.game || 'Belirtilmemis';
      const statusText = e.status === 'active' ? 'Aktif' : e.status === 'completed' ? 'Tamamlandi' : 'Pasif';
      
      return `
        <div class="admin-event-card">
          <div class="event-card-header">
            <h3>${e.name}</h3>
            <span class="status-badge ${e.status}">${statusText}</span>
          </div>
          <p>${gameName} | ${e.prize} | ${e.currentParticipants || 0}/${e.capacity} kisi</p>
          <p>${new Date(e.date).toLocaleString('tr-TR')}</p>
          ${e.gameLink ? `<p><a href="${e.gameLink}" target="_blank">Roblox Oyun Linki</a></p>` : ''}
          
          <div class="admin-actions">
            <button onclick="editCapacity('${doc.id}', ${e.capacity})">Kontenjan Degistir</button>
            <button onclick="toggleStatus('${doc.id}', '${e.status}')">
              ${e.status === 'active' ? 'Pasif Yap' : e.status === 'inactive' ? 'Aktif Yap' : 'Aktife Al'}
            </button>
            <button onclick="addAnnouncement('${doc.id}')">Duyuru Ekle</button>
            <button onclick="viewParticipants('${doc.id}')">Katilimcilar</button>
            <button class="btn-danger" onclick="deleteEvent('${doc.id}')">Sil</button>
          </div>
        </div>
      `;
    }).join('');
  });
}

window.editCapacity = async function(eventId, current) {
  const newCap = prompt('Yeni kontenjan:', current);
  if (!newCap || isNaN(newCap) || newCap < 0) return;
  await updateDoc(doc(db, 'events', eventId), { capacity: parseInt(newCap) });
};

window.toggleStatus = async function(eventId, current) {
  const newStatus = current === 'active' ? 'inactive' : current === 'inactive' ? 'active' : 'completed';
  await updateDoc(doc(db, 'events', eventId), { status: newStatus });
};

window.addAnnouncement = async function(eventId) {
  const msg = prompt('Duyuru mesaji:');
  if (!msg) return;
  await addDoc(collection(db, 'events', eventId, 'announcements'), {
    message: msg,
    timestamp: serverTimestamp()
  });
  alert('Duyuru eklendi.');
};

window.viewParticipants = async function(eventId) {
  const snapshot = await getDocs(collection(db, 'events', eventId, 'participants'));
  
  if (snapshot.empty) {
    alert('Henuz katilimci yok.');
    return;
  }

  let list = 'Katilimcilar:\n\n';
  snapshot.docs.forEach((doc, i) => {
    const p = doc.data();
    list += `${i + 1}. Roblox: ${p.roblox} | Discord: ${p.discord}\n`;
  });

  const action = prompt(list + '\nSilmek icin numara yazin:');
  if (action && !isNaN(action)) {
    const index = parseInt(action) - 1;
    const docToDelete = snapshot.docs[index];
    if (docToDelete && confirm(`${docToDelete.data().roblox} silinsin mi?`)) {
      await deleteDoc(doc(db, 'events', eventId, 'participants', docToDelete.id));
      const remaining = await getDocs(collection(db, 'events', eventId, 'participants'));
      await updateDoc(doc(db, 'events', eventId), {
        currentParticipants: remaining.size
      });
      alert('Katilimci silindi.');
    }
  }
};

window.deleteEvent = async function(eventId) {
  if (!confirm('Bu etkinligi tamamen silmek istediginize emin misiniz?')) return;
  
  const participants = await getDocs(collection(db, 'events', eventId, 'participants'));
  for (const p of participants.docs) {
    await deleteDoc(doc(db, 'events', eventId, 'participants', p.id));
  }
  
  const announcements = await getDocs(collection(db, 'events', eventId, 'announcements'));
  for (const a of announcements.docs) {
    await deleteDoc(doc(db, 'events', eventId, 'announcements', a.id));
  }
  
  await deleteDoc(doc(db, 'events', eventId));
  alert('Etkinlik silindi.');
};

function clearForm() {
  ['eventName','eventPrize','eventCapacity','eventDate','eventDesc','gameLink','eventRequirements'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('eventGame').value = '';
}
