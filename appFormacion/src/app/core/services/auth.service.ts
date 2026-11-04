import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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