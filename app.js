/* =========================================================
   1. VARIABEL GLOBAL & INISIALISASI ELEMEN DOM
========================================================= */
let menuData = []; // Tempat menyimpan data menu dari JSON
let cart = JSON.parse(localStorage.getItem('kopiSenjaCart')) || []; // Ambil keranjang dari localStorage jika ada

// Menangkap elemen HTML yang akan kita manipulasi
const menuGrid = document.getElementById('menuGrid');
const tableNumberText = document.getElementById('tableNumberText');
const categoryBtns = document.querySelectorAll('.category-btn');

// Elemen Keranjang & Modal
const floatingCartBtn = document.getElementById('floatingCartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartTotalPreview = document.getElementById('cartTotalPreview');
const cartModal = document.getElementById('cartModal');
const closeCartModal = document.getElementById('closeCartModal');
const cartItemsList = document.getElementById('cartItemsList');
const openCartBtn = document.getElementById('openCartBtn');
const checkoutTotalText = document.getElementById('checkoutTotalText');

// Elemen Checkout
const checkoutForm = document.getElementById('checkoutForm');
const paymentRadios = document.getElementsByName('paymentMethod');
const qrisContainer = document.getElementById('qrisContainer');

/* =========================================================
   2. DETEKSI NOMOR MEJA DARI URL
========================================================= */
// Fungsi ini membaca link URL (misal: websitemu.github.io/?meja=05)
function getTableNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  const meja = urlParams.get('meja');
  if (meja) {
    tableNumberText.innerText = meja;
    localStorage.setItem('kopiSenjaTable', meja); // Simpan agar tidak hilang
  } else {
    // Jika tidak ada parameter, cek di memori sebelumnya
    const savedTable = localStorage.getItem('kopiSenjaTable');
    tableNumberText.innerText = savedTable ? savedTable : 'Kasir';
  }
}

/* =========================================================
   3. MEMUAT DATA MENU (FETCH API)
========================================================= */
async function loadMenu() {
  try {
    const response = await fetch('data/menu.json');
    menuData = await response.json();
    renderMenu('semua'); // Tampilkan semua menu saat pertama kali buka
  } catch (error) {
    menuGrid.innerHTML = '<p class="loading-text">Gagal memuat menu. Periksa koneksi internet Anda.</p>';
    console.error("Error loading menu:", error);
  }
}

/* =========================================================
   4. MENAMPILKAN MENU KE LAYAR
========================================================= */
function renderMenu(kategori) {
  menuGrid.innerHTML = ''; // Kosongkan area grid dulu
  
  // Filter menu berdasarkan tombol kategori yang diklik
  const filteredMenu = kategori === 'semua' 
    ? menuData 
    : menuData.filter(item => item.kategori === kategori);

  filteredMenu.forEach(item => {
    // Membuat kartu menu untuk tiap item
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
      <img src="${item.gambar}" alt="${item.nama}" class="menu-img">
      <div class="menu-content">
        <div class="menu-title">${item.nama}</div>
        <div class="menu-price">Rp ${item.harga.toLocaleString('id-ID')}</div>
        <!-- Tombol tambah akan memanggil fungsi addToCart -->
        <button class="btn-add" onclick="addToCart('${item.id}')">
          <i class="fa-solid fa-plus"></i> Tambah
        </button>
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

/* =========================================================
   5. LOGIKA FILTER KATEGORI & PENCARIAN
========================================================= */
categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Hapus warna aktif dari semua tombol, lalu aktifkan yang diklik
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Tampilkan menu sesuai kategori
    const selectedCategory = btn.getAttribute('data-category');
    renderMenu(selectedCategory);
  });
});

// Fitur Pencarian Sederhana
document.getElementById('searchInput').addEventListener('input', (e) => {
  const keyword = e.target.value.toLowerCase();
  const searchResult = menuData.filter(item => item.nama.toLowerCase().includes(keyword));
  
  menuGrid.innerHTML = '';
  searchResult.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
      <img src="${item.gambar}" alt="${item.nama}" class="menu-img">
      <div class="menu-content">
        <div class="menu-title">${item.nama}</div>
        <div class="menu-price">Rp ${item.harga.toLocaleString('id-ID')}</div>
        <button class="btn-add" onclick="addToCart('${item.id}')">
          <i class="fa-solid fa-plus"></i> Tambah
        </button>
      </div>
    `;
    menuGrid.appendChild(card);
  });
});

/* =========================================================
   6. LOGIKA KERANJANG BELANJA (CART)
========================================================= */
function addToCart(id) {
  const item = menuData.find(m => m.id === id);
  const existingItem = cart.find(c => c.id === id);

  if (existingItem) {
    existingItem.qty += 1; // Jika barang sudah ada, tambah jumlahnya
  } else {
    cart.push({ ...item, qty: 1 }); // Jika belum ada, masukkan ke keranjang
  }
  
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(c => c.id !== id); // Hapus barang jika jumlahnya 0
    }
    updateCartUI();
  }
}

function updateCartUI() {
  // Simpan data keranjang ke memori browser
  localStorage.setItem('kopiSenjaCart', JSON.stringify(cart));

  // Hitung total harga dan jumlah barang
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);

  // Tampilkan/Sembunyikan tombol keranjang melayang
  if (totalItems > 0) {
    floatingCartBtn.classList.remove('hidden');
  } else {
    floatingCartBtn.classList.add('hidden');
    cartModal.classList.add('hidden'); // Tutup modal jika keranjang kosong
  }

  // Update teks di UI
  cartBadge.innerText = totalItems;
  cartTotalPreview.innerText = `Rp ${totalPrice.toLocaleString('id-ID')}`;
  checkoutTotalText.innerText = `Rp ${totalPrice.toLocaleString('id-ID')}`;

  // Render isi keranjang di dalam Modal Checkout
  cartItemsList.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-title">${item.nama}</div>
        <div class="cart-item-price">Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
    `;
    cartItemsList.appendChild(div);
  });
}

/* =========================================================
   7. INTERAKSI MODAL & PILIHAN PEMBAYARAN
========================================================= */
openCartBtn.addEventListener('click', () => cartModal.classList.remove('hidden'));
closeCartModal.addEventListener('click', () => cartModal.classList.add('hidden'));

// Tampilkan/Sembunyikan gambar QRIS tergantung pilihan metode bayar
paymentRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.value === 'QRIS') {
      qrisContainer.classList.remove('hidden');
    } else {
      qrisContainer.classList.add('hidden');
    }
  });
});

/* =========================================================
   8. PROSES CHECKOUT & KIRIM KE WHATSAPP
========================================================= */
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Mencegah halaman refresh saat submit form
  
  const customerName = document.getElementById('customerName').value;
  const orderNotes = document.getElementById('orderNotes').value;
  const meja = tableNumberText.innerText;
  
  // Cari metode pembayaran yang dipilih
  let paymentMethod = 'Tunai / Kasir';
  paymentRadios.forEach(r => { if(r.checked) paymentMethod = r.value; });

  const totalPrice = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);

  // Merangkai Daftar Pesanan
  let orderDetails = '';
  cart.forEach(item => {
    orderDetails += `- ${item.qty}x ${item.nama} (Rp ${(item.harga * item.qty).toLocaleString('id-ID')})\n`;
  });

  // GANTI NOMOR INI DENGAN NOMOR WA KASIR/DAPUR (Gunakan format 62...)
  const nomorWhatsApp = "6283111778038"; 

  // Merangkai Format Pesan untuk WhatsApp
  const textMessage = 
`*PESANAN BARU | KOPI SENJA*
-----------------------------------
*Meja:* ${meja}
*Nama:* ${customerName}
*Metode Bayar:* ${paymentMethod}

*Rincian Pesanan:*
${orderDetails}
*Catatan Tambahan:* ${orderNotes ? orderNotes : '-'}

-----------------------------------
*TOTAL TAGIHAN: Rp ${totalPrice.toLocaleString('id-ID')}*`;

  // Kosongkan keranjang setelah pesanan dibuat
  cart = [];
  updateCartUI();
  localStorage.removeItem('kopiSenjaCart'); // Bersihkan memori localStorage
  cartModal.classList.add('hidden'); // Tutup modal

  // Arahkan pembeli ke WhatsApp dengan pesan yang sudah terisi otomatis
  const waLink = `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(textMessage)}`;
  window.open(waLink, '_blank');
});

/* =========================================================
   9. JALANKAN SAAT HALAMAN PERTAMA KALI DIBUKA
========================================================= */
getTableNumber();
loadMenu();
updateCartUI(); // Update UI keranjang jika ternyata ada sisa data di memori
