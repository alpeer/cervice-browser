# Example Entity Schemas

This folder contains example entity schema files that demonstrate the Entity Relationship Diagram feature.

## Files

- **User.json** - User account entity
- **Order.json** - Customer orders with foreign key to User
- **Product.json** - Product catalog with foreign key to Category
- **OrderItem.json** - Order line items (many-to-many join table between Order and Product)
- **Category.json** - Product categories with self-referencing parent relationship

## Relationships

The example entities demonstrate various relationship types:

1. **User → Order** (1:n)
   - One user can have many orders
   - Foreign key: `Order.user_id → User.id`

2. **Order → OrderItem** (1:n)
   - One order can have many line items
   - Foreign key: `OrderItem.order_id → Order.id`

3. **Product → OrderItem** (1:n)
   - One product can appear in many order items
   - Foreign key: `OrderItem.product_id → Product.id`

4. **Category → Product** (1:n)
   - One category can contain many products
   - Foreign key: `Product.category_id → Category.id`

5. **Category → Category** (1:n - Self-reference)
   - Categories can have parent categories (hierarchical)
   - Foreign key: `Category.parent_id → Category.id`

## Usage

1. Navigate to the Entities section in the application
2. Click "Upload Schemas" button
3. Select all JSON files from this folder
4. The ER diagram will be generated showing all entities and their relationships
5. Hover over entities in the sidebar to highlight them in the diagram
6. Click an entity in the sidebar to center it in the viewport

## Schema Format

Entity schemas support:

- **Columns**: name, type, nullable, unique, primaryKey, autoIncrement, default
- **Foreign Keys**: entity, column, onDelete, onUpdate
- **Indexes**: name, columns (array), unique, type
- **Relations**: Automatically detected from foreign keys and column naming conventions

Example:
```json
{
  "name": "EntityName",
  "tableName": "table_name",
  "description": "Entity description",
  "columns": [
    {
      "name": "id",
      "type": "INTEGER",
      "primaryKey": true,
      "autoIncrement": true,
      "nullable": false
    },
    {
      "name": "foreign_id",
      "type": "INTEGER",
      "nullable": false,
      "foreignKey": {
        "entity": "OtherEntity",
        "column": "id",
        "onDelete": "CASCADE",
        "onUpdate": "CASCADE"
      }
    }
  ],
  "indexes": [
    {
      "name": "idx_column",
      "columns": ["column_name"],
      "unique": true
    }
  ]
}
```
