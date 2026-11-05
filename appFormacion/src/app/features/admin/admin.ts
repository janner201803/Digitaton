import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface FilaReporte {
  user_id: string;
  email: string;
  fecha_registro: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ultima_actividad: string | null;
  niveles_completados: number;
  puntos_totales: number;
  estrellas_totales: number;
  intentos_totales: number;
  curso_completado: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  filas = signal<FilaReporte[]>([]);
  cargando = signal(true);
  error = signal('');
  busqueda = signal('');
  estado = signal('todos');
  desde = signal('');
  hasta = signal('');
  generandoPdf = signal(false);

  filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const desde = this.desde() ? new Date(this.desde() + 'T00:00:00').getTime() : null;
    const hasta = this.hasta() ? new Date(this.hasta() + 'T23:59:59').getTime() : null;
    return this.filas().filter((f) => {
      if (q && !f.email.toLowerCase().includes(q)) return false;
      if (this.estado() === 'completo' && !f.curso_completado) return false;
      if (this.estado() === 'progreso' && (f.curso_completado || f.niveles_completados === 0)) return false;
      if (this.estado() === 'sin_iniciar' && f.niveles_completados > 0) return false;
      if (desde || hasta) {
        if (!f.fecha_inicio) return false;
        const t = new Date(f.fecha_inicio).getTime();
        if (desde && t < desde) return false;
        if (hasta && t > hasta) return false;
      }
      return true;
    });
  });

  resumen = computed(() => {
    const f = this.filtradas();
    return {
      total: f.length,
      completaron: f.filter((x) => x.curso_completado).length,
      promedio: f.length ? Math.round(f.reduce((s, x) => s + x.puntos_totales, 0) / f.length) : 0
    };
  });

  async ngOnInit() {
    const { reporte, error } = await this.auth.obtenerReporteAdmin();
    if (error) this.error.set((error as { message?: string }).message ?? 'No se pudo cargar el reporte');
    this.filas.set(reporte as FilaReporte[]);
    this.cargando.set(false);
  }

  valor(ev: Event) {
    return (ev.target as HTMLInputElement).value;
  }

  async exportarPdf() {
    this.generandoPdf.set(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const fecha = (v: string | null, vacio: string) =>
        v ? new Date(v).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : vacio;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const resumen = this.resumen();

      doc.setFontSize(16);
      doc.text('Reporte de estudiantes', 40, 40);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 40, 58);
      doc.text(
        `Estudiantes: ${resumen.total}   Completaron: ${resumen.completaron}   Puntos promedio: ${resumen.promedio}`,
        40,
        74
      );

      autoTable(doc, {
        startY: 90,
        head: [['Correo', 'Inicio', 'Fin', 'Última actividad', 'Niveles', 'Puntos', 'Estrellas', 'Intentos']],
        body: this.filtradas().map((f) => [
          f.email,
          fecha(f.fecha_inicio, 'No ha iniciado'),
          fecha(f.fecha_fin, 'En curso'),
          fecha(f.ultima_actividad, '—'),
          `${f.niveles_completados}/20`,
          String(f.puntos_totales),
          String(f.estrellas_totales),
          String(f.intentos_totales)
        ]),
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [224, 109, 6], textColor: [28, 28, 28] },
        alternateRowStyles: { fillColor: [255, 235, 181] }
      });

      doc.save(`reporte-estudiantes-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      this.generandoPdf.set(false);
    }
  }

  irAInicio() {
    void this.router.navigate(['/inicio']);
  }

  async cerrarSesion() {
    const error = await this.auth.cerrarSesion();
    if (!error) await this.router.navigate(['/login']);
  }
}