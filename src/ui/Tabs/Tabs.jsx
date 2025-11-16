'use client';

import { Tabs as MuiTabs, Tab } from '@mui/material';
import './Tabs.scss';

export default function Tabs({ value, onChange, tabs }) {
  return (
    <MuiTabs
      value={value}
      onChange={onChange}
      className="custom-tabs"
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
