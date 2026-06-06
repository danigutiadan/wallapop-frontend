# Guía de Lectura de Búsquedas en Firestore para el Backend

Esta documentación detalla cómo el backend debe interpretar los datos guardados en Firestore (`wallapop-agent/config`) después de los últimos cambios aplicados en el frontend para soportar las categorías y filtros nativos de Wallapop.

## Ubicación del Documento

Todas las búsquedas configuradas se guardan en el documento:
- **Colección:** `wallapop-agent`
- **Documento:** `config`

Dentro de este documento, encontrarás un array llamado `searches`.

## Estructura de `searches`

Cada objeto en el array `searches` sigue esta estructura JSON (Modelado desde el Front):

```json
{
  "name": "Coches BMW",
  "keywords": "bmw m3",
  "min_price": 5000,
  "max_price": 20000,
  "order_by": "newest",
  "condition": "good",
  "category_ids": "100",
  "object_type_id": "",
  "extra_filters": {
    "brand": "BMW",
    "model": "M3",
    "year": "2010"
  }
}
```

### Descripción de los Campos Claves:

*   **`category_ids`**: Corresponde al **ID principal de la categoría** de Wallapop (ej: `100` para Coches, `200` para Inmobiliaria, `24200` para Tecnología y Electrónica). En la API de Wallapop suele mandarse como el parámetro `category_ids`.
*   **`object_type_id`**: Corresponde al **ID de la subcategoría** (si existe y el usuario la ha seleccionado). Por ejemplo, si en Tecnología seleccionas "Telefonía y smartwatches", este campo guardará `24201`. En la API de Wallapop se manda como el parámetro `object_type_id`. **Nota:** Si la categoría principal no tiene subcategorías o el usuario seleccionó "Todas las categorías", este campo vendrá vacío o nulo.
*   **`extra_filters`**: Es un diccionario `Clave: Valor` (`Record<string, string>`) que contiene los filtros avanzados que el usuario seleccionó en base a los atributos permitidos de Wallapop (ej. `brand`, `model`, `rooms`, `bathrooms`, etc.).

*(El campo `ui_extra_filters` que podrías haber visto en el código Angular es estrictamente para la interfaz de usuario y no se guarda en Firestore, es convertido a `extra_filters` al guardar).*

## Construyendo la petición (Backend)

Cuando tu backend lea este documento de Firestore, puede mapear los campos directamente a la API de Wallapop o a la URL de búsqueda.

Un ejemplo de cómo estructurar los parámetros en Node.js/Python:

```javascript
// Suponiendo que 'search' es el objeto extraído del array de Firestore
const queryParams = new URLSearchParams();

// 1. Añadir parámetros básicos
if (search.keywords) queryParams.append('keywords', search.keywords);
if (search.min_price) queryParams.append('min_sale_price', search.min_price);
if (search.max_price) queryParams.append('max_sale_price', search.max_price);
if (search.condition) queryParams.append('condition', search.condition);
if (search.order_by) queryParams.append('order_by', search.order_by);

// 2. Añadir Categoría y Subcategoría
if (search.category_ids) {
    queryParams.append('category_ids', search.category_ids);
}
if (search.object_type_id) {
    queryParams.append('object_type_id', search.object_type_id);
}

// 3. Añadir Filtros Específicos (Atributos nativos de Wallapop)
if (search.extra_filters) {
    for (const [key, value] of Object.entries(search.extra_filters)) {
        queryParams.append(key, value);
    }
}

// Resultado final de los parámetros:
const queryString = queryParams.toString();
// Ejemplo: keywords=bmw+m3&min_sale_price=5000&category_ids=100&brand=BMW&model=M3&year=2010
```

### Consideraciones sobre Filtros Extra:
Los filtros se guardarán bajo su identificador original de Wallapop gracias a que ahora los seleccionamos del JSON de `category-attributes` directamente (e.g. `surface`, `brand`, `rooms`, `engine_displacement`, `size`). Tu backend simplemente debe iterar sobre el mapa `extra_filters` y agregarlos como query-parameters al request.
