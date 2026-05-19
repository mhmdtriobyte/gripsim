import { memo } from 'react';

const USBCable = memo(function USBCable({ id }) {
  return (
    <g>
      <defs>
        <filter id={`shadow-usb-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#555" floodOpacity="0.4"/>
        </filter>
      </defs>
      <rect x="0" y="10" width="25" height="20" rx="2" fill="#aaa" stroke="#888" strokeWidth="1" filter={`url(#shadow-usb-${id})`} />
      <rect x="3" y="14" width="19" height="12" rx="1" fill="#ddd" stroke="#bbb" strokeWidth="0.5" />
      <text x="12.5" y="23" textAnchor="middle" fontSize="5" fill="#555" fontFamily="IBM Plex Mono">A</text>

      <path d="M 25 20 C 50 20, 50 20, 55 18 C 65 14, 75 14, 85 16 C 90 17, 93 19, 95 20" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <path d="M 25 20 C 50 20, 50 20, 55 18 C 65 14, 75 14, 85 16 C 90 17, 93 19, 95 20" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" />

      <rect x="95" y="12" width="20" height="16" rx="2" fill="#aaa" stroke="#888" strokeWidth="1" />
      <rect x="98" y="15" width="14" height="10" rx="1" fill="#ccc" stroke="#bbb" strokeWidth="0.5" />
      <text x="105" y="23" textAnchor="middle" fontSize="5" fill="#555" fontFamily="IBM Plex Mono">B</text>
    </g>
  );
});

export default USBCable;
