import { defineConfig } from '@foadonis/openapi'

export default defineConfig({
  ui: 'scalar',
  document: {
    info: {
      title: 'FlowSync API',
      // Refleja la versión real de package.json en vez del 1.0.0 de plantilla.
      version: '0.0.0',
    },
    components: {
      // Le da forma al `bearer` que declaran @ApiBearerAuth() en los
      // controladores: sin esto, `security` referenciaría un scheme que no
      // existe en ningún sitio del documento.
      securitySchemes: {
        bearer: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
})
