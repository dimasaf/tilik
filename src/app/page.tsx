export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-content" aria-labelledby="home-title">
        <a className="wordmark" href="/" aria-label="Tilikstory home">
          <span className="wordmark-mark" aria-hidden="true">T</span>
          <span>Tilikstory</span>
        </a>
        <p className="eyebrow">UNDANGAN DIGITAL, DENGAN CERITA</p>
        <h1 id="home-title">Hari penting layak punya cerita.</h1>
        <p className="home-description">
          Siapkan ruang untuk merayakan momen bersama orang-orang yang berarti.
          Mulai dengan akun Tilikstory Anda.
        </p>
        <div className="home-actions">
          <a className="primary-link" href="/register">Buat akun</a>
          <a className="secondary-link" href="/sign-in">Masuk</a>
        </div>
      </section>
      <aside className="home-art" aria-label="Ilustrasi abstrak perayaan">
        <div className="home-art-caption">
          <span>CATATAN 01</span>
          <p>Hal-hal kecil yang<br />membuat hari besar.</p>
        </div>
      </aside>
    </main>
  );
}
