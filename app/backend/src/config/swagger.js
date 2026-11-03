const swaggerJsdoc = require('swagger-jsdoc');
const path = require('node:path');

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API del catalogo de productos',
      version: '1.0.0',
      description: 'API JSON para consultar y administrar categorias y productos del catalogo.',
    },
    servers: [
      {
        url: '/',
        description: 'Servidor actual',
      },
    ],
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Categorias', description: 'Organizacion del catalogo por categoria' },
      { name: 'Productos', description: 'Productos disponibles en el catalogo' },
      { name: 'Pedidos', description: 'Compras simuladas e inventario transaccional' },
      { name: 'Salud', description: 'Estado del servicio' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'token', description: 'Token de POST /api/auth/login' },
        csrfToken: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token', description: 'Token CSRF devuelto por POST /api/auth/login; requerido junto al Bearer en POST, PUT y DELETE administrativos.' },
      },
      schemas: {
        Categoria: {
          type: 'object',
          required: ['idCategoria', 'nombre', 'descripcion'],
          properties: {
            idCategoria: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Accesorios' },
            descripcion: { type: 'string', nullable: true, example: 'Complementos para uso diario' },
          },
        },
        CategoriaEntrada: {
          type: 'object',
          required: ['nombre'],
          properties: {
            nombre: { type: 'string', minLength: 1, example: 'Accesorios' },
            descripcion: { type: 'string', nullable: true, example: 'Complementos para uso diario' },
          },
        },
        Producto: {
          type: 'object',
          required: ['idProducto', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'idCategoria'],
          properties: {
            idProducto: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Bolso tejido' },
            descripcion: { type: 'string', nullable: true, example: 'Hecho a mano en fibras naturales' },
            precio: { type: 'number', format: 'double', example: 89000 },
            stock: { type: 'integer', minimum: 0, example: 8 },
            imagen: { type: 'string', nullable: true, example: 'https://images.unsplash.com/photo-...' },
            idCategoria: { type: 'integer', example: 1 },
          },
        },
        ProductoEntrada: {
          type: 'object',
          required: ['nombre', 'precio', 'stock', 'idCategoria'],
          properties: {
            nombre: { type: 'string', minLength: 1, example: 'Bolso tejido' },
            descripcion: { type: 'string', nullable: true, example: 'Hecho a mano en fibras naturales' },
            precio: { type: 'number', exclusiveMinimum: 0, example: 89000 },
            stock: { type: 'integer', minimum: 0, example: 8 },
            imagen: { type: 'string', nullable: true, example: 'https://images.unsplash.com/photo-...' },
            idCategoria: { type: 'integer', minimum: 1, example: 1 },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'La solicitud contiene datos invalidos.' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Datos de entrada invalidos',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'El recurso solicitado no existe',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },
  apis: [
  path.resolve(__dirname, '../routes/auth.routes.js'),
  path.resolve(__dirname, '../routes/categorias.routes.js'),
  path.resolve(__dirname, '../routes/health.routes.js'),
  path.resolve(__dirname, '../routes/pedidos.routes.js'),
  path.resolve(__dirname, '../routes/productos.routes.js'),
  ],
  failOnErrors: true,
});

