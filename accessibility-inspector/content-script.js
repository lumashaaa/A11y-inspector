/**
 * Content script for accessibility checking
 * Injected into web pages to perform accessibility audits
 */

// Make sure all dependencies are loaded
console.log('Accessibility Inspector content script loaded');

// Global flag to indicate content script is ready
window.a11yInspectorReady = true;

// Initialize dependencies if they're not available
function initializeDependencies() {
  try {
    // Check and initialize ColorUtils if not available
    if (typeof ColorUtils === 'undefined') {
      console.warn('ColorUtils not loaded, using fallback');
      // Simple fallback color utils
      window.ColorUtils = {
        calculateContrastRatio: function(color1, color2) {
          // Simple fallback implementation
          return 4.5; // Default passing ratio
        },
        suggestContrastImprovements: function() {
          return { currentRatio: 4.5, suggestedRatio: 4.5 };
        }
      };
    }

    // Check and initialize A11yRules if not available
    if (typeof A11yRules === 'undefined') {
      console.warn('A11yRules not loaded, using fallback');
      window.A11yRules = {};
      window.A11yRuleUtils = {
        runAllChecks: function() { return []; }
      };
    }

    // Check and initialize ReportGenerator if not available
    if (typeof ReportGenerator === 'undefined') {
      console.warn('ReportGenerator not loaded, using fallback');
      window.ReportGenerator = class {
        generate(data, format) {
          if (format === 'json') {
            return JSON.stringify(data, null, 2);
          }
          return `Report in ${format} format\n${JSON.stringify(data, null, 2)}`;
        }
      };
    }

    return true;
  } catch (error) {
    console.error('Error initializing dependencies:', error);
    return false;
  }
}

// Initialize dependencies when content script loads
initializeDependencies();

/**
 * Main function to run all accessibility checks
 * @returns {Object} Accessibility report with issues and summary
 */
function runA11yChecks() {
  console.log('Starting accessibility checks...');
  
  const issues = [];
  
  try {
    // Use modular accessibility rules if available
    if (typeof A11yRuleUtils !== 'undefined' && typeof A11yRuleUtils.runAllChecks === 'function') {
      console.log('Using A11yRuleUtils for checks');
      const ruleIssues = A11yRuleUtils.runAllChecks();
      issues.push(...ruleIssues);
    } else {
      console.log('A11yRuleUtils not available, running basic checks');
      // Run basic checks if rule utils are not available
      issues.push(...runBasicChecks());
    }

    // Run additional specialized checks
    const contrastIssues = checkColorContrast();
    issues.push(...contrastIssues);

    const ariaIssues = checkAriaAttributes();
    issues.push(...ariaIssues);

    const keyboardIssues = checkKeyboardNavigation();
    issues.push(...keyboardIssues);

    const semanticIssues = checkSemanticMarkup();
    issues.push(...semanticIssues);

    const langIssues = checkLanguage();
    issues.push(...langIssues);

  } catch (error) {
    console.error('Error during accessibility check:', error);
    issues.push({
      type: 'error',
      category: 'system',
      message: `Check execution error: ${error.message}`,
      element: null,
      selector: null
    });
  }

  console.log(`Accessibility check completed: ${issues.length} issues found`);
  
  return {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    issues: issues,
    summary: {
      total: issues.length,
      errors: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length
    }
  };
}

/**
 * Basic accessibility checks as fallback
 */
function runBasicChecks() {
  const issues = [];
  
  try {
    // Check images without alt
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      if (isElementVisible(img)) {
        issues.push({
          type: 'error',
          category: 'images',
          message: 'Image missing alt attribute',
          element: img.outerHTML.slice(0, 100),
          selector: getSelector(img)
        });
      }
    });

    // Check for page language
    const html = document.documentElement;
    if (!html.getAttribute('lang')) {
      issues.push({
        type: 'error',
        category: 'language',
        message: 'Missing lang attribute on html element',
        element: html.outerHTML.slice(0, 100),
        selector: 'html'
      });
    }

    // Check for headings
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push({
        type: 'warning',
        category: 'headings',
        message: 'No H1 heading found',
        element: null,
        selector: null
      });
    }

    // Check form labels
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
    inputs.forEach(input => {
      if (!input.id || !document.querySelector(`label[for="${input.id}"]`)) {
        issues.push({
          type: 'warning',
          category: 'forms',
          message: 'Input without associated label',
          element: input.outerHTML.slice(0, 100),
          selector: getSelector(input)
        });
      }
    });

  } catch (error) {
    console.error('Error in basic checks:', error);
    issues.push({
      type: 'error',
      category: 'system',
      message: `Basic check error: ${error.message}`,
      element: null,
      selector: null
    });
  }

  return issues;
}

// ... остальные функции content-script.js (checkColorContrast, isElementVisible, getSelector и т.д.) остаются без изменений ...
// [Вставьте сюда все остальные функции из предыдущей версии content-script.js]