'use client';

import { List, ListItemButton, ListItemText, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useSpecState } from '@/hooks/useSpecState';
import { useRouter } from 'next/navigation';
import './SidebarPrimary.scss';

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
    <nav className="sidebar-primary">
      <div className="sidebar-primary__header">
        <h3>OpenAPI Viewer</h3>
      </div>
      <List className="sidebar-primary__list">
        {items.map((item) => {
          const isCollapsible = item.collapsible;
          const isActive = item.active || (isCollapsible && openSections[item.id]);

          return (
            <div key={item.id}>
              <ListItemButton
                onClick={() => handleSectionClick(item)}
                className={`sidebar-primary__item ${
                  isActive ? 'sidebar-primary__item--active' : ''
                }`}
              >
                <ListItemText primary={item.label} />
                {isCollapsible && (openSections[item.id] ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>

              {isCollapsible && item.children && (
                <Collapse in={openSections[item.id]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding className="sidebar-primary__submenu">
                    {item.children.length === 0 && (
                      <div className="sidebar-primary__empty">No items found</div>
                    )}
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.id}
                        className={`sidebar-primary__subitem ${
                          child.selected ? 'sidebar-primary__subitem--selected' : ''
                        }`}
                        onClick={() => handleChildClick(child)}
                      >
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{ className: 'sidebar-primary__subitem-label' }}
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
