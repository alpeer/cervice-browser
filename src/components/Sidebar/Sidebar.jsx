'use client';

import { useState } from 'react';
import { List, ListItemButton, ListItemText } from '@mui/material';
import './Sidebar.scss';

const menuItems = [
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'objects', label: 'Objects' },
  { id: 'webhooks', label: 'WebHooks' },
  { id: 'entities', label: 'Entities' },
];

export default function Sidebar({ onSelect }) {
  const [selected, setSelected] = useState('endpoints');

  const handleSelect = (id) => {
    setSelected(id);
    onSelect(id);
  };

  return (
    <nav className="sidebar">
      <div className="sidebar__header">
        <h3>OpenAPI Viewer</h3>
      </div>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selected === item.id}
            onClick={() => handleSelect(item.id)}
            className="sidebar__item"
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </nav>
  );
}
