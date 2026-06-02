# FaturaTakip — Netlify Kurulum Kılavuzu

## Dosyalar
- `index.html` — Ana uygulama
- `style.css` — Stiller
- `app.js` — Uygulama mantığı
- `netlify.toml` — Netlify yapılandırması

## Netlify'e Yükleme (Ücretsiz, 7/24 Erişim)

### Yöntem 1: Sürükle-Bırak (En Kolay)
1. https://app.netlify.com adresine gidin
2. Ücretsiz hesap açın (e-posta ile)
3. "Sites" sekmesinde **"Deploy manually"** veya **"drag and drop"** alanına
   bu `fatura-takip` klasörünü sürükleyin
4. 30 saniye içinde `https://xxxxxxxx.netlify.app` adresiniz hazır!
5. İsterseniz **Site settings → Change site name** ile özel isim verin
   (örn: `benim-fatura-takip.netlify.app`)

### Yöntem 2: GitHub ile (Otomatik Güncelleme)
1. GitHub'a ücretsiz hesap açın: https://github.com
2. Yeni repository oluşturun (örn: `fatura-takip`)
3. Bu 4 dosyayı yükleyin
4. Netlify → "New site from Git" → GitHub → Repo seçin
5. Build settings boş bırakın, "Deploy site" tıklayın
6. Sonrasında GitHub'a push ettiğinizde site otomatik güncellenir

## Özellikler
- ✅ Fatura oluşturma, düzenleme, silme
- ✅ Ödeme kaydetme (nakit, havale, kredi kartı, çek)
- ✅ Müşteri yönetimi
- ✅ Otomatik gecikmiş fatura tespiti
- ✅ Dashboard ile özet görünüm
- ✅ Aylık gelir grafiği
- ✅ Detaylı raporlar
- ✅ JSON ile yedek alma / geri yükleme
- ✅ Mobil uyumlu tasarım
- ✅ Tüm veriler tarayıcıda (localStorage) saklanır — sunucu gerekmez

## Önemli Not
Veriler **tarayıcının localStorage**'ında saklanır.
Düzenli olarak "Dışa Aktar" butonuyla JSON yedeği alın!
Farklı cihazlardan erişim için yedek alıp "İçe Aktar" ile aktarabilirsiniz.
