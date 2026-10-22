import { CdkMenuTrigger } from '@angular/cdk/menu';
import { httpResource } from '@angular/common/http';
import {
  Component,
  TemplateRef,
  ViewChild,
  afterNextRender,
  inject,
  injectAsync,
  signal,
} from '@angular/core';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DialogService,
  Divider,
  EmptyState,
  FormField,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  TextInput,
  ToastService,
  Tooltip,
} from '@shared/ui';
import type { BadgeTono, ButtonVariant } from '@shared/ui';
import type { DatosLaboratorio } from './lab.interceptor';
import type { V22LabService } from './v22-lab.service';

interface Token {
  readonly name: string;
  readonly token: string;
  readonly uso: string;
}

interface PasoEscala extends Token {
  readonly display: boolean;
}

/**
 * Banco de pruebas visual del design system.
 *
 * No es una página de producto: es el sitio donde se comprueba que los tokens
 * existen, se ven como se decidió y no se ha colado ningún valor suelto.
 *
 * Los hexadecimales no se escriben aquí: se leen en tiempo de ejecución de las
 * custom properties. Si un token desaparece, esta página lo delata.
 */
@Component({
  selector: 'app-kitchen-sink',
  imports: [
    Avatar,
    Badge,
    Button,
    Card,
    CdkMenuTrigger,
    Divider,
    EmptyState,
    FormField,
    IconButton,
    Menu,
    MenuItem,
    Skeleton,
    TextInput,
    Tooltip,
  ],
  templateUrl: './kitchen-sink.html',
  styleUrl: './kitchen-sink.css',
})
export default class KitchenSinkPage {
  private readonly dialogos = inject(DialogService);
  private readonly avisos = inject(ToastService);

  /** `injectAsync` carga el servicio solo cuando alguien pulsa el botón. */
  private readonly cargarLaboratorio = injectAsync<V22LabService>(() =>
    import('./v22-lab.service').then((modulo) => modulo.V22LabService),
  );

  protected readonly mensajeLaboratorio = signal('');
  protected readonly laboratorioHttp = httpResource<DatosLaboratorio>(() => '/api/laboratorio');

  @ViewChild('contenidoDialogo', { static: true })
  private contenidoDialogo!: TemplateRef<unknown>;

  protected readonly valores = signal<Record<string, string>>({});

  protected async probarInjectAsync(): Promise<void> {
    const servicio = await this.cargarLaboratorio();
    this.mensajeLaboratorio.set(servicio.mensaje);
  }

  protected recargarLaboratorioHttp(): void {
    this.laboratorioHttp.reload();
  }

  protected abrirDialogo(): void {
    this.dialogos.abrir('Renombrar tablero', this.contenidoDialogo);
  }

  protected avisar(): void {
    this.avisos.mostrar('Tarea guardada', 'acento');
  }

  protected avisarError(): void {
    this.avisos.mostrar('No se pudo guardar: revisa la conexión', 'peligro');
  }

  protected readonly variantesBoton: readonly ButtonVariant[] = [
    'primary',
    'secondary',
    'ghost',
    'danger',
  ];

  protected readonly tonosBadge: readonly BadgeTono[] = [
    'neutro',
    'acento',
    'signal',
    'peligro',
    'info',
  ];

  protected readonly primitivos: readonly Token[] = [
    { name: 'viruta-50', token: '--viruta-50', uso: 'superficie elevada' },
    { name: 'viruta-100', token: '--viruta-100', uso: 'superficie base' },
    { name: 'viruta-200', token: '--viruta-200', uso: 'superficie hundida' },
    { name: 'madera-500', token: '--madera-500', uso: 'secundario' },
    { name: 'madera-700', token: '--madera-700', uso: 'texto secundario' },
    { name: 'hierro-900', token: '--hierro-900', uso: 'texto principal' },
    { name: 'hierro-600', token: '--hierro-600', uso: 'texto atenuado' },
    { name: 'verde-600', token: '--verde-600', uso: 'acento' },
    { name: 'verde-700', token: '--verde-700', uso: 'acento hover' },
    { name: 'cinta-500', token: '--cinta-500', uso: 'señal' },
    { name: 'tiza-600', token: '--tiza-600', uso: 'información' },
    { name: 'lapiz-600', token: '--lapiz-600', uso: 'destructivo' },
  ];

  protected readonly turnos: readonly Token[] = [
    { name: 'turno-verde', token: '--turno-verde', uso: 'persona 1' },
    { name: 'turno-cinta', token: '--turno-cinta', uso: 'persona 2' },
    { name: 'turno-madera', token: '--turno-madera', uso: 'persona 3' },
    { name: 'turno-tiza', token: '--turno-tiza', uso: 'persona 4' },
    { name: 'turno-lapiz', token: '--turno-lapiz', uso: 'persona 5' },
  ];

  protected readonly escala: readonly PasoEscala[] = [
    { name: 'caption', token: '--text-caption', uso: '11px · rótulos', display: false },
    { name: 'body', token: '--text-body', uso: '14px · texto', display: false },
    { name: 'h4', token: '--text-h4', uso: '16px', display: true },
    { name: 'h3', token: '--text-h3', uso: '18px', display: true },
    { name: 'h2', token: '--text-h2', uso: '22px', display: true },
    { name: 'h1', token: '--text-h1', uso: '28px', display: true },
    { name: 'display', token: '--text-display', uso: '44px', display: true },
  ];

  protected readonly espacios: readonly Token[] = [
    { name: 'space-1', token: '--space-1', uso: '4px' },
    { name: 'space-2', token: '--space-2', uso: '8px' },
    { name: 'space-3', token: '--space-3', uso: '12px' },
    { name: 'space-4', token: '--space-4', uso: '16px' },
    { name: 'space-6', token: '--space-6', uso: '24px' },
    { name: 'space-8', token: '--space-8', uso: '32px' },
    { name: 'space-12', token: '--space-12', uso: '48px' },
    { name: 'space-16', token: '--space-16', uso: '64px' },
  ];

  protected readonly radios: readonly Token[] = [
    { name: 'radius-sm', token: '--radius-sm', uso: 'controles' },
    { name: 'radius-md', token: '--radius-md', uso: 'tarjetas y paneles' },
    { name: 'radius-lg', token: '--radius-lg', uso: 'diálogos' },
  ];

  constructor() {
    afterNextRender(() => {
      const styles = getComputedStyle(document.documentElement);
      const leidos: Record<string, string> = {};

      for (const token of [...this.primitivos, ...this.turnos]) {
        leidos[token.token] = styles.getPropertyValue(token.token).trim();
      }

      this.valores.set(leidos);
    });
  }

  protected valor(token: string): string {
    // `||` y no `??`: una custom property no definida devuelve cadena vacía,
    // no undefined. Si se colara un hueco, la página mentiría.
    return this.valores()[token]?.trim() || '—';
  }
}
