/**
 * Popup script for Accessibility Inspector
 * Handles user interface interactions and communication with background script
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const urlInput = document.getElementById('url-input');
  const formatSelect = document.getElementById('format-select');
  const checkBtn = document.getElementById('check-btn');
  const currentPageBtn = document.getElementById('current-page-btn');
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  const reportContent = document.getElementById('report-content');
  const downloadBtn = document.getElementById('download-btn');
  const copyBtn = document.getElementById('copy-btn');
  const summaryStats = document.getElementById('summary-stats');
  const buttonText = checkBtn.querySelector('.button-text');
  const loadingSpinner = checkBtn.querySelector('.loading-spinner');

  // Current report data
  let currentReport = null;

  // Initialize popup
  init();

  function init() {
    // Set up event listeners
    checkBtn.addEventListener('click', startCheck);
    currentPageBtn.addEventListener('click', checkCurrentPage);
    downloadBtn.addEventListener('click', downloadReport);
    copyBtn.addEventListener('click', copyReportToClipboard);
    urlInput.addEventListener('keypress', handleUrlInputKeypress);

    // Load saved data
    loadSavedData();
    
    // Set focus to URL input
    urlInput.focus();
  }

  /**
   * Handle Enter key in URL input
   */
  function handleUrlInputKeypress(event) {
    if (event.key === 'Enter') {
      startCheck();
    }
  }

  /**
   * Load saved URL and format from storage
   */
  function loadSavedData() {
    chrome.storage.local.get(['lastUrl', 'lastFormat'], function(result) {
      if (result.lastUrl) {
        urlInput.value = result.lastUrl;
      }
      if (result.lastFormat) {
        formatSelect.value = result.lastFormat;
      }
    });
  }

  /**
   * Save current settings to storage
   */
  function saveCurrentData() {
    chrome.storage.local.set({
      lastUrl: urlInput.value,
      lastFormat: formatSelect.value
    });
  }

  /**
   * Check accessibility of current active tab
   */
  async function checkCurrentPage() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url) {
        // Only set URL if it's a web page (http/https)
        if (tab.url.startsWith('http')) {
          urlInput.value = tab.url;
          startCheck();
        } else {
          showStatus('Cannot check non-web pages (chrome://, file://, etc.)', 'error');
        }
      } else {
        showStatus('Could not get current page URL', 'error');
      }
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Start accessibility check
   */
  function startCheck() {
    const url = urlInput.value.trim();
    const format = formatSelect.value;

    // Validate URL
    if (!url) {
      showStatus('Please enter a URL to check', 'error');
      urlInput.focus();
      return;
    }

    if (!isValidUrl(url)) {
      showStatus('Please enter a valid URL (http:// or https://)', 'error');
      urlInput.focus();
      return;
    }

    // Save current data
    saveCurrentData();

    // Show loading state
    setLoadingState(true);
    showStatus('Checking accessibility...', 'loading');

    // Hide previous results
    hideResults();

    // Send message to background script
    chrome.runtime.sendMessage(
      {
        action: 'checkAccessibility',
        url: url,
        format: format
      },
      handleResponse
    );
  }

  /**
   * Handle response from background script
   */
  function handleResponse(response) {
    setLoadingState(false);

    console.log('Response from background:', response);

    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      showStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
      return;
    }

    if (response && response.error) {
      console.error('Background error:', response.error);
      showStatus(`Check error: ${response.error}`, 'error');
      return;
    }

    if (response && response.report) {
      try {
        // Try to parse if it's JSON, otherwise use as-is
        let reportData = response.report;
        if (typeof reportData === 'string') {
          // Check if it's JSON format
          if (reportData.trim().startsWith('{') || reportData.trim().startsWith('[')) {
            try {
              reportData = JSON.parse(reportData);
            } catch (parseError) {
              // If parsing fails, it might be HTML or text format - use as-is
              console.log('Report is not JSON, using as text/HTML');
            }
          }
        }
        
        currentReport = reportData;
        displayResults(currentReport);
        showStatus('Check completed successfully!', 'success');
      } catch (error) {
        console.error('Error processing report:', error);
        showStatus(`Error processing results: ${error.message}`, 'error');
      }
    } else {
      showStatus('Unknown error during check - no data received', 'error');
    }
  }

  /**
   * Display check results
   */
  function displayResults(report) {
    // Show summary statistics
    displaySummaryStats(report);

    // Display full report in selected format
    displayReportContent(report);

    // Show results section
    resultsDiv.classList.remove('hidden');
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Display summary statistics
   */
  function displaySummaryStats(reportData) {
    try {
      let summary;
      
      // Handle different report formats
      if (typeof reportData === 'object' && reportData.summary) {
        summary = reportData.summary;
      } else if (typeof reportData === 'string') {
        // Try to extract summary from string report
        const totalMatch = reportData.match(/Total Issues:?\s*(\d+)/i);
        const errorsMatch = reportData.match(/Errors:?\s*(\d+)/i);
        const warningsMatch = reportData.match(/Warnings:?\s*(\d+)/i);
        
        summary = {
          total: totalMatch ? parseInt(totalMatch[1]) : 0,
          errors: errorsMatch ? parseInt(errorsMatch[1]) : 0,
          warnings: warningsMatch ? parseInt(warningsMatch[1]) : 0
        };
      } else {
        summary = { total: 0, errors: 0, warnings: 0 };
      }
      
      summaryStats.innerHTML = `
        <div class="stat-item">
          <span class="stat-number total">${summary.total}</span>
          <span class="stat-label">total issues</span>
        </div>
        <div class="stat-item">
          <span class="stat-number errors">${summary.errors}</span>
          <span class="stat-label">errors</span>
        </div>
        <div class="stat-item">
          <span class="stat-number warnings">${summary.warnings}</span>
          <span class="stat-label">warnings</span>
        </div>
      `;
    } catch (error) {
      console.error('Error displaying summary stats:', error);
      summaryStats.innerHTML = '<p>Error loading statistics</p>';
    }
  }

  /**
   * Display report content based on selected format
   */
  function displayReportContent(reportData) {
    const format = formatSelect.value;
    
    try {
      let content = '';
      
      if (typeof reportData === 'string') {
        // If report is already a string (HTML or text format)
        if (format === 'html' && reportData.includes('<')) {
          content = reportData;
        } else {
          content = `<pre>${escapeHtml(reportData)}</pre>`;
        }
      } else {
        // If report is an object, format it
        switch (format) {
          case 'html':
            content = formatAsHtml(reportData);
            break;
          case 'text':
            content = formatAsText(reportData);
            break;
          case 'json':
          default:
            content = formatAsJson(reportData);
            break;
        }
      }
      
      reportContent.innerHTML = content;
    } catch (error) {
      console.error('Error displaying report content:', error);
      reportContent.innerHTML = `<p>Report formatting error: ${error.message}</p>`;
    }
  }

  // ... остальные функции popup.js остаются без изменений ...
  // [Вставьте сюда formatAsJson, formatAsHtml, formatAsText, downloadReport, copyReportToClipboard и другие функции]

  /**
   * Set loading state for check button
   */
  function setLoadingState(isLoading) {
    if (isLoading) {
      checkBtn.disabled = true;
      buttonText.textContent = 'Checking...';
      loadingSpinner.classList.remove('hidden');
    } else {
      checkBtn.disabled = false;
      buttonText.textContent = 'Check Accessibility';
      loadingSpinner.classList.add('hidden');
    }
  }

  /**
   * Show status message
   */
  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');
    
    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 5000);
    }
  }

  /**
   * Hide results section
   */
  function hideResults() {
    resultsDiv.classList.add('hidden');
    currentReport = null;
  }

  /**
   * Validate URL format
   */
  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  /**
   * Escape HTML special characters
   */
  function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});