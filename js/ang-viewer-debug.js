// js/ang-viewer-debug.js - Debug version to see API response
(function () {
  'use strict';

  // ============ Utilities ============
  function qsAng() {
    const p = new URLSearchParams(location.search).get('ang');
    const h = location.hash.replace(/^#ang=/, '');
    const ang = parseInt(p || h || '', 10);
    return (ang >= 1 && ang <= 1430) ? ang : null;
  }

  function clamp(n) {
    return Math.max(1, Math.min(1430, Math.round(n || 1)));
  }

  // ============ Main Ang Viewer ============
  async function boot() {
    const elContainer = document.getElementById('gurbani-container');
    if (!elContainer) return;

    // Initialize API
    const api = new window.GurbaniAPI();

    // Get current ang
    let ang = qsAng();
    if (!ang) {
      try {
        ang = parseInt(localStorage.getItem('lastAng'), 10);
      } catch(_) {}
      ang = (ang >= 1 && ang <= 1430) ? ang : 1;
    }

    // Update UI
    const inputEl = document.getElementById('ang-input');
    if (inputEl) inputEl.value = ang;

    // Load ang content
    await loadAng(ang, api, elContainer);
    
    // Bind toolbar controls
    bindAngToolbar();
  }

  async function loadAng(ang, api, elContainer) {
    try {
      elContainer.innerHTML = '<div class="loading">Loading Ang ' + ang + '...</div>';
      
      const data = await api.getAng(ang);
      
      // DEBUG: Log the full API response
      console.log('Full API Response:', data);
      
      // Find lines array
      let lines = null;
      if (Array.isArray(data)) {
        lines = data;
      } else if (data && typeof data === 'object') {
        // Check all possible paths
        console.log('Checking data.lines:', data.lines);
        console.log('Checking data.page:', data.page);
        console.log('Checking data.verses:', data.verses);
        console.log('Checking data.source:', data.source);
        
        lines = data.lines || data.page || data.verses || data.data || null;
        if (!lines && data.source && Array.isArray(data.source.page)) {
          lines = data.source.page;
        }
      }

      console.log('Found lines array:', lines);

      if (!Array.isArray(lines) || lines.length === 0) {
        elContainer.innerHTML = '<div class="error">No content found for Ang ' + ang + '</div>';
        return;
      }

      // Log first line structure
      console.log('First line structure:', lines[0]);
      if (lines[0] && lines[0].verse) {
        console.log('First line verse structure:', lines[0].verse);
      }

      // Render lines
      const html = lines.map((line, index) => {
        const gurmukhiId = 'gurmukhi-' + (line.id || Math.random().toString(36).substr(2));
        
        // Get the actual Gurmukhi text from the verse object
        let gurmukhi = '';
        let transliteration = '';
        
        // Log each line to debug
        if (index < 3) { // Only log first 3 lines
          console.log(`Line ${index} structure:`, line);
        }
        
        // Handle different API response structures
        if (line.verse && typeof line.verse === 'object') {
          gurmukhi = line.verse.unicode || line.verse.gurmukhi || '';
          transliteration = line.verse.transliteration || line.verse.pronunciation || '';
          console.log(`Line ${index} - Found verse.unicode:`, line.verse.unicode);
        } else if (typeof line === 'object') {
          gurmukhi = line.unicode || line.gurmukhi || line.text || '';
          transliteration = line.transliteration || line.pronunciation || '';
          console.log(`Line ${index} - Found direct unicode:`, line.unicode);
        }
        
        // If still no gurmukhi text, log what we have
        if (!gurmukhi) {
          console.warn('No Gurmukhi text found for line:', line);
          return '';
        }

        const words = gurmukhi.split(' ').filter(w => w);
        const gurmukhiHTML = words.map((word, idx) => 
          `<span class="gurmukhi-word" data-word-index="${idx}">${word}</span>`
        ).join(' ');

        return `
          <div class="gurbani-line" data-line-id="${line.id || ''}">
            <div class="g-line-text gurbani-font" id="${gurmukhiId}">${gurmukhiHTML}</div>
            ${transliteration ? `<div class="g-line-translit">${transliteration}</div>` : ''}
          </div>
        `;
      }).join('');

      elContainer.innerHTML = `
        <div class="ang-header">
          <h2>Ang ${ang}</h2>
        </div>
        <div class="gurbani-lines">${html}</div>
      `;

      // Initialize meaning boxes for words
      if (window.initMeaningBoxes) {
        window.initMeaningBoxes(lines);
      }

      // Save last viewed ang
      try { 
        localStorage.setItem('lastAng', String(ang)); 
      } catch(_) {}

    } catch (err) {
      console.error('[ang] load error', err);
      elContainer.innerHTML = '<div class="error">Error loading Ang. Please try again.</div>';
    }
  }

  // ============ Toolbar Controls ============
  function bindAngToolbar() {
    const prev = document.getElementById('prev-ang');
    const next = document.getElementById('next-ang');
    const go = document.getElementById('go-ang');
    const input = document.getElementById('ang-input');
    
    if (!prev || !next || !go || !input) return;
    
    // Prevent double binding
    if (prev.__bound) return;

    function navigate(to) {
      to = clamp(+to || 1);
      try { 
        localStorage.setItem('lastAng', String(to)); 
      } catch(_) {}
      location.href = 'ang.html?ang=' + to + '#ang=' + to;
    }

    const getCurrentAng = () => qsAng() || (+input.value || 1);

    prev.addEventListener('click', () => navigate(Math.max(1, getCurrentAng() - 1)));
    next.addEventListener('click', () => navigate(Math.min(1430, getCurrentAng() + 1)));
    go.addEventListener('click', () => navigate(+input.value || 1));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigate(+input.value || 1);
      }
    });

    // Mark as bound
    prev.__bound = next.__bound = go.__bound = input.__bound = true;
  }

  // ============ Initialize ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();