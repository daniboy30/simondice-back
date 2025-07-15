/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Ruta de bienvenida
router.get('/', async () => {
  return {
    message: 'Bienvenido a Simon Dice API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      games: '/api/games',
      gameplay: '/api/gameplay'
    }
  }
})

// Grupo de rutas de autenticación
router.group(() => {
  router.post('/register', '#controllers/auth_controller.register')
  router.post('/login', '#controllers/auth_controller.login')
  
  // Rutas protegidas por autenticación
  router.group(() => {
    router.post('/logout', '#controllers/auth_controller.logout')
    router.get('/me', '#controllers/auth_controller.me')
  }).use(middleware.auth())
  
}).prefix('/api/auth')

// Grupo de rutas de juegos
router.group(() => {
  router.get('/', '#controllers/games_controller.index') // Listar partidas disponibles
  router.post('/', '#controllers/games_controller.store') // Crear nueva partida
  router.get('/my-games', '#controllers/games_controller.myGames') // Mis partidas
  router.get('/:id', '#controllers/games_controller.show') // Ver detalles de una partida
  router.post('/:id/join', '#controllers/games_controller.join') // Unirse a una partida
}).prefix('/api/games').use(middleware.auth())

// Grupo de rutas de jugabilidad
router.group(() => {
  router.get('/:id/state', '#controllers/game_plays_controller.getGameState') // Estado del juego
  router.get('/:id/moves', '#controllers/game_plays_controller.getMoves') // Historial de movimientos
  router.post('/:id/move', '#controllers/game_plays_controller.makeMove') // Hacer movimiento
  router.post('/:id/forfeit', '#controllers/game_plays_controller.forfeit') // Abandonar partida
}).prefix('/api/gameplay').use(middleware.auth())

// Rutas de desarrollo (solo para testing)
if (process.env.NODE_ENV === 'development') {
  router.group(() => {
    router.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    })
  }).prefix('/api/dev')
}
