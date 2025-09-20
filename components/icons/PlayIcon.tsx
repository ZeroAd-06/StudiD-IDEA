import React from 'react';

interface IconProps {
  className?: string;
}

const PlayIcon: React.FC<IconProps> = ({ className = 'h-5 w-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 -960 960 960"
    fill="currentColor"
  >
    <path d="M320-203v-560l440 280-440 280Zm60-280Zm0 171 269-171-269-171v342Z"/>
  </svg>
);

export default PlayIcon;