'use client';

import { useState } from 'react';
import clsx from 'clsx';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styles from './Collapsible.module.scss';

export default function Collapsible({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <IconButton
          size="small"
          className={clsx(styles.icon, isOpen && styles.iconRotated)}
        >
          <ExpandMoreIcon />
        </IconButton>
        <span className={styles.title}>{title}</span>
      </div>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}
