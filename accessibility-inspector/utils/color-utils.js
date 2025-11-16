class ColorUtils {
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  static rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  static getContrastScore(ratio) {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'AA Large';
    return 'Fail';
  }

  static suggestContrastImprovements(currentColor, backgroundColor, targetRatio) {
    const currentLuminance = this.getLuminance(currentColor);
    const backgroundLuminance = this.getLuminance(backgroundColor);
    
    let suggestedColor = currentColor;
    
    // Color matching algorithm
    if (currentLuminance > backgroundLuminance) {
      // If text is lighter than the background, making it darker
      suggestedColor = this.darkenColor(currentColor, 0.2);
    } else {
      // If text is darker than the background, makeing it lighter
      suggestedColor = this.lightenColor(currentColor, 0.2);
    }
    
    return {
      current: currentColor,
      suggested: suggestedColor,
      currentRatio: this.calculateContrastRatio(currentColor, backgroundColor),
      suggestedRatio: this.calculateContrastRatio(suggestedColor, backgroundColor)
    };
  }

  static darkenColor(color, factor) {
    const rgb = this.parseColor(color);
    return {
      r: Math.max(0, rgb.r * (1 - factor)),
      g: Math.max(0, rgb.g * (1 - factor)),
      b: Math.max(0, rgb.b * (1 - factor))
    };
  }

  static lightenColor(color, factor) {
    const rgb = this.parseColor(color);
    return {
      r: Math.min(255, rgb.r + (255 - rgb.r) * factor),
      g: Math.min(255, rgb.g + (255 - rgb.g) * factor),
      b: Math.min(255, rgb.b + (255 - rgb.b) * factor)
    };
  }

  static calculateContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  static getLuminance(color) {
    const rgb = this.parseColor(color);
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(component => {
      component = component / 255;
      return component <= 0.03928 
        ? component / 12.92 
        : Math.pow((component + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  static parseColor(color) {
    if (typeof color === 'string') {
      if (color.startsWith('rgb')) {
        return this.parseRgbColor(color);
      } else if (color.startsWith('#')) {
        return this.parseHexColor(color);
      }
    }
    return color;
  }

  static parseRgbColor(color) {
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

  static parseHexColor(hex) {
    hex = hex.replace('#', '');
    
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
}