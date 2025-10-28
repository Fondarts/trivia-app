// js/player/social.js - Sistema de amigos

export function initFriendsSystem(supabase, userId, nickname) {
  console.log('Iniciando sistema de amigos con:', { userId, nickname, hasSupabase: !!supabase });
  
  if (!supabase || !userId || !nickname) {
    console.log('Sistema de amigos no inicializado: faltan parámetros');
    return null;
  }

  // Verificar conectividad antes de inicializar
  if (!navigator.onLine) {
    console.log('⚠️ Sin conexión a internet - sistema de amigos deshabilitado');
    return null;
  }
  
  // Crear manager de social completo
  window.socialManager = {
    supabase,
    userId,
    nickname,
    friends: [],
    presenceChannel: null,
    onlineUserIds: new Set(),
    
    // Método para inicializar presencia
    initPresence() {
      try {
        if (this.presenceChannel) {
          console.log('Presencia ya inicializada');
          return;
        }
        const ch = supabase.channel('presence:global', { config: { presence: { key: userId } } });
        const onSync = () => {
          const state = ch.presenceState();
          // state es un objeto { userId: [metas...] }
          this.onlineUserIds = new Set(Object.keys(state));
          // Notificar a la UI
          window.dispatchEvent(new CustomEvent('friends:presence-updated'));
          console.log('Presencia sync. Online:', Array.from(this.onlineUserIds));
        };
        ch.on('presence', { event: 'sync' }, onSync);
        ch.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await ch.track({ nickname: this.nickname, at: Date.now() });
            // Forzar una primera sincronización tras suscribirse
            setTimeout(() => {
              const state = ch.presenceState();
              this.onlineUserIds = new Set(Object.keys(state));
              window.dispatchEvent(new CustomEvent('friends:presence-updated'));
            }, 200);
          }
        });
        this.presenceChannel = ch;
        // Re-track al volver a la pestaña/app
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.presenceChannel) {
            this.presenceChannel.track({ nickname: this.nickname, at: Date.now() }).catch(()=>{});
          }
        });
        window.addEventListener('beforeunload', () => {
          if (this.presenceChannel) supabase.removeChannel(this.presenceChannel);
        });
        // Heartbeat para mantener presencia y reducir falsos offline
        setInterval(() => {
          if (this.presenceChannel) {
            this.presenceChannel.track({ nickname: this.nickname, at: Date.now() }).catch(()=>{});
          }
        }, 25000);
        console.log('Presencia inicializada para:', nickname);
      } catch (e) {
        console.warn('No se pudo inicializar presencia:', e);
      }
    },
    
    // Obtener lista de amigos
    async getFriends() {
      try {
        console.log('=== OBTENIENDO AMIGOS ===');
        console.log('User ID:', userId);
        
        // Verificar conectividad
        if (!navigator.onLine) {
          console.log('⚠️ Sin conexión - usando datos locales');
          return { success: true, data: this.friends || [] };
        }
        
        // Obtener relaciones de amistad BIDIRECCIONALES
        // Buscar donde yo soy user_id O friend_id
        const { data: friendships, error: friendshipsError } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted');
        
        if (friendshipsError) {
          console.error('Error obteniendo friendships:', friendshipsError);
          throw friendshipsError;
        }
        
        console.log('Friendships encontradas:', friendships);
        
        if (!friendships || friendships.length === 0) {
          console.log('No hay friendships encontradas');
          this.friends = [];
          return { success: true, data: [] };
        }
        
        // Obtener los IDs de los amigos (puede ser user_id o friend_id)
        const friendIds = friendships.map(f => {
          // Si yo soy user_id, el amigo es friend_id
          // Si yo soy friend_id, el amigo es user_id
          const friendId = f.user_id === userId ? f.friend_id : f.user_id;
          console.log(`  - Friendship: ${f.user_id} -> ${f.friend_id}, mi amigo es: ${friendId}`);
          return friendId;
        });
        
        // Eliminar duplicados
        const uniqueFriendIds = [...new Set(friendIds)];
        console.log('IDs únicos de amigos:', uniqueFriendIds);
        
        // Debug: verificar perfiles individualmente
        await this.debugFriendProfiles(uniqueFriendIds);
        
        // Crear perfiles faltantes si es necesario
        console.log('Verificando y creando perfiles faltantes...');
        await this.createMissingProfiles(uniqueFriendIds);
        
        // Ahora obtener los datos de los perfiles de los amigos
        console.log('Consultando perfiles para IDs:', uniqueFriendIds);
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, nickname, level, avatar_url')
          .in('user_id', uniqueFriendIds);
        
        console.log('Resultado de consulta de perfiles:', { profiles, profilesError });
        
        if (profilesError) {
          console.error('Error obteniendo perfiles:', profilesError);
          throw profilesError;
        }
        
        console.log('Perfiles encontrados:', profiles);
        console.log('Cantidad de perfiles encontrados:', profiles?.length || 0);
        
        // Mapear los datos, incluyendo amigos sin perfil
        const friends = [];
        
        for (const friendId of uniqueFriendIds) {
          const profile = profiles?.find(p => p.user_id === friendId);
          
          if (profile) {
            // Amigo con perfil existente
            friends.push({
              user_id: profile.user_id,
              nickname: profile.nickname || 'Usuario',
              level: profile.level || 1,
              avatar_url: profile.avatar_url || null,
              is_online: this.onlineUserIds.has(profile.user_id)
            });
          } else {
            // Amigo sin perfil - crear entrada temporal
            console.warn(`Amigo sin perfil detectado: ${friendId}`);
            friends.push({
              user_id: friendId,
              nickname: 'Usuario Sin Perfil',
              level: 1,
              avatar_url: null,
              is_online: this.onlineUserIds.has(friendId),
              needsProfile: true // Marcar que necesita perfil
            });
          }
        }
        
        console.log('Lista final de amigos:', friends);
        
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
          // Buscar relación entre ambos en cualquiera de las dos direcciones
          const orExpr = `and(user_id.eq.${userId},friend_id.eq.${user.user_id}),and(user_id.eq.${user.user_id},friend_id.eq.${userId})`;
          const res = await supabase
            .from('friendships')
            .select('status,user_id,friend_id')
            .or(orExpr)
            .limit(1);
          const friendship = (!res.error && res.data && res.data.length > 0) ? res.data[0] : null;
          user.relationship_status = friendship?.status || null;
          // Marcar presencia si ya la tenemos
          user.is_online = this.onlineUserIds.has(user.user_id);
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
        console.log('=== ACEPTANDO SOLICITUD DE AMISTAD ===');
        console.log('Request ID:', requestId);
        
        // Primero obtener la solicitud para saber quién la envió
        const { data: request, error: getError } = await supabase
          .from('friendships')
          .select('*')
          .eq('id', requestId)
          .single();
        
        if (getError || !request) {
          console.error('Error obteniendo solicitud:', getError);
          throw getError || new Error('Solicitud no encontrada');
        }
        
        console.log('Solicitud encontrada:', request);
        console.log('  - user_id (quien envió):', request.user_id);
        console.log('  - friend_id (quien recibe):', request.friend_id);
        console.log('  - status:', request.status);
        
        // Actualizar la solicitud original a 'accepted'
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId);
        
        if (updateError) {
          console.error('Error actualizando solicitud:', updateError);
          throw updateError;
        }
        
        console.log('Solicitud actualizada a accepted');
        
        // Crear la relación inversa para que sea bidireccional
        // Solo si no existe ya
        const { data: existingReverse, error: checkError } = await supabase
          .from('friendships')
          .select('id')
          .eq('user_id', request.friend_id)
          .eq('friend_id', request.user_id)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error verificando relación inversa:', checkError);
        }
        
        if (!existingReverse) {
          console.log('Creando relación inversa...');
          const { data: reverseData, error: reverseError } = await supabase
            .from('friendships')
            .insert({
              user_id: request.friend_id,
              friend_id: request.user_id,
              status: 'accepted',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
          
          if (reverseError) {
            console.error('Error creando relación inversa:', reverseError);
            // No fallar si no se puede crear la inversa, pero logear el error
            console.warn('Continuando sin relación inversa...');
          } else {
            console.log('Relación inversa creada:', reverseData);
          }
        } else {
          console.log('Relación inversa ya existe:', existingReverse);
        }
        
        // Verificar que ambas relaciones existen
        const { data: verifyRelations } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${request.user_id},friend_id.eq.${request.user_id}`)
          .or(`user_id.eq.${request.friend_id},friend_id.eq.${request.friend_id}`)
          .eq('status', 'accepted');
        
        console.log('Verificación de relaciones bidireccionales:', verifyRelations);
        
        return { success: true };
      } catch (error) {
        console.error('Error aceptando solicitud:', error);
        return { success: false, error };
      }
    },
    
    // Función de debug para verificar perfiles de amigos
    async debugFriendProfiles(friendIds) {
      try {
        console.log('=== DEBUG: VERIFICANDO PERFILES DE AMIGOS ===');
        console.log('IDs a verificar:', friendIds);
        
        for (const friendId of friendIds) {
          console.log(`Verificando perfil para ID: ${friendId}`);
          
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('user_id, nickname, level, avatar_url')
            .eq('user_id', friendId)
            .single();
          
          console.log(`  - Resultado para ${friendId}:`, { profile, error });
          
          if (error) {
            console.error(`  - Error específico para ${friendId}:`, error);
            
            // Si el error es "no rows found", el perfil no existe
            if (error.code === 'PGRST116') {
              console.log(`  - PERFIL FALTANTE: ${friendId} no tiene perfil en user_profiles`);
            }
          }
        }
        
        // También verificar si hay perfiles que no deberían estar
        const { data: allProfiles, error: allError } = await supabase
          .from('user_profiles')
          .select('user_id, nickname, level')
          .in('user_id', friendIds);
        
        console.log('Consulta masiva de perfiles:', { allProfiles, allError });
        
        return { success: true };
      } catch (error) {
        console.error('Error en debug de perfiles:', error);
        return { success: false, error };
      }
    },
    
    // Función para crear perfiles faltantes
    async createMissingProfiles(friendIds) {
      try {
        console.log('=== CREANDO PERFILES FALTANTES ===');
        console.log('IDs a verificar:', friendIds);
        
        const profilesToCreate = [];
        
        for (const friendId of friendIds) {
          console.log(`Verificando si existe perfil para: ${friendId}`);
          
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('user_id', friendId)
            .single();
          
          if (error && error.code === 'PGRST116') {
            console.log(`  - Perfil faltante detectado: ${friendId}`);
            profilesToCreate.push({
              user_id: friendId,
              nickname: 'Usuario',
              level: 1,
              total_xp: 0,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          } else if (error) {
            console.error(`  - Error verificando perfil ${friendId}:`, error);
          } else {
            console.log(`  - Perfil ya existe: ${friendId}`);
          }
        }
        
        if (profilesToCreate.length > 0) {
          console.log(`Creando ${profilesToCreate.length} perfiles faltantes:`, profilesToCreate);
          
          const { data: createdProfiles, error: createError } = await supabase
            .from('user_profiles')
            .insert(profilesToCreate)
            .select();
          
          if (createError) {
            console.error('Error creando perfiles:', createError);
            return { success: false, error: createError };
          } else {
            console.log('Perfiles creados exitosamente:', createdProfiles);
            return { success: true, data: createdProfiles };
          }
        } else {
          console.log('No hay perfiles faltantes que crear');
          return { success: true, data: [] };
        }
      } catch (error) {
        console.error('Error creando perfiles faltantes:', error);
        return { success: false, error };
      }
    },
    
    // Función de utilidad para verificar y reparar relaciones de amistad
    async repairFriendshipRelationships() {
      try {
        console.log('=== REPARANDO RELACIONES DE AMISTAD ===');
        
        // Obtener todas las relaciones donde yo soy user_id
        const { data: myRelations, error: myError } = await supabase
          .from('friendships')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'accepted');
        
        if (myError) throw myError;
        
        console.log('Mis relaciones como user_id:', myRelations);
        
        // Para cada relación donde yo soy user_id, verificar si existe la inversa
        for (const relation of myRelations || []) {
          const { data: reverseRelation, error: reverseError } = await supabase
            .from('friendships')
            .select('id')
            .eq('user_id', relation.friend_id)
            .eq('friend_id', userId)
            .eq('status', 'accepted')
            .single();
          
          if (reverseError && reverseError.code === 'PGRST116') {
            // No existe la relación inversa, crearla
            console.log(`Creando relación inversa para ${relation.friend_id} -> ${userId}`);
            const { error: insertError } = await supabase
              .from('friendships')
              .insert({
                user_id: relation.friend_id,
                friend_id: userId,
                status: 'accepted',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error(`Error creando relación inversa para ${relation.friend_id}:`, insertError);
            } else {
              console.log(`Relación inversa creada para ${relation.friend_id}`);
            }
          } else if (reverseError) {
            console.error(`Error verificando relación inversa para ${relation.friend_id}:`, reverseError);
          } else {
            console.log(`Relación inversa ya existe para ${relation.friend_id}`);
          }
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error reparando relaciones:', error);
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
            game_type: 'vs', // debe coincidir con el CHECK de la tabla
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

// Parche: reintento tolerante de game_type para invitaciones
if (window.socialManager && typeof window.socialManager === 'object') {
  const sm = window.socialManager;
  const original = sm.inviteToSyncGame;
  sm.inviteToSyncGame = async function(friendId, roomCode) {
    try {
      const typesToTry = ['vs', 'sync', 'async'];
      let lastError = null;
      for (const gtype of typesToTry) {
        const { data, error } = await sm.supabase
          .from('game_invitations')
          .insert({
            from_user_id: sm.userId,
            to_user_id: friendId,
            room_code: roomCode,
            game_type: gtype,
            status: 'pending',
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
          })
          .select();
        console.log('[Invite Retry] Intento', gtype, { data, error });
        if (!error) {
          return { success: true, data };
        }
        lastError = error;
        const msg = String(error?.message || '');
        if (!(msg.includes('check constraint') || error?.code === '23514')) {
          break;
        }
      }
      if (lastError) throw lastError;
      return { success: false, error: new Error('No se pudo crear la invitación') };
    } catch (e) {
      console.error('[Invite Retry] Falló el envío:', e);
      return { success: false, error: e };
    }
  };
}
// Si aún no existe, esperar a que se inicialice y luego parchear
else {
  const _iv = setInterval(() => {
    if (window.socialManager && typeof window.socialManager === 'object') {
      clearInterval(_iv);
      const sm = window.socialManager;
      sm.inviteToSyncGame = async function(friendId, roomCode) {
        try {
          const typesToTry = ['vs', 'sync', 'async'];
          let lastError = null;
          for (const gtype of typesToTry) {
            const { data, error } = await sm.supabase
              .from('game_invitations')
              .insert({
                from_user_id: sm.userId,
                to_user_id: friendId,
                room_code: roomCode,
                game_type: gtype,
                status: 'pending',
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
              })
              .select();
            console.log('[Invite Retry] Intento', gtype, { data, error });
            if (!error) {
              return { success: true, data };
            }
            lastError = error;
            const msg = String(error?.message || '');
            if (!(msg.includes('check constraint') || error?.code === '23514')) {
              break;
            }
          }
          if (lastError) throw lastError;
          return { success: false, error: new Error('No se pudo crear la invitación') };
        } catch (e) {
          console.error('[Invite Retry] Falló el envío:', e);
          return { success: false, error: e };
        }
      };
    }
  }, 200);
}
