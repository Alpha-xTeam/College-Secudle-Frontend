import React from 'react';

// Simple Icon component mapping semantic names to Font Awesome classes.
// Usage: <Icon name="book" className="me-2 text-primary" />
const ICON_MAP = {
  book: 'fas fa-book',
  graduation: 'fas fa-graduation-cap',
  sun: 'fas fa-sun',
  moon: 'fas fa-moon',
  clock: 'fas fa-clock',
  users: 'fas fa-users',
  teacher: 'fas fa-chalkboard-teacher',
  university: 'fas fa-university',
  tag: 'fas fa-tag',
  coffee: 'fas fa-coffee',
  download: 'fas fa-download',
  star: 'fas fa-star',
  calendar: 'fas fa-calendar-alt',
  mobile: 'fas fa-mobile-alt',
  user: 'fas fa-user',
  group: 'fas fa-layer-group',
  clock_o: 'far fa-clock'
};

export default function Icon({ name, className = '', title = '', ...props }) {
  const base = ICON_MAP[name] || name; // allow passing raw class string as name
  const classes = `${base} ${className}`.trim();
  return <i className={classes} aria-hidden={title ? 'false' : 'true'} title={title} {...props}></i>;
}
