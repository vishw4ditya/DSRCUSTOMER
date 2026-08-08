import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// EDIT ME: add/remove/reorder slides here. Each needs an `image` path (under
// /public, e.g. "/my-photo.jpg") and an `alt` description for accessibility.
// ---------------------------------------------------------------------------
const SLIDES = [
  { image: '/ro-purifier-1.jpg', alt: 'Mahindra Zone Advance Digital Water Filter - front view' },
  { image: '/ro-purifier-2.jpg', alt: 'Mahindra Zone Advance Digital Water Filter - side view' },
];

const AUTO_ADVANCE_MS = 4000;

export default function HeroImageSlider() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const goTo = (i) => setIndex((i + SLIDES.length) % SLIDES.length);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTO_ADVANCE_MS);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restart the auto-advance countdown whenever the person manually changes slides,
  // so it doesn't jump again right after they just picked one.
  const handleManualChange = (fn) => {
    fn();
    startTimer();
  };

  if (SLIDES.length === 1) {
    return (
      <div className="home-hero-slider">
        <img src={SLIDES[0].image} alt={SLIDES[0].alt} className="home-hero-slide-img active" />
      </div>
    );
  }

  return (
    <div className="home-hero-slider" onMouseEnter={() => clearInterval(timerRef.current)} onMouseLeave={startTimer}>
      {SLIDES.map((slide, i) => (
        <img
          key={slide.image}
          src={slide.image}
          alt={slide.alt}
          className={`home-hero-slide-img ${i === index ? 'active' : ''}`}
        />
      ))}

      <button
        type="button"
        className="hero-slider-arrow hero-slider-arrow-prev"
        onClick={() => handleManualChange(prev)}
        aria-label="Previous image"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        className="hero-slider-arrow hero-slider-arrow-next"
        onClick={() => handleManualChange(next)}
        aria-label="Next image"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="hero-slider-dots">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            className={`hero-slider-dot ${i === index ? 'active' : ''}`}
            onClick={() => handleManualChange(() => goTo(i))}
            aria-label={`Show image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
