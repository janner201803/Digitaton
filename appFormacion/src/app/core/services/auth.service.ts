import { Injectable } from '@angular/core';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../enviroments/enviroment';

export interface ResultadoTomo {
  tomo_id: number;
  intentos: number;
  puntos: number;
  estrellas: number;
  completado: boolean;
}

export function calcularPuntos(intento: number): number {
  if (intento <= 1) return 100;
  if (intento === 2) return 80;
  if (intento <= 4) return 60;
  return 20;
}

export function calcularEstrellas(intento: number): number {
  return calcularPuntos(intento) / 20;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  async iniciarSesion(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    return { data, error };
  }

  async estaAutenticado(): Promise<boolean> {
    const { data, error } = await this.supabase.auth.getSession();

    return !error && !!data.session;
  }

  async obtenerUsuario() {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  }

  async obtenerUserId(): Promise<string | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.user.id ?? null;
  }

  async obtenerResultados(): Promise<{ resultados: ResultadoTomo[]; error: unknown }> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session?.user) return { resultados: [], error: new Error('No hay una sesión activa') };
      const { data, error } = await this.supabase
        .from('resultados_tomos')
        .select('tomo_id, intentos, puntos, estrellas, completado')
        .eq('user_id', session.user.id);
      return { resultados: (data ?? []) as ResultadoTomo[], error };
    } catch (error) {
      return { resultados: [], error };
    }
  }

  async registrarIntento(tomoId: number, correcto: boolean): Promise<{ resultado: ResultadoTomo | null; error: unknown }> {
    try {
      const { data, error } = await this.supabase.rpc('registrar_intento', {
        p_tomo_id: tomoId,
        p_correcto: correcto
      });
      return { resultado: error ? null : (data as ResultadoTomo), error };
    } catch (error) {
      return { resultado: null, error };
    }
  }

  async observarCambiosProgreso(onChange: () => void): Promise<{ channel: RealtimeChannel | null; error: unknown }> {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    const user = session?.user;
    if (error || !user) return { channel: null, error: error ?? new Error('No hay una sesión activa') };

    const channel = this.supabase
      .channel(`resultados-tomos-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'resultados_tomos',
        filter: `user_id=eq.${user.id}`
      }, onChange)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onChange();
      });

    return { channel, error: null };
  }

  async dejarDeObservarProgreso(channel: RealtimeChannel | null) {
    if (channel) await this.supabase.removeChannel(channel);
  }

  async esAdmin(): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('es_admin');
    return !error && data === true;
  }

  async obtenerReporteAdmin() {
    const { data, error } = await this.supabase.rpc('reporte_admin');
    return { reporte: data ?? [], error };
  }

  async registrarUsuario(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });

    return { data, error };
  }

  async cerrarSesion() {
    const { error } = await this.supabase.auth.signOut();

    return error;
  }
}