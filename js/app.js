import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const GAMES = {
  obby: 'Obby (Parkur)',
  tycoon: 'Tycoon',
  simulator: 'Simulator',
  horror: 'Horror',
  pvp: 'PvP / Fighting',
  racing: 'Racing',
  custom: 'Ozel / Diger'
};

const q = query(
  collection(db, 'events'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc')
);

onSnapshot(q, (snapshot) => {
  const grid = document.getElementById('eventsGrid');
  
  if (snapshot.empty) {
    grid.innerHTML = '<div class="empty-state"><p>Henuz aktif etkinlik yok.</p><p>Yakinda yeni etkinlikler eklenecek.</p></div>';
    return;
  }

  grid.innerHTML = snapshot.docs.map(doc => {
    const e = doc.data();
    const remaining = e.capacity - (e.currentParticipants || 0);
    const gameName = GAMES[e.game] || e.game || 'Belirtilmemis';
    
    return `
      <a href="event.html?id=${doc.id}" class="event-card">
        <div class="event-card-header">
          <span class="event-game">${gameName}</span>
          <span class="event-status active">Aktif</span>
        </div>
        <h3>${e.name}</h3>
        <div class="event-prize">${e.prize}</div>
        <div class="event-meta">
          <span>${new Date(e.date).toLocaleDateString('tr-TR')}</span>
          <span>${remaining} bos yer</span>
        </div>
        <div class="event-capacity-bar">
          <div class="event-capacity-fill" style="width:${((e.currentParticipants||0)/e.capacity)*100}%"></div>
        </div>
      </a>
    `;
  }).join('');
});

window.showModal = function(id) {
  document.getElementById(id).style.display = 'flex';
};

window.closeModal = function(id) {
  document.getElementById(id).style.display = 'none';
};

if (localStorage.getItem('openModal')) {
  setTimeout(() => {
    const modal = localStorage.getItem('openModal') + 'Modal';
    if (document.getElementById(modal)) {
      document.getElementById(modal).style.display = 'flex';
    }
    localStorage.removeItem('openModal');
  }, 500);
}
