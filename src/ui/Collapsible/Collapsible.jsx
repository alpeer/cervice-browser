'use client';

import { useState } from 'react';
import { IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './Collapsible.scss';

export default function Collapsible({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible">
      <div className="collapsible__header" onClick={() => setIsOpen(!isOpen)}>
        <IconButton
          size="small"
          className={`collapsible__icon ${isOpen ? 'collapsible__icon--rotated' : ''}`}
        >
          <ExpandMoreIcon />
        </IconButton>
        <span className="collapsible__title">{title}</span>
      </div>
      {isOpen && <div className="collapsible__content">{children}</div>}
    </div>
  );
}
