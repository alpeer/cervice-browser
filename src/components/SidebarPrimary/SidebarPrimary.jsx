'use client';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useSpecState } from '@/hooks/useSpecState';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import styles from './SidebarPrimary.module.scss';

export default function SidebarPrimary() {
  const router = useRouter();
  const {
    spec,
    selectedSection,
    openSections,
    sidebarConfig,
    toggleSection,
  } = useSpecState();

  // Always show sidebar for entities section, even without spec
  if (!spec && selectedSection !== 'entities') return null;

  const items = sidebarConfig.primary.items;

  // If no items configured, don't show sidebar
  if (items.length === 0) return null;

  const handleSectionClick = (item) => {
    if (item.collapsible) {
      toggleSection(item.id);
    }
    if (item.onClick) {
      item.onClick();
    }
  };

  const handleChildClick = (child) => {
    if (child.onClick) {
      child.onClick();
    }
  };

  return (
    <nav className={styles.container}>
      <div className={styles.header}>
        <h3>OpenAPI Viewer</h3>
      </div>
      <List className={styles.list}>
        {items.map((item) => {
          const isCollapsible = item.collapsible;
          const isActive = item.active || (isCollapsible && openSections[item.id]);

          return (
            <div key={item.id}>
              <ListItemButton
                onClick={() => handleSectionClick(item)}
                className={clsx(styles.item, {
                  [styles.itemActive]: isActive
                })}
              >
                <ListItemText primary={item.label} />
                {isCollapsible && (openSections[item.id] ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>

              {isCollapsible && item.children && (
                <Collapse in={openSections[item.id]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding className={styles.submenu}>
                    {item.children.length === 0 && (
                      <div className={styles.empty}>No items found</div>
                    )}
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.id}
                        className={clsx(styles.subitem, {
                          [styles.subitemSelected]: child.selected
                        })}
                        onClick={() => handleChildClick(child)}
                      >
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{ className: styles.subitemLabel }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </div>
          );
        })}
      </List>
    </nav>
  );
}
