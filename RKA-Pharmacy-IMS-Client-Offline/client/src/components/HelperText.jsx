import React from 'react';

/**
 * HelperText Component
 * Conditionally renders explanatory text, subtitle paragraphs, or guide banners
 * only in 'maximalist' mode. In 'clean' mode, it automatically returns null to
 * maintain a de-cluttered, distraction-free counter layout.
 *
 * @param {string} uiMode - Active mode ('clean' | 'maximalist')
 * @param {React.ReactNode} children - Content to conditionally display
 * @param {string} className - Optional styling classes
 * @param {string} as - HTML tag name to render (default: 'p')
 */
export default function HelperText({
  uiMode = 'clean',
  children,
  className = '',
  as: Component = 'p'
}) {
  if (uiMode === 'clean') {
    return null;
  }

  return <Component className={className}>{children}</Component>;
}
