'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useSpecState } from '@/hooks/useSpecState';
import { getSchemas, getPaths, getWebhooks, getDomainModels } from '@/utils/specUtils';
import styles from './Sidebar.module.scss';

const menuItems = [
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'objects', label: 'Objects' },
  { id: 'webhooks', label: 'WebHooks' },
  { id: 'entities', label: 'Entities' },
];

export default function Sidebar() {
  const { spec, isSwagger, selectedView, selectedItem, setSelectedView, setSelectedItem } = useSpecState();
  const [openSection, setOpenSection] = useState('endpoints');
  const [level2Items, setLevel2Items] = useState([]);

  // Extract level 2 items based on selected section
  useEffect(() => {
    if (!spec) return;

    let items = [];

    switch (openSection) {
      case 'endpoints':
        items = extractEndpoints(spec);
        break;
      case 'objects':
        items = extractObjects(spec, isSwagger);
        break;
      case 'webhooks':
        items = extractWebhooks(spec, isSwagger);
        break;
      case 'entities':
        items = []; // Empty for now as per requirements
        break;
    }

    setLevel2Items(items);
  }, [spec, openSection, isSwagger]);

  const handleSectionClick = (section) => {
    setOpenSection(section);
    setSelectedView(section);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  return (
    <nav className={styles.container}>
      <div className={styles.header}>
        <h3>OpenAPI Viewer</h3>
      </div>
      <List className={styles.list}>
        {menuItems.map((menuItem) => (
          <div key={menuItem.id}>
            <ListItemButton
              onClick={() => handleSectionClick(menuItem.id)}
              className={clsx(styles.item, openSection === menuItem.id && styles.itemActive)}
            >
              <ListItemText primary={menuItem.label} />
              {openSection === menuItem.id ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={openSection === menuItem.id} timeout="auto" unmountOnExit>
              <List component="div" disablePadding className={styles.submenu}>
                {level2Items.length === 0 && openSection === menuItem.id && (
                  <div className={styles.empty}>
                    {menuItem.id === 'entities' ? 'No entities defined' : 'No items found'}
                  </div>
                )}
                {level2Items.map((item, idx) => (
                  <ListItemButton
                    key={idx}
                    className={clsx(styles.subitem, selectedItem?.id === item.id && styles.subitemSelected)}
                    onClick={() => handleItemClick(item)}
                  >
                    <ListItemText
                      primary={item.label}
                      secondary={item.subtitle}
                      primaryTypographyProps={{ className: styles.subitemLabel }}
                      secondaryTypographyProps={{ className: styles.subitemSubtitle }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </div>
        ))}
      </List>
    </nav>
  );
}

/**
 * Extract endpoints from spec
 */
function extractEndpoints(spec) {
  const paths = getPaths(spec);
  const endpoints = [];

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, config]) => {
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
      if (!httpMethods.includes(method.toLowerCase())) return;

      endpoints.push({
        id: `${method.toUpperCase()}_${path}`,
        label: path,
        subtitle: method.toUpperCase(),
        path,
        method: method.toUpperCase(),
        config,
      });
    });
  });

  return endpoints;
}

/**
 * Extract objects (domain models) from spec
 */
function extractObjects(spec, isSwagger) {
  const allSchemas = getSchemas(spec, isSwagger);
  const domainModels = getDomainModels(allSchemas);

  return Object.entries(domainModels).map(([name, schema]) => ({
    id: name,
    label: name,
    subtitle: schema.type || 'object',
    schema,
  }));
}

/**
 * Extract webhooks from spec
 */
function extractWebhooks(spec, isSwagger) {
  const webhooks = getWebhooks(spec, isSwagger);

  return Object.entries(webhooks).map(([name, config]) => ({
    id: name,
    label: name,
    subtitle: 'webhook',
    config,
  }));
}
