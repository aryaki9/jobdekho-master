import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import './App.css';

// Custom cursor with color glow
const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [cursorColor, setCursorColor] = useState('rgba(79, 70, 229, 0.3)');

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.tagName === 'BUTTON' || 
                           target.tagName === 'A' || 
                           target.classList.contains('clickable') ||
                           target.classList.contains('platform-card-new');
      
      setIsHovering(isInteractive);

      // Get accent color from data attribute
      const accentColor = target.getAttribute('data-accent');
      if (accentColor) {
        setCursorColor(accentColor);
      } else {
        setCursorColor('rgba(79, 70, 229, 0.3)');
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <motion.div
        className="cursor-dot"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      />
      <motion.div
        className="cursor-ring"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      />
      <motion.div
        className="cursor-glow"
        animate={{
          x: mousePosition.x - 40,
          y: mousePosition.y - 40,
          opacity: isHovering ? 0.6 : 0,
        }}
        style={{ background: `radial-gradient(circle, ${cursorColor}, transparent)` }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      />
    </>
  );
};

// Platform card with unique accent color
const PlatformCard = ({ number, title, desc, status, url, delay, accentColor, accentName }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const openPlatform = () => {
    if (url) window.open(url, '_blank');
  };

  return (
    <motion.div
      ref={cardRef}
      className={`platform-card-new ${url ? 'clickable' : ''}`}
      data-accent={accentColor}
      onClick={url ? openPlatform : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
    >
      {/* Animated accent border */}
      <motion.div
        className="platform-card-accent-border"
        style={{ 
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
          scaleX: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Hover glow */}
      <motion.div
        className="platform-card-glow"
        style={{
          boxShadow: `0 0 40px ${accentColor}`,
        }}
        animate={{
          opacity: isHovered ? 0.15 : 0,
        }}
        transition={{ duration: 0.4 }}
      />
      
      <div className="platform-card-content">
        <motion.div
          className="platform-number-new"
          animate={{
            x: isHovered ? 4 : 0,
            color: isHovered ? accentColor : 'rgba(255, 255, 255, 0.3)',
          }}
          transition={{ duration: 0.3 }}
        >
          {number}
        </motion.div>
        
        <h3 className="platform-title-new">{title}</h3>
        <p className="platform-desc-new">{desc}</p>
        
        <motion.div className="platform-footer">
          {status ? (
            <span className="platform-status-new">{status}</span>
          ) : (
            <motion.span 
              className="platform-link-new"
              animate={{
                color: isHovered ? accentColor : 'rgba(255, 255, 255, 0.9)',
              }}
              transition={{ duration: 0.3 }}
            >
              Open Platform 
              <motion.span 
                className="arrow"
                animate={{
                  x: isHovered ? 4 : 0,
                  color: isHovered ? accentColor : 'rgba(255, 255, 255, 0.9)',
                }}
                transition={{ duration: 0.3 }}
              >
                →
              </motion.span>
            </motion.span>
          )}
        </motion.div>

        {/* Corner accent dot */}
        <motion.div
          className="platform-accent-dot"
          style={{ background: accentColor }}
          animate={{
            scale: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
      </div>
    </motion.div>
  );
};

function App() {
  const { scrollYProgress } = useScroll();
  const scaleProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="app-new">
      <CustomCursor />

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Scroll progress indicator with color */}
      <motion.div 
        className="scroll-progress" 
        style={{ 
          scaleX: scaleProgress,
          background: 'linear-gradient(90deg, #4F46E5, #6366F1)',
        }} 
      />

      {/* Header */}
      <motion.header
        className="header-new"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container-new">
          <motion.div
            className="logo-new"
            whileHover={{ letterSpacing: '0.1em' }}
            transition={{ duration: 0.3 }}
          >
            UNIFIED
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section with radial glow */}
      <motion.section className="hero-new" style={{ opacity, scale }}>
        {/* Animated radial glow behind headline */}
        <motion.div
          className="hero-glow"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />

        <div className="container-new">
          <div className="hero-content">
            <motion.div
              className="hero-label"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Built for builders. Not resumes.
            </motion.div>

            <motion.h1 className="hero-title-new">
              {['One', 'platform.', 'Three', 'career', 'tools.'].map((word, i) => (
                <motion.span
                  key={i}
                  className={`hero-word ${i === 2 ? 'accent-word' : ''}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word}{' '}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="hero-subtitle-new"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              Resume parsing, freelance opportunities, and AI-powered career
              guidance—unified.
            </motion.p>

            <motion.div
              className="hero-scroll-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <motion.div
                className="scroll-line"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span>Scroll to explore</span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Platforms Section */}
      <section className="platforms-new">
        <div className="container-new">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="section-number"
              initial={{ color: 'rgba(255, 255, 255, 0.3)' }}
              whileInView={{ color: '#4F46E5' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              001
            </motion.div>
            <h2 className="section-title-new">Ecosystem</h2>
          </motion.div>

          <div className="platforms-grid-new">
            <PlatformCard
              number="01"
              title="Resume Parser"
              desc="Extract structured data from any resume format. Instant profile creation powered by AI."
              status="Coming Soon"
              url={null}
              delay={0}
              accentColor="rgba(99, 102, 241, 0.6)"
              accentName="blue"
            />
            <PlatformCard
              number="02"
              title="Freelance Marketplace"
              desc="Connect with clients. Showcase work. Build your professional network in a focused environment."
              url="http://localhost:3002"
              delay={0.1}
              accentColor="rgba(14, 165, 164, 0.6)"
              accentName="teal"
            />
            <PlatformCard
              number="03"
              title="Career Copilot"
              desc="AI-driven learning paths. Track progress. Master new skills systematically with personalized guidance."
              url="http://localhost:3003"
              delay={0.2}
              accentColor="rgba(245, 158, 11, 0.6)"
              accentName="amber"
            />
          </div>
        </div>
      </section>

      {/* Philosophy Section with color reveal */}
      <section className="philosophy">
        <div className="container-new">
          <motion.div
            className="philosophy-content"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-200px' }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="philosophy-line"
              initial={{ scaleX: 0, background: 'rgba(255, 255, 255, 0.2)' }}
              whileInView={{ 
                scaleX: 1,
                background: 'linear-gradient(to right, transparent, rgba(79, 70, 229, 0.4), transparent)',
              }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <h3 className="philosophy-text">
              We believe career tools should be <motion.em
                initial={{ color: 'rgba(255, 255, 255, 0.9)' }}
                whileInView={{ color: '#4F46E5' }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >focused</motion.em>, not bloated.
              <br />
              Each platform does one thing exceptionally well.
            </h3>
            <motion.div 
              className="philosophy-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />
          </motion.div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="architecture">
        <div className="container-new">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="section-number"
              initial={{ color: 'rgba(255, 255, 255, 0.3)' }}
              whileInView={{ color: '#4F46E5' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              002
            </motion.div>
            <h2 className="section-title-new">Architecture</h2>
          </motion.div>

          <div className="architecture-grid">
            {[
              {
                title: 'Independent Services',
                desc: 'Each platform runs on its own port with dedicated authentication and database.',
              },
              {
                title: 'Modular Design',
                desc: 'Add, remove, or scale services without affecting the ecosystem.',
              },
              {
                title: 'Future-Ready',
                desc: 'Built for expansion with new career tools and integrations.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="architecture-card"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ borderColor: 'rgba(79, 70, 229, 0.3)' }}
              >
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-new">
        <div className="container-new">
          <div className="footer-content-new">
            <div className="footer-brand-new">UNIFIED</div>
            <div className="footer-tagline">College Project · 2025</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;