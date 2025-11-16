function runA11yChecks() {
  const issues = [];
  
  // Checking Alt texts for images
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  imagesWithoutAlt.forEach(img => {
    issues.push({
      type: 'error',
      category: 'images',
      message: 'Изображение без атрибута alt',
      element: img.outerHTML.slice(0, 100),
      selector: getSelector(img)
    });
  });

  // Checking headeings
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length === 0) {
    issues.push({
      type: 'warning',
      category: 'headings',
      message: 'На странице отсутствуют заголовки',
      element: null,
      selector: null
    });
  }

  // contrast check
  const contrastIssues = checkColorContrast();
  issues.push(...contrastIssues);

  // Checking of ARIA attributes
  const ariaIssues = checkAriaAttributes();
  issues.push(...ariaIssues);

  // Checking of keyboard navigation
  const keyboardIssues = checkKeyboardNavigation();
  issues.push(...keyboardIssues);

  // Checking semantic tags
  const semanticIssues = checkSemanticMarkup();
  issues.push(...semanticIssues);

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

function getSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.className) {
    return `.${element.className.split(' ')[0]}`;
  }
  return element.tagName.toLowerCase();
}

function checkColorContrast() {
  const issues = [];
  const textElements = getTextElements();
  
  textElements.forEach(element => {
    const contrastResult = getContrastRatioForElement(element);
    
    if (contrastResult) {
      const { ratio, fontSize, fontWeight, meetsAA, meetsAAA } = contrastResult;
      
      if (!meetsAA) {
        const requiredRatio = getRequiredContrastRatio(fontSize, fontWeight);
        issues.push({
          type: 'error',
          category: 'contrast',
          message: `Недостаточный контраст: ${ratio.toFixed(2)}:1 (требуется ${requiredRatio}:1)`,
          element: element.outerHTML.slice(0, 100),
          selector: getSelector(element),
          details: {
            ratio: ratio.toFixed(2),
            requiredRatio,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight
          }
        });
      }
    }
  });

  return issues;
}

function getTextElements() {
  // Get all elements contains text
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: function(node) {
        // Ignoring hidden elements
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Check if the element contains visible text
        const text = node.textContent || node.innerText;
        if (text && text.trim().length > 0 && isElementVisible(node)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        
        return NodeFilter.FILTER_REJECT;
      }
    },
    false
  );

  const elements = [];
  let node = walker.nextNode();
  while (node) {
    elements.push(node);
    node = walker.nextNode();
  }

  return elements;
}

function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  return !(rect.width === 0 && rect.height === 0);
}

function getContrastRatioForElement(element) {
  const style = window.getComputedStyle(element);
  const textColor = style.color;
  const backgroundColor = getBackgroundColor(element);
  
  if (!textColor || !backgroundColor) return null;

  const contrastRatio = calculateContrastRatio(textColor, backgroundColor);
  const fontSize = parseFloat(style.fontSize);
  const fontWeight = parseInt(style.fontWeight) || 400;

  const requiredAARatio = getRequiredContrastRatio(fontSize, fontWeight);
  const requiredAAARatio = requiredAARatio === 3 ? 4.5 : 7; // AAA requires 4.5 for large text, and 7 for regular text

  return {
    ratio: contrastRatio,
    fontSize,
    fontWeight,
    meetsAA: contrastRatio >= requiredAARatio,
    meetsAAA: contrastRatio >= requiredAAARatio,
    textColor,
    backgroundColor
  };
}

function getBackgroundColor(element) {
  let currentElement = element;
  let backgroundColor = null;

  // We climb the DOM tree until we find an opaque background
  while (currentElement && currentElement !== document.documentElement) {
    const style = window.getComputedStyle(currentElement);
    const bgColor = style.backgroundColor;
    
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      const alpha = getAlphaFromColor(bgColor);
      if (alpha > 0.1) { // Ignoring the almost transparent backgrounds
        backgroundColor = bgColor;
        break;
      }
    }
    
    currentElement = currentElement.parentElement;
  }

  // If no background is found, use white as a fallback
  return backgroundColor || 'rgb(255, 255, 255)';
}

function getAlphaFromColor(color) {
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      return parseFloat(match[4]);
    }
  }
  return 1; // For rgb and hex transparency 1
}

function calculateContrastRatio(foreground, background) {
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  
  // Contrast = (L1 + 0.05) / (L2 + 0.05)
  // where L1 is the brightness of the lighter color, and L2 is the brightness of the darker color
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(color) {
  const rgb = parseColor(color);
  
  // Converting sRGB to linear RGB
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(component => {
    component = component / 255;
    return component <= 0.03928 
      ? component / 12.92 
      : Math.pow((component + 0.055) / 1.055, 2.4);
  });

  // Calculation of relative brightness using the WCAG formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseColor(color) {
  // Support for various color formats
  if (color.startsWith('rgb')) {
    return parseRgbColor(color);
  } else if (color.startsWith('#')) {
    return parseHexColor(color);
  }
  
  // Fallback to the black color
  return { r: 0, g: 0, b: 0 };
}

function parseRgbColor(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function parseHexColor(hex) {
  // Remove # if find it
  hex = hex.replace('#', '');
  
  // Convert 3-digit HEX to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

function getRequiredContrastRatio(fontSize, fontWeight) {
  // WCAG 2.1 Criteria:
  // - Standard text: 4.5:1 (AA), 7:1 (AAA)
  // - Large text: 3:1 (AA), 4.5:1 (AAA)
  
  const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
  return isLargeText ? 3 : 4.5;
}


function checkAriaAttributes() {
  const issues = [];
  
  // Checking of aria-label without visible text
  const ariaLabeled = document.querySelectorAll('[aria-label]');
  ariaLabeled.forEach(el => {
    if (!el.textContent.trim() && !el.querySelector('img[alt]')) {
      issues.push({
        type: 'warning',
        category: 'aria',
        message: 'Элемент с aria-label без видимого текстового содержимого',
        element: el.outerHTML.slice(0, 100),
        selector: getSelector(el)
      });
    }
  });

  return issues;
}

function checkKeyboardNavigation() {
  const issues = [];
  
  // Checking items with tabindex
  const tabIndexElements = document.querySelectorAll('[tabindex]');
  tabIndexElements.forEach(el => {
    const tabIndex = parseInt(el.getAttribute('tabindex'));
    if (tabIndex < -1) {
      issues.push({
        type: 'error',
        category: 'keyboard',
        message: 'Некорректное значение tabindex',
        element: el.outerHTML.slice(0, 100),
        selector: getSelector(el)
      });
    }
  });

  return issues;
}

function checkSemanticMarkup() {
  const issues = [];
  
  // Checking the use of div instead of semantic elements
  const divButtons = document.querySelectorAll('div[onclick], div[role="button"]');
  divButtons.forEach(div => {
    issues.push({
      type: 'warning',
      category: 'semantics',
      message: 'Использование div вместо button для интерактивного элемента',
      element: div.outerHTML.slice(0, 100),
      selector: getSelector(div)
    });
  });

  return issues;
}