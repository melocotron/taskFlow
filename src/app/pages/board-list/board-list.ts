import type { DialogRef } from '@angular/cdk/dialog';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@entities/auth';
import { BoardStore, ImportadorLocal, esMiembro, rolEn } from '@entities/board';
import type { Board, ResultadoImportacion } from '@entities/board';
import { MemberStore, etiquetaRol } from '@entities/member';
import type { Rol } from '@entities/member';
import { BoardForm } from '@features/board-form';
import type { DatosTablero } from '@features/board-form';
import { turnoPorIndice } from '@shared/lib/turnos';
import {
  Avatar,
  Button,
  Card,
  DialogService,
  EmptyState,
  Menu,
  MenuItem,
  Skeleton,
  ToastService,
} from '@shared/ui';
import type { DialogContent } from '@shared/ui';

/**
 * Pantalla de arranque: la lista de tableros.
 *
 * Solo aparecen los tableros a los que la persona tiene acceso. El rol depende de cada
 * uno: la misma sesión puede ser administradora aquí y observadora allá, así que la
 * tarjeta dice cuál es el tuyo.
 *
 * Cualquier persona puede crear un tablero; quien lo crea entra como administrador.
 * Invitar al resto es una acción del tablero, no un permiso global.
 */
@Component({
  selector: 'app-board-list',
  imports: [
    Avatar,
    BoardForm,
    Button,
    Card,
    CdkMenuTrigger,
    EmptyState,
    Menu,
    MenuItem,
    RouterLink,
    Skeleton,
  ],
  templateUrl: './board-list.html',
  styleUrl: './board-list.css',
})
export default class BoardListPage {
  private readonly tableros = inject(BoardStore);
  private readonly avisos = inject(ToastService);
  private readonly equipo = inject(MemberStore);
  private readonly auth = inject(AuthService);
  private readonly dialogos = inject(DialogService);
  private readonly rutas = inject(Router);
  private readonly importador = inject(ImportadorLocal);

  /** Referencia al diálogo abierto, para poder cerrarlo desde su propio contenido. */
  private referencia: DialogRef<unknown, DialogContent> | null = null;

  protected readonly plantillaNuevo = viewChild.required<TemplateRef<unknown>>('plantillaNuevo');

  protected readonly cargando = this.tableros.cargando;
  protected readonly conFallo = this.tableros.conFallo;
  protected readonly error = this.tableros.error;

  /** Solo se ofrece si la versión 1.0 dejó tableros o tarjetas en este navegador. */
  protected readonly datosLocales = signal(this.importador.hayDatos());

  /** Los activos que además son tuyos: los demás no existen para esta sesión. */
  protected readonly misTableros = computed(() =>
    this.tableros.activos().filter((board) => esMiembro(board, this.equipo.sesion().id)),
  );

  protected readonly cuantos = computed(() => this.misTableros().length);

  protected readonly sesion = this.equipo.sesion;

  /** Etiqueta legible del rol, para la tarjeta de cada tablero. */
  protected etiqueta = etiquetaRol;

  protected turno(indice: number) {
    return turnoPorIndice(indice);
  }

  protected rolDe(board: Board): Rol | null {
    return rolEn(board, this.sesion().id);
  }

  /** Cierra la sesión en el servidor y en el store de identidad local. */
  protected async salir(): Promise<void> {
    try {
      await this.auth.salir();
    } finally {
      this.equipo.salir();
      await this.rutas.navigate(['/entrar']);
    }
  }

  protected nuevoTablero(): void {
    this.referencia = this.dialogos.abrir('Nuevo tablero', this.plantillaNuevo());
  }

  /** Recibe el nombre ya validado y recortado por el formulario. */
  protected async crearTablero(datos: DatosTablero): Promise<void> {
    try {
      const board = await this.tableros.crear(datos.titulo);

      this.avisos.mostrar(`«${board.titulo}» creado`, 'acento');
      this.cerrarNuevo();
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo crear el tablero',
        'peligro',
      );
    }
  }

  protected cerrarNuevo(): void {
    this.referencia?.close();
    this.referencia = null;
  }

  protected reintentar(): void {
    void this.tableros.cargar();
  }

  /**
   * Importa el trabajo heredado y refresca la lista.
   *
   * El aviso cuenta también lo que el servidor omitió: si había datos corruptos, la
   * persona sabe que no todo entró y no se queda con la duda.
   */
  protected async importarDatos(): Promise<void> {
    try {
      const resultado = await this.importador.importar();

      this.datosLocales.set(false);

      if (!resultado) {
        this.avisos.mostrar('No quedaban datos locales que importar', 'neutro');
        return;
      }

      this.avisos.mostrar(
        describirImportacion(resultado),
        resultado.tablerosOmitidos > 0 || resultado.tareasOmitidas > 0 ? 'peligro' : 'acento',
      );
      await this.tableros.cargar();
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudieron importar los datos locales',
        'peligro',
      );
    }
  }
}

function describirImportacion(resultado: ResultadoImportacion): string {
  const tableros = plural(resultado.tablerosImportados, 'tablero', 'tableros');
  const tareas = plural(resultado.tareasImportadas, 'tarjeta', 'tarjetas');
  const omitidos = resultado.tablerosOmitidos + resultado.tareasOmitidas;

  return omitidos > 0
    ? `Importados ${tableros} y ${tareas}; ${omitidos} sin recuperar`
    : `Importados ${tableros} y ${tareas}`;
}

function plural(cantidad: number, singular: string, pluralizado: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : pluralizado}`;
}
