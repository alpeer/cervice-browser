'use client';

import Tabs as MuiTabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import clsx from 'clsx';
import styles from './Tabs.module.scss';

export default function Tabs({ value, onChange, tabs }) {
  return (
    <MuiTabs
      value={value}
      onChange={onChange}
      className={styles.customTabs}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          label={tab.label}
          value={tab.value}
        />
      ))}
    </MuiTabs>
  );
}
