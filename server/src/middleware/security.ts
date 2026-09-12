import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

/**
 * Cabeceras de seguridad para una app expuesta a internet.
 *
 * La CSP se fija a mano (en vez de usar la de helmet por defecto) por dos
 * motivos concretos de este proyecto:
 *
 * - `client/index.html` carga la tipografía Poppins desde Google Fonts. Sin
 *   permitir `fonts.googleapis.com` (hoja de estilos) y `fonts.gstatic.com`
 *   (archivos de fuente), el navegador la bloquearía en producción.
 * - `upgradeInsecureRequests` se desactiva porque en local el build de
 *   producción se sirve por HTTP y el navegador intentaría forzar HTTPS.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
});

/**
 * Límite general de la API. Es holgado a propósito: una sesión normal de
 * trabajo hace muchas peticiones cortas (listar clientes, registrar pagos,
 * abrir el dashboard) y no queremos estorbar al cobrador.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Inténtalo de nuevo en unos minutos.' },
});

/**
 * Límite estricto para el login: es la única ruta sin token, así que es donde
 * se intenta fuerza bruta contra una contraseña.
 *
 * `skipSuccessfulRequests` deja fuera los aciertos, de modo que un usuario que
 * entra y sale varias veces al día no se bloquea a sí mismo; solo cuentan los
 * intentos fallidos.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.' },
});
