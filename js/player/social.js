// js/player/social.js - Sistema de amigos

export function initFriendsSystem(supabase, userId, nickname) {
  console.log('Iniciando sistema de amigos con:', { userId, nickname, hasSupabase: !!supabase });
  
  if (!supabase || !userId || !nickname) {
    console.log('Sistema de amigos no inicializado: faltan parámetros');
    return null;
  }
  
  // Crear manager de social completo
  window.socialManager = {
    supabase,
    userId,
    nickname,
    friends: [],
    
    // Método para inicializar presencia
    initPresence() {
      // Por ahora solo log
      console.log('Presencia inicializada para:', nickname);
    },
    
    // Obtener lista de amigos
    async getFriends() {
      try {
        // Obtener relaciones de amistad BIDIRECCIONALES
        // Buscar donde yo soy user_id O friend_id
        const { data: friendships, error: friendshipsError } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted');
        
        if (friendshipsError) throw friendshipsError;
        
        if (!friendships || friendships.length === 0) {
          this.friends = [];
          return { success: true, data: [] };
        }
        
        // Obtener los IDs de los amigos (puede ser user_id o friend_id)
        const friendIds = friendships.map(f => {
          // Si yo soy user_id, el amigo es friend_id
          // Si yo soy friend_id, el amigo es user_id
          return f.user_id === userId ? f.friend_id : f.user_id;
        });
        
        // Eliminar duplicados
        const uniqueFriendIds = [...new Set(friendIds)];
        
        // Ahora obtener los datos de los perfiles de los amigos
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, nickname, level, avatar_url')
          .in('user_id', uniqueFriendIds);
        
        if (profilesError) throw profilesError;
        
        // Mapear los datos
        const friends = (profiles || []).map(profile => ({
          user_id: profile.user_id,
          nickname: profile.nickname || 'Usuario',
          level: profile.level || 1,
          avatar_url: profile.avatar_url || null,
          is_online: false // Por ahora siempre offline
        }));
        
        this.friends = friends;
        return { success: true, data: friends };
      } catch (error) {
        console.error('Error obteniendo amigos:', error);
        return { success: false, error };
      }
    },
    
    // Buscar usuarios
    async searchUsers(query) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id, nickname, level, avatar_url')
          .ilike('nickname', `%${query}%`)
          .neq('user_id', userId)
          .limit(10);
        
        if (error) throw error;
        
        // Verificar relación con cada usuario
        for (const user of data || []) {
          const { data: friendship } = await supabase
            .from('friendships')
            .select('status')
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .or(`user_id.eq.${user.user_id},friend_id.eq.${user.user_id}`)
            .single();
          
          user.relationship_status = friendship?.status || null;
        }
        
        return { success: true, data: data || [] };
      } catch (error) {
        console.error('Error buscando usuarios:', error);
        return { success: false, error };
      }
    },
    
    // Enviar solicitud de amistad
    async sendFriendRequest(targetUserId) {
      try {
        console.log('Enviando solicitud de amistad:');
        console.log('  De:', userId);
        console.log('  Para:', targetUserId);
        
        // Verificar si ya existe una solicitud o amistad
        const { data: existing } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .or(`user_id.eq.${targetUserId},friend_id.eq.${targetUserId}`);
        
        console.log('Relaciones existentes:', existing);
        
        // Verificar si ya son amigos o hay solicitud pendiente
        const alreadyFriends = existing?.some(f => 
          ((f.user_id === userId && f.friend_id === targetUserId) ||
           (f.user_id === targetUserId && f.friend_id === userId)) &&
          f.status === 'accepted'
        );
        
        if (alreadyFriends) {
          console.log('Ya son amigos');
          return { success: false, error: 'Ya son amigos' };
        }
        
        const pendingRequest = existing?.some(f => 
          ((f.user_id === userId && f.friend_id === targetUserId) ||
           (f.user_id === targetUserId && f.friend_id === userId)) &&
          f.status === 'pending'
        );
        
        if (pendingRequest) {
          console.log('Ya hay una solicitud pendiente');
          return { success: false, error: 'Ya hay una solicitud pendiente' };
        }
        
        // Enviar solicitud
        const { data, error } = await supabase
          .from('friendships')
          .insert({
            user_id: userId,
            friend_id: targetUserId,
            status: 'pending'
          })
          .select();
        
        console.log('Resultado de inserción:', { data, error });
        
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Error enviando solicitud:', error);
        return { success: false, error };
      }
    },
    
    // Aceptar solicitud de amistad
    async acceptFriendRequest(requestId) {
      try {
        // Primero obtener la solicitud para saber quién la envió
        const { data: request, error: getError } = await supabase
          .from('friendships')
          .select('*')
          .eq('id', requestId)
          .single();
        
        if (getError || !request) throw getError || new Error('Solicitud no encontrada');
        
        // Actualizar la solicitud original a 'accepted'
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId);
        
        if (updateError) throw updateError;
        
        // Crear la relación inversa para que sea bidireccional
        // Solo si no existe ya
        const { data: existingReverse } = await supabase
          .from('friendships')
          .select('id')
          .eq('user_id', request.friend_id)
          .eq('friend_id', request.user_id)
          .single();
        
        if (!existingReverse) {
          const { error: reverseError } = await supabase
            .from('friendships')
            .insert({
              user_id: request.friend_id,
              friend_id: request.user_id,
              status: 'accepted'
            });
          
          if (reverseError) {
            console.warn('No se pudo crear relación inversa:', reverseError);
            // No fallar si no se puede crear la inversa
          }
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error aceptando solicitud:', error);
        return { success: false, error };
      }
    },
    
    // Obtener rankings de amigos
    async getFriendRankings() {
      try {
        // Primero obtener los rankings
        const { data: rankings, error: rankingsError } = await supabase
          .from('friend_rankings')
          .select('*')
          .eq('user_id', userId);
        
        if (rankingsError) throw rankingsError;
        
        if (!rankings || rankings.length === 0) {
          return { success: true, data: [] };
        }
        
        // Obtener los IDs de los amigos
        const friendIds = rankings.map(r => r.friend_id);
        
        // Obtener los perfiles de los amigos
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, nickname, avatar_url, level')
          .in('user_id', friendIds);
        
        if (profilesError) throw profilesError;
        
        // Crear un mapa de perfiles para búsqueda rápida
        const profileMap = {};
        (profiles || []).forEach(p => {
          profileMap[p.user_id] = p;
        });
        
        // Combinar los datos
        const rankingsWithProfiles = rankings.map(r => ({
          friend_id: r.friend_id,
          friend: profileMap[r.friend_id] || {
            nickname: 'Usuario',
            avatar_url: null,
            level: 1
          },
          wins: r.wins || 0,
          losses: r.losses || 0,
          games_played: r.games_played || 0,
          isCurrentUser: false
        }));
        
        return { success: true, data: rankingsWithProfiles };
      } catch (error) {
        console.error('Error obteniendo rankings:', error);
        return { success: false, error };
      }
    },
    
    // Invitar a juego asíncrono
    async inviteToAsyncGame(friendId, questions) {
      try {
        // Por ahora solo retornar un placeholder
        return { 
          success: false, 
          error: 'Juegos asíncronos próximamente' 
        };
      } catch (error) {
        return { success: false, error };
      }
    },
    
    // Bloquear usuario
    async blockUser(targetUserId) {
      try {
        // Eliminar AMBAS direcciones de la amistad
        // Primera dirección
        await supabase
          .from('friendships')
          .delete()
          .eq('user_id', userId)
          .eq('friend_id', targetUserId);
        
        // Segunda dirección
        await supabase
          .from('friendships')
          .delete()
          .eq('user_id', targetUserId)
          .eq('friend_id', userId);
        
        // Luego crear registro de bloqueo (solo en una dirección)
        const { error } = await supabase
          .from('friendships')
          .insert({
            user_id: userId,
            friend_id: targetUserId,
            status: 'blocked'
          });
        
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Error bloqueando usuario:', error);
        return { success: false, error };
      }
    },
    
    // Eliminar amistad (sin bloquear)
    async removeFriend(targetUserId) {
      try {
        // Eliminar AMBAS direcciones de la amistad
        const { error: error1 } = await supabase
          .from('friendships')
          .delete()
          .eq('user_id', userId)
          .eq('friend_id', targetUserId);
        
        const { error: error2 } = await supabase
          .from('friendships')
          .delete()
          .eq('user_id', targetUserId)
          .eq('friend_id', userId);
        
        if (error1 || error2) throw error1 || error2;
        return { success: true };
      } catch (error) {
        console.error('Error eliminando amistad:', error);
        return { success: false, error };
      }
    },
    
    async inviteToSyncGame(friendId, roomCode) {
      try {
        console.log('Enviando invitación de juego:');
        console.log('  - Para amigo:', friendId);
        console.log('  - Código de sala:', roomCode);
        
        const { data, error } = await supabase
          .from('game_invitations')
          .insert({
            from_user_id: userId,
            to_user_id: friendId,
            room_code: roomCode,
            game_type: 'sync', // Cambiado de 'vs' a 'sync'
            status: 'pending',
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos
          })
          .select();
        
        console.log('Resultado de invitación:', { data, error });
        
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Error enviando invitación:', error);
        return { success: false, error };
      }
    },
    
    async updateFriendRanking(friendId, won) {
      try {
        // Actualizar ranking con amigo
        const { data: existing } = await supabase
          .from('friend_rankings')
          .select('*')
          .eq('user_id', userId)
          .eq('friend_id', friendId)
          .single();
        
        if (existing) {
          // Actualizar existente
          const updates = {
            games_played: existing.games_played + 1,
            wins: existing.wins + (won ? 1 : 0),
            losses: existing.losses + (won ? 0 : 1),
            updated_at: new Date().toISOString()
          };
          
          await supabase
            .from('friend_rankings')
            .update(updates)
            .eq('id', existing.id);
        } else {
          // Crear nuevo
          await supabase
            .from('friend_rankings')
            .insert({
              user_id: userId,
              friend_id: friendId,
              games_played: 1,
              wins: won ? 1 : 0,
              losses: won ? 0 : 1
            });
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error actualizando ranking:', error);
        return { success: false, error };
      }
    }
  };
  
  console.log('Sistema de amigos inicializado para:', nickname);
  
  // Retornar el manager para que pueda ser usado
  return window.socialManager;
}

// Hacer función disponible globalmente
window.initFriendsSystem = initFriendsSystem;
