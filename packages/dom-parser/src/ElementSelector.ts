export class ElementSelector {
  
  static generateSelector(element: {
    id?: string;
    testId?: string;
    ariaLabel?: string;
    name?: string;
    role?: string;
    tagName: string;
    text?: string;
    type?: string;
  }): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.testId) {
      return `[data-testid="${element.testId}"]`;
    }

    if (element.ariaLabel) {
      return `[aria-label="${element.ariaLabel}"]`;
    }

    const tag = element.tagName.toLowerCase();

    if (element.name && ['input', 'select', 'textarea'].includes(tag)) {
      return `${tag}[name="${element.name}"]`;
    }

    if (element.role && element.text) {
      return `[role="${element.role}"]:has-text("${element.text.slice(0, 40)}")`;
    }

    if (element.text && ['button', 'a', 'label'].includes(tag)) {
      return `${tag}:has-text("${element.text.slice(0, 40)}")`;
    }

    if (element.type && tag === 'input') {
      return `input[type="${element.type}"]`;
    }

    return tag;
  }

  static isStableSelector(selector: string): boolean {
    
    if (/\.\w*\d{4,}\w*/.test(selector)) return false; 
    if (/nth-child\(\d+\)/.test(selector)) return false;
    if (/nth-of-type\(\d+\)/.test(selector)) return false;
    return true;
  }
}
