import { Injectable } from '@angular/core';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  // Iniciar sesión
  async iniciarSesion(email: string, password: string) {

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    return { data, error };
  }

  // Verificar si existe una sesión
  async estaAutenticado(): Promise<boolean> {

    const { data, error } = await this.supabase.auth.getSession();

    return !error && !!data.session;
  }

  // Obtener usuario actual
  async obtenerUsuario() {

    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  }

  async obtenerTomosCompletados(): Promise<{ tomos: number[]; error: unknown }> {
    try {
      const { data: { session }, error: userError } = await this.supabase.auth.getSession();
      const user = session?.user;
      if (userError || !user) return { tomos: [], error: userError ?? new Error('No hay una sesión activa') };
      const { data, error } = await this.supabase
        .from('progreso_tomos')
        .select('tomo_id')
        .eq('user_id', user.id);
      const tomos = (data ?? []).map((row) => Number(row.tomo_id));
      if (!error) void this.actualizarCacheTomos(tomos, user.id);
      return { tomos, error };
    } catch (error) {
      return { tomos: [], error };
    }
  }

  async obtenerTomosCacheados(): Promise<number[]> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.user) return [];
    try {
      const cached = localStorage.getItem(`progreso-tomos-${session.user.id}`);
      return cached ? JSON.parse(cached) as number[] : [];
    } catch { return []; }
  }

  async actualizarCacheTomos(tomos: number[], userId?: string) {
    const sessionUserId = userId ?? (await this.supabase.auth.getSession()).data.session?.user.id;
    if (!sessionUserId) return;
    try { localStorage.setItem(`progreso-tomos-${sessionUserId}`, JSON.stringify(tomos)); } catch { /* El progreso remoto sigue funcionando sin caché local. */ }
  }

  async sincronizarTomosCacheados() {
    const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
    if (sessionError || !session?.user) return { error: sessionError ?? new Error('No hay una sesión activa') };
    const cached = await this.obtenerTomosCacheados();
    if (!cached.length) return { error: null };
    const { error } = await this.supabase.from('progreso_tomos').upsert(
      cached.map((tomo_id) => ({ user_id: session.user.id, tomo_id })),
      { onConflict: 'user_id,tomo_id', ignoreDuplicates: true }
    );
    return { error };
  }

  async marcarTomoCompletado(tomoId: number) {
    try {
      const { data: { session }, error: userError } = await this.supabase.auth.getSession();
      const user = session?.user;
      if (userError || !user) return { error: userError ?? new Error('No hay una sesión activa') };
      const { error } = await this.supabase.from('progreso_tomos').upsert(
        { user_id: user.id, tomo_id: tomoId },
        { onConflict: 'user_id,tomo_id', ignoreDuplicates: true }
      );
      if (!error) {
        const tomos = await this.obtenerTomosCacheados();
        if (!tomos.includes(tomoId)) await this.actualizarCacheTomos([...tomos, tomoId]);
      }
      return { error };
    } catch (error) {
      return { error };
    }
  }

  async observarCambiosProgreso(onChange: () => void): Promise<{ channel: RealtimeChannel | null; error: unknown }> {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    const user = session?.user;
    if (error || !user) return { channel: null, error: error ?? new Error('No hay una sesión activa') };

    const channel = this.supabase
      .channel(`progreso-tomos-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'progreso_tomos',
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

  async registrarUsuario(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
        email,
        password
    });

    return { data, error };
    }

  // Cerrar sesión
  async cerrarSesion() {

    const { error } = await this.supabase.auth.signOut();

    return error;
  }
}
