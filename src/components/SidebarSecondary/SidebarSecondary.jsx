'use client';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import { useSpecState } from '@/hooks/useSpecState';
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags';
import './SidebarSecondary.scss';

export default function SidebarSecondary() {
  const {
    spec,
    selectedSection,
    sidebarConfig,
  } = useSpecState();

  // For entities section, we don't need spec
  if (selectedSection !== 'entities' && !spec) return null;

  const { title, subtitle, items } = sidebarConfig.secondary;

  // Don't show if no items configured
  if (!title && items.length === 0) return null;

  return (
    <nav className="sidebar-secondary">
      {title && (
        <div className="sidebar-secondary__header">
          <h4>{title}</h4>
          {subtitle && <span className="sidebar-secondary__count">{subtitle}</span>}
        </div>
      )}
      <List className="sidebar-secondary__list">
        {items.length === 0 && (
          <div className="sidebar-secondary__empty">
            No items to display
          </div>
        )}
        {items.map((item) => (
          <ListItemButton
            key={item.id}
            className={`sidebar-secondary__item ${
              item.selected ? 'sidebar-secondary__item--selected' : ''
            }`}
            onClick={item.onClick}
            onMouseEnter={item.onMouseEnter}
            onMouseLeave={item.onMouseLeave}
          >
            {/* Endpoint-specific rendering */}
            {item.method && (
              <div className="sidebar-secondary__item-content">
                <span className={`method-badge method-badge--${getMethodColor(item.method)}`}>
                  {item.method}
                </span>
                <span className="endpoint-path">{item.label}</span>
              </div>
            )}

            {/* Entity-specific rendering */}
            {!item.method && item.subtitle && (
              <div className="entity-item">
                <div className="entity-item__name">{item.label}</div>
                <div className="entity-item__meta">{item.subtitle}</div>
              </div>
            )}

            {/* Object-specific rendering (simple label + meta) */}
            {!item.method && !item.subtitle && (
              <div className="object-name">{item.label}</div>
            )}

            {/* Optional subtitle for endpoints */}
            {item.method && item.subtitle && (
              <div className="endpoint-summary">{item.subtitle}</div>
            )}
          </ListItemButton>
        ))}
      </List>
    </nav>
  );
}
