export type Rol = 'ADMIN' | 'COBRADOR';
export type FrecuenciaCuota = 'DIARIA' | 'SEMANAL' | 'MENSUAL';
export type EstadoPrestamo = 'ACTIVO' | 'PAGADO' | 'ATRASADO' | 'CANCELADO';
export type EstadoCuota = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ATRASADA';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  createdAt: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  documento: string;
  telefono: string | null;
  direccion: string | null;
  cobradorId: number | null;
  cobrador?: { id: number; nombre: string } | null;
  createdAt: string;
}

export interface Cuota {
  id: number;
  prestamoId: number;
  numero: number;
  fechaVencimiento: string;
  montoEsperado: number;
  montoPagado: number;
  estado: EstadoCuota;
  estadoActual?: EstadoCuota;
}

export interface ClienteResumen {
  id: number;
  nombre: string;
  documento: string;
  telefono: string | null;
  cobrador: { id: number; nombre: string } | null;
  prestamosActivos: number;
  saldoPendiente: number;
  cuotasAtrasadas: number;
  proximaCuota: string | null;
  estado: 'ATRASADO' | 'AL_DIA' | 'SIN_PRESTAMOS';
}

export interface Prestamo {
  id: number;
  clienteId: number;
  capital: number;
  tasaMensual: number;
  plazoDias: number;
  numeroCuotas: number;
  frecuenciaCuota: FrecuenciaCuota;
  fechaInicio: string;
  montoInteres: number;
  montoTotal: number;
  saldoPendiente?: number;
  estado: EstadoPrestamo;
  createdAt: string;
  cliente?: Cliente;
  cuotas?: Cuota[];
}
