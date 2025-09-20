import React from 'react';

interface IconProps {
  className?: string;
}

const StopIcon: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 -960 960 960"
    fill="currentColor"
  >
    <path d="M300-660v360-360Zm-60 420v-480h480v480H240Zm60-60h360v-360H300v360Z"/>
  </svg>
);

export default StopIcon;