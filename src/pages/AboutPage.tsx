export function AboutPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8 text-sm leading-relaxed text-neutral-600">
      <h1 className="text-2xl font-bold text-brand-700">Hakkında</h1>

      <p>
        Bu uygulama, market veya mağazada bir ürünün barkodunu okutarak içeriğini hızlıca kontrol
        etmenizi sağlar: içindekiler, besin değerleri, alerjenler, katkı maddeleri ve seçtiğiniz
        hassasiyetlere göre kişisel bir uygunluk skoru gösterir.
      </p>

      <h2 className="font-semibold text-neutral-800">Veri Kaynağı</h2>
      <p>
        Ürün verileri, açık ve topluluk tarafından desteklenen{' '}
        <a
          href="https://world.openfoodfacts.org"
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 underline"
        >
          Open Food Facts
        </a>{' '}
        veritabanından çekilir. Veritabanında bulunmayan ürünler için kullanıcılar manuel ürün
        ekleme formuyla katkıda bulunabilir.
      </p>

      <h2 className="font-semibold text-neutral-800">Önemli Uyarı</h2>
      <p>
        Bu uygulama <strong>tıbbi veya beslenme tavsiyesi vermez</strong>. Gösterilen alerjen
        uyarıları, katkı maddesi açıklamaları ve uygunluk skoru sadece bilgilendirme amaçlıdır ve
        kesin/sertifikalı bir değerlendirme değildir. Gerçek kullanımda ürünün kendi etiketini ve
        gerektiğinde bir sağlık uzmanının görüşünü esas alın.
      </p>

      <h2 className="font-semibold text-neutral-800">Verileriniz</h2>
      <p>
        Hassasiyet profiliniz, tarama geçmişiniz ve favorileriniz bu uygulamanın şu anki
        sürümünde yalnızca kendi cihazınızda (tarayıcı depolamasında) saklanır; bir sunucuya
        gönderilmez ve hesap oluşturmanız gerekmez. Uygulama, barkod taramak için kamera erişimi
        ister; kamera görüntüsü cihazınızdan dışarı gönderilmez.
      </p>
    </div>
  );
}
