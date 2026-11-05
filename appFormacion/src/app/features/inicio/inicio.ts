import { ChangeDetectorRef, Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../core/services/auth.service';

interface Tomo {
  id: number;
  title: string;
  description: string;
  reading: string;
  question: string;
  answers: string[];
  correctAnswer: number;
}

const temas = [
  ['Pluralismo', 'Conoce el valor de nuestras diferencias.'],
  ['Ciudadanía', 'Participa y construye en comunidad.'],
  ['Convivencia', 'Imagina nuevas formas de vivir juntos.'],
  ['Identidad', 'Reconoce las historias que nos forman.'],
  ['Diversidad', 'Descubre la riqueza de distintas perspectivas.'],
  ['Diálogo', 'Escucha para comprender otras ideas.'],
  ['Empatía', 'Mira el mundo desde la experiencia de otras personas.'],
  ['Derechos humanos', 'Conoce las bases de una vida digna.'],
  ['Igualdad', 'Identifica oportunidades para una sociedad más justa.'],
  ['Equidad', 'Comprende cómo responder a distintas necesidades.'],
  ['Inclusión', 'Construye espacios donde todas las personas participen.'],
  ['Interculturalidad', 'Aprende del encuentro entre culturas.'],
  ['Participación', 'Haz parte de las decisiones de tu comunidad.'],
  ['Democracia', 'Explora cómo construimos acuerdos colectivos.'],
  ['Conflicto', 'Transforma los desacuerdos mediante el diálogo.'],
  ['Paz', 'Reconoce acciones cotidianas para construir paz.'],
  ['Corresponsabilidad', 'Descubre cómo aportar al bienestar común.'],
  ['Pensamiento crítico', 'Analiza ideas y situaciones con curiosidad.'],
  ['Acción colectiva', 'Une esfuerzos para generar cambios.'],
  ['Transformación social', 'Proyecta una sociedad más justa e inclusiva.']
] as const;

@Component({
  selector: 'app-inicio', standalone: true, imports: [RouterLink],
  templateUrl: './inicio.html', styleUrl: './inicio.css'
})
export class Inicio implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  tomos: Tomo[] = temas.map(([title, description], index) => ({
    id: index + 1, title, description,
    reading: `En este nivel exploraremos ${title.toLowerCase()} y su relación con la vida en comunidad. Observa el video y piensa en las experiencias que conoces. Las diferencias de opinión, origen y experiencia pueden ayudarnos a comprender mejor los retos compartidos y a construir respuestas respetuosas.`,
    question: `¿Qué propone este nivel sobre ${title.toLowerCase()}?`,
    answers: [
      'Escuchar, reflexionar y participar en la construcción de una comunidad más justa.',
      'Evitar conversar con personas que tienen experiencias distintas.',
      'Dejar todas las decisiones en manos de una sola persona.'
    ], correctAnswer: 0
  }));
  completed = new Set<number>();
  verifiedTomoIds = new Set<number>();
  showCompletionModal = false;
  selectedTomo: Tomo | null = null;
  answer = -1;
  feedback = '';
  // El primer tomo siempre debe poder abrirse aunque Supabase tarde en cargar el progreso.
  loading = true;
  saving = false;
  loadError = '';
  private progressChannel: RealtimeChannel | null = null;

  async ngOnInit() {
    this.completed = new Set(await this.authService.obtenerTomosCacheados());
    this.loading = false;
    this.changeDetector.markForCheck();
    void this.refreshProgress();
    void this.startProgressSubscription();
    void this.authService.sincronizarTomosCacheados().then(({ error }) => {
      if (error) console.error('No se pudo sincronizar el progreso local con Supabase:', error);
    });
  }

  private async startProgressSubscription() {
    const subscription = await this.authService.observarCambiosProgreso(() => { void this.refreshProgress(); });
    this.progressChannel = subscription.channel;
    if (subscription.error) this.loadError = 'No se pudo activar la actualización en tiempo real. Revisa la sesión y la publicación supabase_realtime.';
    this.changeDetector.markForCheck();
  }

  async ngOnDestroy() {
    await this.authService.dejarDeObservarProgreso(this.progressChannel);
  }

  @HostListener('window:focus')
  onWindowFocus() { void this.refreshProgress(); }

  private async refreshProgress() {
    try {
      const result = await this.authService.obtenerTomosCompletados();
      this.loading = false;
      if (result.error) {
        const detail = result.error instanceof Error ? result.error.message : String(result.error);
        this.loadError = `No se pudo cargar el progreso desde Supabase: ${detail}`;
        console.error(this.loadError, result.error);
        this.changeDetector.markForCheck();
        return;
      }
      this.loadError = '';
      this.completed = new Set([...this.completed, ...result.tomos]);
      void this.authService.actualizarCacheTomos([...this.completed]);
      this.changeDetector.markForCheck();
    } catch (error) {
      this.loading = false;
      this.loadError = 'Falló la conexión al cargar el progreso. Revisa tu internet y la configuración de Supabase.';
      console.error(this.loadError, error);
      this.changeDetector.markForCheck();
    }
  }

  get unlockedCount() { return Math.min(20, this.completed.size + 1); }
  get progress() { return Math.round(this.completed.size / 20 * 100); }
  isUnlocked(id: number) { return id === 1 || id <= this.unlockedCount; }
  openTomo(tomo: Tomo) {
    if (!this.isUnlocked(tomo.id)) return;
    this.selectedTomo = tomo; this.answer = -1; this.feedback = '';
  }
  closeTomo() { this.selectedTomo = null; }
  closeCompletionModal() { this.showCompletionModal = false; }
  chooseAnswer(index: number) { this.answer = index; this.feedback = ''; }
  async submitAnswer() {
    const tomo = this.selectedTomo;
    if (!tomo || this.answer < 0 || this.saving || this.verifiedTomoIds.has(tomo.id)) return;
    if (this.answer !== tomo.correctAnswer) { this.feedback = 'Esa respuesta no es correcta. Revisa el contenido e inténtalo de nuevo.'; return; }
    if (this.completed.has(tomo.id)) {
      this.verifiedTomoIds.add(tomo.id);
      this.feedback = '¡Correcto! Este nivel ya está completado.';
      return;
    }

    this.verifiedTomoIds.add(tomo.id);
    this.saving = true;
    this.completed = new Set([...this.completed, tomo.id]);
    this.feedback = tomo.id < 20 ? '¡Correcto! El siguiente nivel ya está desbloqueado.' : '¡Felicitaciones! Completaste los 20 niveles.';
    if (tomo.id === this.tomos.length) {
      this.selectedTomo = null;
      this.showCompletionModal = true;
    }
    this.changeDetector.markForCheck();
    try {
      await this.authService.actualizarCacheTomos([...this.completed]);
      const timeout = new Promise<{ error: Error }>((resolve) => setTimeout(() => resolve({ error: new Error('timeout') }), 8000));
      const result = await Promise.race([this.authService.marcarTomoCompletado(tomo.id), timeout]);
      if (result.error) {
        const errorMessage = result.error instanceof Error ? result.error.message : String(result.error);
        this.feedback = errorMessage === 'timeout'
          ? '¡Respuesta correcta! El progreso quedó guardado en este dispositivo; Supabase está tardando en sincronizar.'
          : `¡Respuesta correcta! No se pudo guardar en Supabase: ${errorMessage}.`;
      }
    } finally {
      this.saving = false;
      this.changeDetector.markForCheck();
    }
  }
  async cerrarSesion() {
    const error = await this.authService.cerrarSesion();
    if (!error) await this.router.navigate(['/login']);
  }
}
