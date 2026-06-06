1. **Import `categories.json` and `category-attributes.json` into `search-modal.component.ts`**:
    - The JSON files contain all Wallapop categories, subcategories, and their allowed attributes (filters).
2. **Update the UI in `SearchModalComponent`**:
    - Add a Category dropdown (instead of a text input for `category_ids`). This will populate from the imported `categories.json`.
    - If a category is selected and it has subcategories, show a Subcategory dropdown. Wait, Wallapop uses `object_type_id` for subcategory? No, the search config has `category_ids` and `object_type_id`. `category_ids` usually corresponds to the category. I should check how they map. Wait, actually `category_ids` can map to the main category, and `object_type_id` to subcategory. Let me investigate.
    - Change "ID Categoría Wallapop" to two dropdowns: Category and Subcategory.
    - Replace the "Filtros Específicos Avanzados" section with dynamic dropdowns. When a category (and subcategory) is selected, list the allowed attributes from `category-attributes.json` so the user can easily select the key (from a predefined dropdown) rather than typing the key (e.g., 'brand').
3. **Map category/subcategory to `category_ids` and `object_type_id`**:
    - If a main category is selected, update `search.category_ids` to the selected category ID.
    - If a subcategory is selected, update `search.object_type_id` to the subcategory ID.
    - Wait, in `category.json`, some subcategories are under a main category. If a user selects a subcategory, maybe `category_ids` remains the main category and `object_type_id` becomes the subcategory.
4. **Update specific filter presets or remove them**:
    - If we have dynamic filters, we might not need "Preset Motor" and "Preset Inmobiliaria" because the available attributes will be automatically listed based on the selected category. Let's provide an "Añadir Filtro" dropdown instead, containing the valid attributes for the chosen category/subcategory.
5. **Pre-commit and submit**: Ensure the Angular build works and tests pass.
