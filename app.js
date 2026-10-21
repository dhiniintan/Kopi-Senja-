/* =========================================================
   1. VARIABEL GLOBAL & PENGHUBUNG ELEMEN HTML
========================================================= */
let menuData = []; // Wadah kosong untuk menyimpan data dari menu.json

// Mengambil data keranjang dari memori browser (localStorage) jika ada. 
// Jika kosong/baru pertama kali buka, kita atur sebagai array kosong [].
let cart = JSON.parse(localStorage.getItem('kopiSenjaCart')) || [];

// Mengambil elemen-elemen dari HTML berdasarkan ID-nya agar bisa dikendalikan oleh JS
const menuGrid = document.getElementById('menuGrid');
const tableSelect = document.getElementById('tableSelect'); // Dropdown nomor meja
const categoryBtns = document.querySelectorAll('.category-btn');

// Elemen-elemen yang berkaitan dengan Keranjang & Checkout
const floatingCartBtn = document.getElementById('floatingCartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartTotalPreview = document.getElementById('cartTotalPreview');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartModal = document.getElementById('closeCartModal');
const cartItemsList = document.getElementById('cartItemsList');
const openCartBtn = document.getElementById('openCartBtn');
const checkoutTotalText = document.getElementById('checkoutTotalText');
const checkoutForm = document.getElementById('checkoutForm');
const paymentRadios = document.getElementsByName('paymentMethod');


/* =========================================================
   2. SISTEM DETEKSI NOMOR MEJA
========================================================= */
function setupTableNumber() {
  // Membaca link URL (Contoh: webmu.github.io/?meja=5)
  const urlParams = new URLSearchParams(window.location.search);
  let mejaURL = urlParams.get('meja'); 
  
  // Mengecek apakah sebelumnya user sudah pernah memilih meja (tersimpan di memori)
  const savedTable = localStorage.getItem('kopiSenjaTable');

  // Jika pelanggan scan QR code di meja (URL punya angka 1-10)
  if (mejaURL && mejaURL >= 1 && mejaURL <= 10) {
    tableSelect.value = mejaURL; // Set dropdown otomatis
    localStorage.setItem('kopiSenjaTable', mejaURL); // Simpan ke memori
  } 
  // Jika buka web tanpa scan QR, tapi sebelumnya sudah pilih meja
  else if (savedTable) {
    tableSelect.value = savedTable;
  }
}

// Jika pengguna iseng mengubah pilihan meja secara manual di dropdown
tableSelect.addEventListener('change', (e) => {
  localStorage.setItem('kopiSenjaTable', e.target.value); // Perbarui data di memori
});


/* =========================================================
   3. MENGAMBIL DATA MENU (FETCH API DARI menu.json)
========================================================= */
async function loadMenu() {
  try {
    // Meminta data ke file menu.json
    const response = await fetch('data/menu.json');
    menuData = await response.json(); // Mengubah teks JSON menjadi format Array Javascript
    
    renderMenu('semua'); // Tampilkan semua kategori saat pertama kali dimuat
  } catch (error) {
    // Jika gagal (misal file tidak ditemukan atau koneksi putus)
    menuGrid.innerHTML = '<p class="loading-text">Gagal memuat menu. Periksa koneksi internet.</p>';
    console.error("Error loading menu:", error);
  }
}


/* =========================================================
   4. MENAMPILKAN MENU KE LAYAR UTAMA
========================================================= */
function renderMenu(kategori) {
  menuGrid.innerHTML = ''; // Kosongkan area grid sebelum diisi ulang
  
  // Menyaring data: Jika kategori 'semua', ambil semua data. Jika tidak, saring sesuai kategori.
  const filteredMenu = kategori === 'semua' 
    ? menuData 
    : menuData.filter(item => item.kategori === kategori);

  // Perulangan: Membuat elemen HTML (kartu menu) untuk setiap item yang disaring
  filteredMenu.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    
    // onerror="..." adalah pelindung. Jika gambar di folder pict/ gagal dimuat, akan muncul gambar abu-abu.
    card.innerHTML = `
      <img src="${item.gambar}" alt="${item.nama}" class="menu-img" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
      <div class="menu-content">
        <div class="menu-title">${item.nama}</div>
        <div class="menu-price">Rp ${item.harga.toLocaleString('id-ID')}</div>
        <button class="btn-add" onclick="addToCart('${item.id}')">Tambah</button>
      </div>
    `;
    menuGrid.appendChild(card); // Masukkan kartu ini ke dalam grid HTML
  });
}


/* =========================================================
   5. LOGIKA FILTER KATEGORI & PENCARIAN
========================================================= */
// Memberi fungsi klik pada setiap tombol kategori di atas
categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Hapus class 'active' dari semua tombol, lalu tambahkan hanya di tombol yang sedang diklik
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Tampilkan menu berdasarkan data-category milik tombol tersebut
    renderMenu(btn.getAttribute('data-category'));
  });
});

// Fitur live-search (Pencarian otomatis saat mengetik)
document.getElementById('searchInput').addEventListener('input', (e) => {
  const keyword = e.target.value.toLowerCase(); // Ambil teks yang diketik, ubah ke huruf kecil
  
  // Cari menu yang namanya mengandung kata kunci tersebut
  const searchResult = menuData.filter(item => item.nama.toLowerCase().includes(keyword));
  
  // Kosongkan grid dan isi dengan hasil pencarian (Logika yang sama seperti renderMenu)
  menuGrid.innerHTML = '';
  searchResult.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `<img src="${item.gambar}" class="menu-img" onerror="this.src='https://via.placeholder.com/150?text=No+Image'"><div class="menu-content"><div class="menu-title">${item.nama}</div><div class="menu-price">Rp ${item.harga.toLocaleString('id-ID')}</div><button class="btn-add" onclick="addToCart('${item.id}')">Tambah</button></div>`;
    menuGrid.appendChild(card);
  });
});


/* =========================================================
   6. LOGIKA KERANJANG BELANJA (CART)
========================================================= */
// Fungsi untuk memasukkan barang ke keranjang
window.addToCart = function(id) {
  const item = menuData.find(m => m.id === id); // Cari detail barang dari menuData
  const existingItem = cart.find(c => c.id === id); // Cek apakah barang ini sudah ada di keranjang

  if (existingItem) {
    existingItem.qty += 1; // Jika sudah ada, cukup tambah jumlahnya (Quantity)
  } else {
    cart.push({ ...item, qty: 1 }); // Jika belum ada, tambahkan barang baru dengan jumlah 1
  }
  
  updateCartUI(); // Segarkan tampilan layar
}

// Fungsi untuk menambah atau mengurangi jumlah barang dari dalam keranjang
window.changeQty = function(id, delta) {
  const item = cart.find(c => c.id === id);
  if (item) {
    item.qty += delta; // delta bisa berisi angka 1 (tambah) atau -1 (kurang)
    
    // Jika jumlah barang jadi 0 atau minus, hapus barang dari keranjang
    if (item.qty <= 0) {
      cart = cart.filter(c => c.id !== id); 
    }
    updateCartUI(); // Segarkan tampilan layar
  }
}

// Fungsi paling penting: Mengubah antarmuka (UI) setiap kali keranjang diubah
function updateCartUI() {
  // 1. Simpan kondisi keranjang terbaru ke memori HP/Laptop
  localStorage.setItem('kopiSenjaCart', JSON.stringify(cart));

  // 2. Hitung total jumlah barang dan total harga
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);

  // 3. Tampilkan atau sembunyikan tombol keranjang melayang (khusus HP)
  if (totalItems > 0) {
    floatingCartBtn.classList.remove('hidden');
  } else {
    floatingCartBtn.classList.add('hidden');
  }

  // 4. Perbarui angka-angka di layar HTML
  cartBadge.innerText = totalItems;
  cartTotalPreview.innerText = `Rp ${totalPrice.toLocaleString('id-ID')}`;
  checkoutTotalText.innerText = `Rp ${totalPrice.toLocaleString('id-ID')}`;

  // 5. Cetak ulang daftar barang yang ada di dalam Sidebar Keranjang
  cartItemsList.innerHTML = '';
  cart.forEach(item => {
    cartItemsList.innerHTML += `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="menu-title">${item.nama}</div>
          <div class="menu-price">Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `;
  });
}


/* =========================================================
   7. ANIMASI BUKA/TUTUP KERANJANG DI HP
========================================================= */
// Tombol melayang diklik -> Buka panel keranjang dari bawah
openCartBtn.addEventListener('click', () => {
  cartSidebar.classList.add('open');
  cartOverlay.classList.remove('hidden');
});

// Tombol silang (X) diklik -> Tutup panel
closeCartModal.addEventListener('click', () => {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.add('hidden');
});

// Area gelap di luar keranjang diklik -> Tutup panel juga
cartOverlay.addEventListener('click', () => {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.add('hidden');
});


/* =========================================================
   8. PROSES CHECKOUT & PENGIRIMAN KE WHATSAPP
========================================================= */
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Mencegah halaman web melakukan reload/refresh bawaan form
  
  const meja = tableSelect.value;
  // Validasi: Cegah checkout jika nomor meja belum dipilih
  if (!meja) {
    alert("Mohon pilih Nomor Meja (1-10) di bagian atas layar terlebih dahulu!");
    tableSelect.focus(); // Arahkan layar ke dropdown meja
    return; // Hentikan proses eksekusi kode di bawahnya
  }

  // Mengambil data dari inputan pelanggan
  const customerName = document.getElementById('customerName').value;
  const orderNotes = document.getElementById('orderNotes').value;
  
  // Mencari metode pembayaran mana yang sedang dipilih (Tunai / QRIS)
  let paymentMethod = 'Tunai';
  paymentRadios.forEach(radio => { if(radio.checked) paymentMethod = radio.value; });
  
  const totalPrice = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);

  // Merangkai teks rincian belanjaan
  let orderDetails = '';
  cart.forEach(item => {
    orderDetails += `- ${item.qty}x ${item.nama} (Rp ${(item.harga * item.qty).toLocaleString('id-ID')})\n`;
  });

  // NOMOR WHATSAPP KASIR/DAPUR (Ganti dengan nomor aslimu, format awalan 62)
  const nomorWhatsApp = "6281234567890"; 

  // Format bentuk pesan template yang akan muncul di WhatsApp
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

  // SETELAH PESANAN SUKSES: Bersihkan keranjang
  cart = [];
  updateCartUI(); // Perbarui tampilan agar kosong
  localStorage.removeItem('kopiSenjaCart'); // Hapus data keranjang di memori
  cartSidebar.classList.remove('open'); // Tutup keranjang
  cartOverlay.classList.add('hidden'); // Tutup background gelap

  // Buka tab baru menuju WhatsApp Web / Aplikasi WA HP
  // encodeURIComponent berfungsi menerjemahkan spasi/enter menjadi kode URL yang sah
  window.open(`https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(textMessage)}`, '_blank');
});


/* =========================================================
   9. INISIALISASI SAAT HALAMAN PERTAMA KALI DIBUKA
========================================================= */
setupTableNumber(); // Atur nomor meja
loadMenu();         // Ambil dan tampilkan menu
updateCartUI();     // Tampilkan status keranjang terakhir (jika ada sisa pesanan sebelumnya)
