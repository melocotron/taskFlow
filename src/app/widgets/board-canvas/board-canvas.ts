import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import type { DialogRef } from '@angular/cdk/dialog';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import {
  Component,
  Signal,
  TemplateRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { Board } from '@entities/board';
import { MemberStore } from '@entities/member';
import { TaskStore } from '@entities/task';
import type { Task } from '@entities/task';
import { TaskForm } from '@features/task-form';
import type { DatosTarjeta } from '@features/task-form';
import { turnoPorIndice } from '@shared/lib/turnos';
import type { Turno } from '@shared/lib/turnos';
import {
  Avatar,
  Button,
  Card,
  DialogService,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  ToastService,
} from '@shared/ui';
import type { DialogContent } from '@shared/ui';

/**
 * Lienzo de un tablero: las columnas del flujo con sus tarjetas dentro.
 *
 * Es un widget y no una página porque no sabe de rutas ni de sesión: recibe el tablero
 * y compone entidades. El día que exista una vista de «mis tarjetas», se reutiliza.
 *
 * La estructura (columnas) se pinta siempre, incluso mientras cargan las tarjetas: así
 * el esqueleto no miente sobre la forma del tablero. Cada columna tiene su propio
 * desplazamiento, de modo que mover una no arrastra a las demás.
 *
 * Mover una tarjeta tiene dos caminos y **una sola** operación de dominio: el arrastre
 * del CDK y el menú «mover a…» de cada tarjeta llaman a `TaskStore.mover()`. El menú no
 * es un adorno: el arrastre no existe para el teclado.
 *
 * Crear y editar viven en `features/task-form`: este widget solo abre el diálogo, le
 * pasa los datos de partida y aplica lo que devuelve. La validación no se duplica aquí.
 */
@Component({
  selector: 'app-board-canvas',
  imports: [
    Avatar,
    Button,
    Card,
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    CdkMenuTrigger,
    IconButton,
    Menu,
    MenuItem,
    Skeleton,
    TaskForm,
  ],
  templateUrl: './board-canvas.html',
  styleUrl: './board-canvas.css',
})
export class BoardCanvas {
  private readonly tareas = inject(TaskStore);
  private readonly equipo = inject(MemberStore);
  private readonly avisos = inject(ToastService);
  private readonly dialogos = inject(DialogService);

  readonly board = input.required<Board>();

  /** Diálogo del formulario, para poder cerrarlo desde sus propios botones. */
  private referencia: DialogRef<unknown, DialogContent> | null = null;

  protected readonly plantillaTarjeta =
    viewChild.required<TemplateRef<unknown>>('plantillaTarjeta');

  /** Tarjeta que se está editando; `null` mientras se crea. */
  protected readonly tareaEnEdicion = signal<Task | null>(null);

  /** Columna donde nacerá la tarjeta nueva. */
  private readonly columnaNueva = signal<string | null>(null);

  protected readonly modoFormulario = computed<'crear' | 'editar'>(() =>
    this.tareaEnEdicion() ? 'editar' : 'crear',
  );

  /** Lo que recibe el formulario al abrirse: vacío al crear, la tarjeta al editar. */
  protected readonly datosIniciales = computed<DatosTarjeta | null>(() => {
    const tarea = this.tareaEnEdicion();

    return tarea
      ? { titulo: tarea.titulo, descripcion: tarea.descripcion, responsable: tarea.responsable }
      : null;
  });

  protected readonly cargando = this.tareas.cargando;
  protected readonly fallo = computed(() => this.tareas.carga() === 'error');
  protected readonly error = this.tareas.error;
  protected readonly puedeEditar = this.equipo.puedeEditar;

  protected readonly total = computed(
    () => this.tareas.tareas().filter((tarea) => tarea.boardId === this.board().id).length,
  );

  /** El store cachea una señal por columna: pedirla en cada render no crea basura. */
  protected tareasDe(columnaId: string): Signal<readonly Task[]> {
    return this.tareas.deColumna(this.board().id, columnaId);
  }

  /** Turno de color de la persona responsable; `null` si no hay o no es del equipo. */
  protected turnoDe(nombre: string | null): Turno | null {
    if (!nombre) {
      return null;
    }

    const indice = this.equipo.miembros().findIndex((miembro) => miembro.nombre === nombre);

    return indice === -1 ? null : turnoPorIndice(indice);
  }

  /** Suelta lo que venía arrastrado: la columna destino la dice la lista que lo recibe. */
  protected soltar(evento: CdkDragDrop<string, string, Task>): void {
    this.moverA(evento.item.data, evento.container.data, evento.currentIndex);
  }

  /**
   * Mueve una tarjeta a otra columna.
   *
   * Sin índice va al final de la columna, que es lo que espera quien elige «mover a…».
   */
  protected moverA(tarea: Task, columnaDestino: string, indice?: number): void {
    // Igual que al crear: la interfaz esconde la acción, pero el método la comprueba.
    if (!this.puedeEditar()) {
      this.avisos.mostrar('Tu rol no permite mover tarjetas', 'peligro');
      return;
    }

    const destino = this.board().columnas.find((columna) => columna.id === columnaDestino);

    if (!destino) {
      return;
    }

    this.tareas.mover(tarea.id, columnaDestino, indice ?? this.tareasDe(columnaDestino)().length);
    this.avisos.mostrar(`«${tarea.titulo}» a ${destino.titulo}`, 'acento');
  }

  protected reintentar(): void {
    void this.tareas.cargar();
  }

  /** Abre el formulario en blanco para la columna indicada. */
  protected nuevaTarjeta(columnaId: string): void {
    // La misma comprobación que al mover: la interfaz esconde el botón, pero el
    // método vuelve a preguntar. Invocado desde la consola, tampoco pasa.
    if (!this.puedeEditar()) {
      this.avisos.mostrar('Tu rol no permite crear tarjetas', 'peligro');
      return;
    }

    const columna = this.board().columnas.find((candidata) => candidata.id === columnaId);

    if (!columna) {
      return;
    }

    this.tareaEnEdicion.set(null);
    this.columnaNueva.set(columnaId);
    this.abrirFormulario(`Nueva tarjeta en ${columna.titulo}`);
  }

  /** Abre el formulario con la tarjeta ya cargada. */
  protected editarTarjeta(tarea: Task): void {
    if (!this.puedeEditar()) {
      this.avisos.mostrar('Tu rol no permite editar tarjetas', 'peligro');
      return;
    }

    this.tareaEnEdicion.set(tarea);
    this.columnaNueva.set(null);
    this.abrirFormulario('Editar tarjeta');
  }

  /**
   * Recibe los datos ya validados y recortados por el formulario.
   *
   * Crear y editar comparten entrada y salida: solo cambia a quién se le pide el
   * cambio al store. Si el store rechaza algo, el aviso lo dice y el diálogo se
   * queda abierto para no perder lo escrito.
   */
  protected guardarTarjeta(datos: DatosTarjeta): void {
    try {
      if (this.modoFormulario() === 'editar') {
        const tarea = this.tareaEnEdicion();

        if (!tarea) {
          return;
        }

        this.tareas.editar(tarea.id, {
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          responsable: datos.responsable,
        });
        this.avisos.mostrar(`«${datos.titulo}» actualizada`, 'acento');
      } else {
        const columnaId = this.columnaNueva();

        if (!columnaId) {
          return;
        }

        this.tareas.crear(this.board().id, columnaId, datos.titulo, {
          descripcion: datos.descripcion,
          responsable: datos.responsable,
        });
        this.avisos.mostrar(`«${datos.titulo}» añadida`, 'acento');
      }

      this.cerrarFormulario();
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo guardar la tarjeta',
        'peligro',
      );
    }
  }

  protected cerrarFormulario(): void {
    this.referencia?.close();
    this.referencia = null;
  }

  private abrirFormulario(titulo: string): void {
    this.referencia = this.dialogos.abrir(titulo, this.plantillaTarjeta());
  }
}
