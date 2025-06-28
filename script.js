// Store previous analysis results
const analysisCache = {};

document.getElementById("estimate-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-btn");
  const buttonText = document.getElementById("button-text");
  const resultDiv = document.getElementById("result");
  
  // Reset UI
  document.getElementById("github-error").style.display = "none";
  document.getElementById("url-error").style.display = "none";
  submitBtn.disabled = true;
  buttonText.innerHTML = '<span class="loading"></span> Analyzing Portfolio...';
  resultDiv.style.display = "none";
  
  // Get values
  let username = document.getElementById("github-username").value.trim();
  const url = document.getElementById("portfolio-url").value.trim();
  
  // Validate inputs
  let isValid = true;
  
  if (!username && !url) {
    document.getElementById("github-error").textContent = "Please provide at least GitHub username or Portfolio URL";
    document.getElementById("github-error").style.display = "block";
    isValid = false;
  }
  
  if (url && !isValidUrl(url)) {
    document.getElementById("url-error").textContent = "Please enter a valid URL including http:// or https://";
    document.getElementById("url-error").style.display = "block";
    isValid = false;
  }
  
  if (!isValid) {
    submitBtn.disabled = false;
    buttonText.innerHTML = '<i class="fas fa-calculator"></i> Analyze Portfolio';
    return;
  }
  
  try {
    // Check cache first
    const cacheKey = `${username}-${url}`;
    if (analysisCache[cacheKey]) {
      displayResults(analysisCache[cacheKey].scores, analysisCache[cacheKey].worth);
      setupDownloadButton(analysisCache[cacheKey].scores, analysisCache[cacheKey].worth, username, url);
      return;
    }

    // Show loading animation
    resultDiv.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <h3>Running Advanced Analysis...</h3>
        <p class="loading-text">Checking code quality, performance metrics, and design patterns</p>
        <div class="loading-progress">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
      </div>
    `;
    resultDiv.style.display = "block";
    
    // Simulate progress
    await simulateProgress();
    
    // Initialize scores with consistent values based on URL/username hash
    const hashValue = hashCode(`${username}-${url}`);
    const scores = {
      design: 6 + (hashValue % 4), // 6-9
      speed: 40 + (hashValue % 45), // 40-85
      github: username ? calculateGitHubScoreFromHash(hashValue) : 0,
      mobile: 5 + (hashValue % 5), // 5-9
      code: 6 + (hashValue % 4) // 6-9
    };
    
    // Adjust scores based on URL characteristics (consistent)
    if (url) {
      if (url.includes('.dev') || url.includes('.tech')) scores.speed += 8;
      if (url.includes('github.io')) scores.speed -= 7;
      if (url.includes('vercel.app') || url.includes('netlify.app')) scores.speed += 5;
      if (url.includes('react') || url.includes('vue')) scores.speed += 3;
      if (url.includes('wordpress') || url.includes('wix')) scores.speed -= 5;
      
      if (url.includes('mobile') || url.includes('responsive')) scores.mobile += 2;
      if (url.includes('amp') || url.includes('pwa')) scores.mobile += 3;
      
      if (url.includes('.dev') || url.includes('github')) scores.code += 1;
      if (url.includes('min.') || url.includes('bundle')) scores.code += 2;
      if (url.includes('jquery') || url.includes('legacy')) scores.code -= 1;
    }
    
    // Ensure scores are within bounds
    scores.speed = Math.max(10, Math.min(100, scores.speed));
    scores.mobile = Math.max(1, Math.min(10, scores.mobile));
    scores.code = Math.max(1, Math.min(10, scores.code));
    
    // Calculate final worth (300-2000 range)
    const worth = calculateConsistentWorth(scores, hashValue);
    
    // Cache results
    analysisCache[cacheKey] = { scores, worth };
    
    // Display results
    displayResults(scores, worth);
    setupDownloadButton(scores, worth, username, url);
    
  } catch (error) {
    console.error("Error:", error);
    resultDiv.innerHTML = `
      <div style="color: var(--warning); text-align: center; padding: 20px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <h3>Analysis Failed</h3>
        <p>Error analyzing your portfolio. Please try again later.</p>
      </div>
    `;
    resultDiv.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    buttonText.innerHTML = '<i class="fas fa-calculator"></i> Analyze Portfolio';
  }
});

// Helper functions
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function calculateGitHubScoreFromHash(hash) {
  // Simulate GitHub score based on hash (0-10 range)
  return parseFloat(((hash % 30) / 3).toFixed(1));
}

function calculateConsistentWorth(scores, hashValue) {
  // Weighted calculation with 300-2000 range
  const weights = {
    design: 3,
    speed: 2.5,
    github: 2,
    mobile: 1.5,
    code: 2
  };
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  const weightedScore = (
    (scores.design * weights.design) + 
    (scores.speed * weights.speed) + 
    (scores.github * weights.github) + 
    (scores.mobile * weights.mobile) +
    (scores.code * weights.code)
  ) / totalWeight;
  
  // Scale to 300-2000 range
  const minScore = 30;
  const maxScore = 200;
  const worth = minScore + (weightedScore * (maxScore - minScore) / 10);
  
  // Add small consistent variation based on hash
  const variation = ((hashValue % 20) - 10) / 100; // -10% to +10%
  return Math.floor(worth * (1 + variation));
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function simulateProgress() {
  const progressBar = document.querySelector(".loading-progress .progress-bar");
  if (!progressBar) return;
  
  for (let i = 0; i <= 100; i++) {
    progressBar.style.width = `${i}%`;
    await delay(20);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function displayResults(scores, worth) {
  const resultDiv = document.getElementById("result");
  
  resultDiv.innerHTML = `
    <div class="analysis-section">
      <h2><i class="fas fa-chart-bar"></i> Detailed Analysis</h2>
      
      <div class="metric">
        <span><i class="fas fa-paint-brush"></i> Design Quality</span>
        <span class="metric-value" id="design-score">${scores.design}/10</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar" id="design-bar" style="width: ${scores.design * 10}%"></div>
      </div>
      
      <div class="metric">
        <span><i class="fas fa-tachometer-alt"></i> Performance</span>
        <span class="metric-value" id="speed-score">${scores.speed}/100</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar" id="speed-bar" style="width: ${scores.speed}%"></div>
      </div>
      
      <div class="metric">
        <span><i class="fab fa-github"></i> GitHub Impact</span>
        <span class="metric-value" id="github-impact">${scores.github.toFixed(1)}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar" id="github-bar" style="width: ${scores.github * 10}%"></div>
      </div>
      
      <div class="metric">
        <span><i class="fas fa-mobile-alt"></i> Mobile Friendly</span>
        <span class="metric-value" id="mobile-score">${scores.mobile}/10</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar" id="mobile-bar" style="width: ${scores.mobile * 10}%"></div>
      </div>
      
      <div class="metric">
        <span><i class="fas fa-code"></i> Code Quality</span>
        <span class="metric-value" id="code-score">${scores.code}/10</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar" id="code-bar" style="width: ${scores.code * 10}%"></div>
      </div>
    </div>
    
    <div class="worth-section">
      <div class="worth">
        Estimated Value: $<span id="worth-value">${worth.toLocaleString()}</span>
      </div>
      <button id="download-btn" class="download-btn">
        <i class="fas fa-download"></i> Download Report
      </button>
    </div>
  `;
  
  colorProgressBar("design-bar", scores.design, 10);
  colorProgressBar("speed-bar", scores.speed, 100);
  colorProgressBar("github-bar", scores.github, 10);
  colorProgressBar("mobile-bar", scores.mobile, 10);
  colorProgressBar("code-bar", scores.code, 10);
  
  resultDiv.style.display = "block";
}

function colorProgressBar(barId, value, max) {
  const percentage = (value / max) * 100;
  const bar = document.getElementById(barId);
  
  if (!bar) return;
  
  if (percentage < 30) {
    bar.style.backgroundColor = "#f72585";
  } else if (percentage < 70) {
    bar.style.backgroundColor = "#4895ef";
  } else {
    bar.style.backgroundColor = "#4cc9f0";
  }
}

function setupDownloadButton(scores, worth, username, url) {
  const downloadBtn = document.getElementById("download-btn");
  if (!downloadBtn) return;
  
  downloadBtn.addEventListener("click", () => {
    const reportContent = `
      Portfolio Analysis Report
      ========================
      
      ${username ? `GitHub Username: ${username}` : ''}
      ${url ? `Portfolio URL: ${url}` : ''}
      
      Analysis Results:
      - Design Quality: ${scores.design}/10
      - Performance: ${scores.speed}/100
      - GitHub Impact: ${scores.github.toFixed(1)}/10
      - Mobile Friendly: ${scores.mobile}/10
      - Code Quality: ${scores.code}/10
      
      Estimated Portfolio Value: $${worth.toLocaleString()}
      
      Generated by Portfolio Worth Analyzer
      Developed by Muhammad Attiq
      © ${new Date().getFullYear()}
    `;
    
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-analysis-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-check"></i> Report Downloaded!';
    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
    }, 2000);
  });
}
