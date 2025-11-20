'use client'

import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import { useSpecState } from '@/hooks/useSpecState'
import { getMethodColor } from '@/components/EndpointsList/helpers/groupByTags'
import clsx from 'clsx'
import styles from './SidebarSecondary.module.scss'

export default function SidebarSecondary() {
  const {
    spec,
    selectedSection,
    sidebarConfig,
  } = useSpecState()

  // For entities section, we don't need spec
  if (selectedSection !== 'entities' && !spec) return null

  const { title, subtitle, items } = sidebarConfig.secondary

  // Don't show if no items configured
  if (!title && items.length === 0) return null

  return (
    <nav className={styles.container}>
      {title && (
        <div className={styles.header}>
          <h4>{title}</h4>
          {subtitle && <span className={styles.count}>{subtitle}</span>}
        </div>
      )}
      <List className={styles.list}>
        {items.length === 0 && (
          <div className={styles.empty}>
            No items to display
          </div>
        )}
        {items.map((item) => (
          <ListItemButton
            key={item.id}
            className={clsx(styles.item, {
              [styles.itemSelected]: item.selected
            })}
            onClick={item.onClick}
            onMouseEnter={item.onMouseEnter}
            onMouseLeave={item.onMouseLeave}
          >
            {/* Endpoint-specific rendering */}
            {item.method && (
              <div className={styles.itemContent}>
                <span className={clsx(styles.methodBadge, styles[getMethodColor(item.method)])}>
                  {item.method}
                </span>
                <span className="endpoint-path">{item.label}</span>
              </div>
            )}

            {/* Entity-specific rendering */}
            {!item.method && item.subtitle && (
              <div className={styles.entityItem}>
                <div className={styles.entityName}>{item.label}</div>
                <div className={styles.entityMeta}>{item.subtitle}</div>
              </div>
            )}

            {/* Object-specific rendering (simple label + meta) */}
            {!item.method && !item.subtitle && (
              <div className={styles.objectName}>{item.label}</div>
            )}

            {/* Optional subtitle for endpoints */}
            {item.method && item.subtitle && (
              <div className={styles.endpointSummary}>{item.subtitle}</div>
            )}
          </ListItemButton>
        ))}
      </List>
    </nav>
  )
}
