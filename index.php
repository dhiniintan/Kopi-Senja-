<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Order - Kopi Senja</title>

  <!-- PWA Manifest & Theme Color (Untuk dukungan install aplikasi di HP) -->
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#4A2E2B">

  <!-- Font Awesome (Digunakan untuk memanggil icon gratis yang mempercantik UI) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <!-- Menghubungkan file HTML ini dengan file CSS untuk styling -->
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- ========================================== -->
  <!-- 1. HEADER & INFORMASI MEJA                 -->
  <!-- ========================================== -->
  <header class="app-header">
    <div class="brand-info">
      <i class="fa-solid fa-mug-hot brand-icon"></i>
      <div>
        <h1 class="brand-title">Kopi Senja</h1>
        <p class="brand-subtitle">Smart Ordering System</p>
      </div>
    </div>
    <!-- Badge Nomor Meja: Angkanya akan diisi otomatis oleh JavaScript membaca link URL (?meja=05) -->
    <div class="table-badge" id="tableBadge">
      <i class="fa-solid fa-chair"></i> Meja: <span id="tableNumberText">-</span>
    </div>
  </header>

  <!-- ========================================== -->
  <!-- 2. NAVIGASI FILTER KATEGORI                -->
  <!-- ========================================== -->
  <nav class="category-nav">
    <!-- Tombol untuk memfilter menu. Data-category digunakan oleh JS untuk mencocokkan kategori -->
    <button class="category-btn active" data-category="semua">
      <i class="fa-solid fa-border-all"></i> Semua
    </button>
    <button class="category-btn" data-category="minuman">
      <i class="fa-solid fa-glass-water"></i> Minuman
    </button>
    <button class="category-btn" data-category="makanan">
      <i class="fa-solid fa-utensils"></i> Makanan
    </button>
  </nav>

  <!-- ========================================== -->
  <!-- 3. AREA KONTEN UTAMA (DAFTAR MENU)         -->
  <!-- ========================================== -->
  <main class="container">
    <!-- Kolom Pencarian -->
    <div class="search-box">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="text" id="searchInput" placeholder="Cari menu favoritmu...">
    </div>

    <!-- Container Grid: Tempat JavaScript menyisipkan kartu-kartu menu dari menu.json -->
    <section class="menu-grid" id="menuGrid">
      <p class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar menu...</p>
    </section>
  </main>

  <!-- ========================================== -->
  <!-- 4. TOMBOL KERANJANG MELAYANG (FLOATING)    -->
  <!-- ========================================== -->
  <!-- Tombol ini muncul di bagian bawah layar saat ada barang di keranjang -->
  <div class="floating-cart hidden" id="floatingCartBtn">
    <div class="cart-info">
      <div class="cart-icon-wrapper">
        <i class="fa-solid fa-basket-shopping"></i>
        <!-- Angka notifikasi jumlah pesanan -->
        <span class="cart-badge" id="cartBadge">0</span> 
      </div>
      <div class="cart-price-preview">
        <span class="label">Total Pesanan</span>
        <span class="total-amount" id="cartTotalPreview">Rp 0</span>
      </div>
    </div>
    <button class="btn-checkout-trigger" id="openCartBtn">Checkout <i class="fa-solid fa-arrow-right"></i></button>
  </div>

  <!-- ========================================== -->
  <!-- 5. MODAL POP-UP KERANJANG & CHECKOUT       -->
  <!-- ========================================== -->
  <div class="modal-overlay hidden" id="cartModal">
    <div class="modal-content">
      
      <!-- Bagian Atas Modal -->
      <div class="modal-header">
        <h2><i class="fa-solid fa-receipt"></i> Rincian Pesanan</h2>
        <button class="close-btn" id="closeCartModal"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <!-- Bagian Isi Modal -->
      <div class="modal-body">
        
        <!-- Area tempat JS merender item-item yang sudah dipilih -->
        <div class="cart-items-list" id="cartItemsList">
          <!-- Item dirender via JS -->
        </div>

        <!-- Form untuk mengumpulkan data pembeli sebelum dikirim ke WA -->
        <form id="checkoutForm" class="checkout-form">
          <div class="form-group">
            <label for="customerName"><i class="fa-solid fa-user"></i> Nama Pemesan *</label>
            <input type="text" id="customerName" placeholder="Masukkan nama Anda..." required>
          </div>

          <div class="form-group">
            <label for="orderNotes"><i class="fa-solid fa-note-sticky"></i> Catatan (Opsional)</label>
            <textarea id="orderNotes" rows="2" placeholder="Contoh: Less ice, jangan terlalu manis..."></textarea>
          </div>

          <!-- Pilihan Metode Pembayaran -->
          <div class="form-group">
            <label><i class="fa-solid fa-wallet"></i> Metode Pembayaran</label>
            <div class="payment-options">
              <label class="payment-card">
                <input type="radio" name="paymentMethod" value="Tunai / Kasir" checked>
                <span><i class="fa-solid fa-money-bill-wave"></i> Tunai di Kasir</span>
              </label>
              <label class="payment-card">
                <input type="radio" name="paymentMethod" value="QRIS">
                <span><i class="fa-solid fa-qrcode"></i> QRIS Instant</span>
              </label>
            </div>
          </div>

          <!-- Area Gambar QRIS (Tersembunyi secara default, akan muncul lewat JS jika pilih QRIS) -->
          <div class="qris-container hidden" id="qrisContainer">
            <p>Scan QRIS di bawah ini untuk membayar:</p>
            <!-- Anda cukup mengganti src ini nanti dengan foto QRIS kafe Anda (bisa diatur manual) -->
            <img id="qrisImage" src="assets/qris-static.jpg" alt="Barcode QRIS" class="qris-img">
            <p class="qris-instruction">Pastikan nominal tagihan sesuai.</p>
          </div>

          <!-- Ringkasan Total Harga -->
          <div class="checkout-summary">
            <span>Total Tagihan:</span>
            <strong id="checkoutTotalText">Rp 0</strong>
          </div>

          <!-- Tombol Aksi Akhir -> Memicu integrasi Link WA -->
          <button type="submit" class="btn-submit-order" id="btnSubmitOrder">
            <i class="fa-brands fa-whatsapp"></i> Kirim Pesanan via WA
          </button>
        </form>

      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- 6. PENGHUBUNG LOGIKA JAVASCRIPT            -->
  <!-- ========================================== -->
  <!-- Semua fungsi interaktif (tambah pesanan, filter, wa link) ada di dalam file ini -->
  <script src="app.js"></script>

</body>
</html>
