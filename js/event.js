import { db } from './firebase-config.js';
import { 
  doc, getDoc, collection, addDoc, getDocs,
  query, orderBy, onSnapshot, serverTimestamp, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

if (!eventId) window.location.href = 'index.html';

let currentCapacity = 0;

const eventRef = doc(db, 'events', eventId);
onSnapshot(eventRef, (docSnap) => {
  if (!docSnap.exists()) {
    document.getElementById('eventTitle').textContent = 'Etkinlik bulunamadi';
    return;
  }

  const e = docSnap.data();
  document.getElementById('eventTitle').textContent = e.name;
  document.getElementById('eventPrize').textContent = e.prize;
  document.getElementById('eventDate').textContent = new Date(e.date).toLocaleString('tr-TR');
  document.getElementById('eventDesc').textContent = e.description || '';
  document.getElementById('totalCapacity').textContent = e.capacity;
  document.getElementById('capacityLabel').textContent = e.capacity + ' kisilik kontenjan';
  
  if (e.gameLink) {
    const link = document.getElementById('gameLink');
    link.href = e.gameLink;
    link.style.display = 'inline-block';
  }

  if (e.requirements) {
    document.getElementById('eventRequirements').textContent = 'Gerekenler: ' + e.requirements;
  }

  currentCapacity = e.capacity;
  updateSlots(e.currentParticipants || 0);
});

const participantsQuery = query(collection(db, 'events', eventId, 'participants'), orderBy('registeredAt'));
onSnapshot(participantsQuery, (snapshot) => {
  const count = snapshot.size;
  document.getElementById('playerCount').textContent = count;
  
  const badges = document.getElementById('playerBadges');
  if (snapshot.empty) {
    badges.innerHTML = '<span class="empty-text">Henuz kayit yok</span>';
  } else {
    badges.innerHTML = snapshot.docs.map(doc => {
      const p = doc.data();
      return `<span class="player-tag">${p.roblox} <span class="discord-tag">${p.discord}</span></span>`;
    }).join('');
  }

  updateSlots(count);
  
  if (count >= currentCapacity) {
    document.getElementById('registerBtn').disabled = true;
    document.getElementById('robloxInput').disabled = true;
    document.getElementById('discordInput').disabled = true;
    document.getElementById('fullWarning').style.display = 'block';
  }
});

const announcementsQuery = query(collection(db, 'events', eventId, 'announcements'), orderBy('timestamp', 'desc'));
onSnapshot(announcementsQuery, (snapshot) => {
  const list = document.getElementById('announcementsList');
  if (snapshot.empty) {
    list.innerHTML = '<p class="empty-text">Henuz duyuru yok.</p>';
    return;
  }
  list.innerHTML = snapshot.docs.map(doc => {
    const a = doc.data();
    const date = a.timestamp ? new Date(a.timestamp.toDate()).toLocaleString('tr-TR') : '';
    return `<div class="announcement-item"><p>${a.message}</p><span class="announcement-date">${date}</span></div>`;
  }).join('');
});

function updateSlots(count) {
  const remaining = Math.max(0, currentCapacity - count);
  document.getElementById('remainingSlots').textContent = remaining;
  document.getElementById('progressFill').style.width = Math.min((count / currentCapacity) * 100, 100) + '%';
}

window.register = async function() {
  const roblox = document.getElementById('robloxInput').value.trim();
  const discord = document.getElementById('discordInput').value.trim();
  const msg = document.getElementById('message');

  if (!roblox || roblox.length < 3) {
    msg.textContent = 'Roblox kullanici adi en az 3 karakter olmali.';
    msg.className = 'message error';
    return;
  }
  if (!discord || discord.length < 3) {
    msg.textContent = 'Discord kullanici adi en az 3 karakter olmali.';
    msg.className = 'message error';
    return;
  }

  const existing = await getDocs(collection(db, 'events', eventId, 'participants'));
  const exists = existing.docs.some(doc => {
    const d = doc.data();
    return d.roblox.toLowerCase() === roblox.toLowerCase() || d.discord.toLowerCase() === discord.toLowerCase();
  });

  if (exists) {
    msg.textContent = 'Bu Roblox veya Discord adi zaten kayitli.';
    msg.className = 'message error';
    return;
  }

  try {
    await addDoc(collection(db, 'events', eventId, 'participants'), {
      roblox, discord,
      registeredAt: serverTimestamp()
    });

    await updateDoc(eventRef, { currentParticipants: increment(1) });

    document.getElementById('robloxInput').value = '';
    document.getElementById('discordInput').value = '';
    msg.textContent = '';
    document.getElementById('successModal').style.display = 'flex';
  } catch (error) {
    msg.textContent = 'Hata: ' + error.message;
    msg.className = 'message error';
  }
};

window.closeModal = function(id) {
  document.getElementById(id).style.display = 'none';
};
