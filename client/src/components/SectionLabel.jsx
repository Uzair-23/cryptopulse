import React from 'react';

/**
 * SectionLabel — Standardized uppercase section label across dashboard & detail pages.
 * Consistent 11px font size, font-semibold, letter-spacing tracking-wider, uppercase.
 */
export default function SectionLabel({
  children,
  className = '',
  color = 'text-textMuted',
  as: Component = 'span'
}) {
  return (
    <Component
      className={`text-[11px] font-semibold uppercase tracking-wider select-none ${color} ${className}`}
    >
      {children}
    </Component>
  );
}
