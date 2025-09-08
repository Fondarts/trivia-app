// js/async_game.js - Sistema de partidas asíncronas de 24 horas

export class AsyncGameManager {
  constructor(supabase, userId) {
    this.supabase = supabase;
    this.userId = userId;
    this.currentGame = null;
    this.questions = [];
    this.answers = [];
    this.currentQuestionIndex = 0;
  }

  // Crear nueva partida asíncrona
  async createAsyncGame(opponentId) {
    try {
      // Generar 15 preguntas aleatorias (mismo set para ambos jugadores)
      const questions = await this.generateQuestions();
      
      const { data, error } = await this.supabase
        .from('async_games')
        .insert({
          player1_id: this.userId,
          player2_id: opponentId,
          questions: questions,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      this.currentGame = data;
      this.questions = questions;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error creando juego asíncrono:', error);
      return { success: false, error: error.message };
    }
  }

  // Cargar partida existente
  async loadAsyncGame(gameId) {
    try {
      const { data, error } = await this.supabase
        .from('async_games')
        .select()
        .eq('id', gameId)
        .single();
      
      if (error) throw error;
      
      // Verificar si expiró
      if (new Date(data.expires_at) < new Date()) {
        await this.markAsExpired(gameId);
        return { success: false, error: 'La partida ha expirado' };
      }
      
      this.currentGame = data;
      this.questions = data.questions;
      
      // Determinar si soy player1 o player2
      const isPlayer1 = data.player1_id === this.userId;
      this.answers = isPlayer1 ? (data.player1_answers || []) : (data.player2_answers || []);
      this.currentQuestionIndex = this.answers.length;
      
      // Verificar si ya completé mi parte
      const myCompleted = isPlayer1 ? data.player1_completed : data.player2_completed;
      if (myCompleted) {
        return { 
          success: true, 
          data, 
          completed: true,
          waitingForOpponent: !data.player1_completed || !data.player2_completed
        };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error cargando juego asíncrono:', error);
      return { success: false, error: error.message };
    }
  }

  // Generar preguntas para la partida
  async generateQuestions(count = 15) {
    // Por ahora usamos las preguntas locales
    // TODO: Integrar con el sistema de packs existente
    try {
      const response = await fetch('packs/es/manifest.json');
      const manifest = await response.json();
      const allQuestions = [];
      
      // Cargar preguntas de diferentes categorías
      for (const pack of manifest.packs.slice(0, 3)) {
        const packResponse = await fetch(`packs/es/${pack.file}`);
        const packData = await packResponse.json();
        allQuestions.push(...packData.questions);
      }
      
      // Mezclar y tomar 15 preguntas
      const shuffled = allQuestions.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count).map(q => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        category: q.category || 'General',
        difficulty: q.difficulty || 'medium'
      }));
    } catch (error) {
      console.error('Error generando preguntas:', error);
      // Preguntas de fallback
      return Array(count).fill(null).map((_, i) => ({
        question: `Pregunta de ejemplo ${i + 1}`,
        options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        correct: 0,
        category: 'General',
        difficulty: 'medium'
      }));
    }
  }

  // Obtener pregunta actual
  getCurrentQuestion() {
    if (!this.questions || this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return {
      ...this.questions[this.currentQuestionIndex],
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: this.questions.length
    };
  }

  // Responder pregunta
  async answerQuestion(answerIndex) {
    if (!this.currentGame || this.currentQuestionIndex >= this.questions.length) {
      return { success: false, error: 'No hay pregunta activa' };
    }
    
    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = answerIndex === question.correct;
    
    // Guardar respuesta localmente
    this.answers.push({
      questionIndex: this.currentQuestionIndex,
      answer: answerIndex,
      correct: isCorrect,
      timestamp: new Date().toISOString()
    });
    
    this.currentQuestionIndex++;
    
    // Si completamos todas las preguntas, guardar en la BD
    if (this.currentQuestionIndex >= this.questions.length) {
      await this.saveProgress(true);
    } else {
      // Guardar progreso cada 5 preguntas
      if (this.currentQuestionIndex % 5 === 0) {
        await this.saveProgress(false);
      }
    }
    
    return { 
      success: true, 
      correct: isCorrect,
      completed: this.currentQuestionIndex >= this.questions.length
    };
  }

  // Guardar progreso en la base de datos
  async saveProgress(completed = false) {
    if (!this.currentGame) return;
    
    try {
      const isPlayer1 = this.currentGame.player1_id === this.userId;
      const score = this.answers.filter(a => a.correct).length;
      
      const updateData = {};
      if (isPlayer1) {
        updateData.player1_answers = this.answers;
        updateData.player1_score = score;
        if (completed) updateData.player1_completed = true;
      } else {
        updateData.player2_answers = this.answers;
        updateData.player2_score = score;
        if (completed) updateData.player2_completed = true;
      }
      
      // Si ambos completaron, marcar como completado
      if (completed) {
        const otherCompleted = isPlayer1 ? 
          this.currentGame.player2_completed : 
          this.currentGame.player1_completed;
        
        if (otherCompleted) {
          updateData.status = 'completed';
          updateData.completed_at = new Date().toISOString();
          
          // Actualizar rankings
          await this.updateRankings();
        } else {
          updateData.status = 'active';
        }
      }
      
      const { error } = await this.supabase
        .from('async_games')
        .update(updateData)
        .eq('id', this.currentGame.id);
      
      if (error) throw error;
      
      // Actualizar el objeto local
      Object.assign(this.currentGame, updateData);
      
    } catch (error) {
      console.error('Error guardando progreso:', error);
    }
  }

  // Actualizar rankings entre amigos
  async updateRankings() {
    if (!this.currentGame || this.currentGame.status !== 'completed') return;
    
    try {
      const isPlayer1 = this.currentGame.player1_id === this.userId;
      const myScore = isPlayer1 ? this.currentGame.player1_score : this.currentGame.player2_score;
      const opponentScore = isPlayer1 ? this.currentGame.player2_score : this.currentGame.player1_score;
      const opponentId = isPlayer1 ? this.currentGame.player2_id : this.currentGame.player1_id;
      
      const won = myScore > opponentScore;
      
      // Buscar ranking existente
      const { data: existing } = await this.supabase
        .from('friend_rankings')
        .select()
        .eq('user_id', this.userId)
        .eq('friend_id', opponentId)
        .single();
      
      if (existing) {
        // Actualizar
        await this.supabase
          .from('friend_rankings')
          .update({
            wins: won ? existing.wins + 1 : existing.wins,
            losses: won ? existing.losses : existing.losses + 1,
            last_played: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Crear nuevo
        await this.supabase
          .from('friend_rankings')
          .insert({
            user_id: this.userId,
            friend_id: opponentId,
            wins: won ? 1 : 0,
            losses: won ? 0 : 1,
            last_played: new Date().toISOString()
          });
      }
      
      // También crear/actualizar el registro inverso para el oponente
      const { data: reverseExisting } = await this.supabase
        .from('friend_rankings')
        .select()
        .eq('user_id', opponentId)
        .eq('friend_id', this.userId)
        .single();
      
      if (reverseExisting) {
        await this.supabase
          .from('friend_rankings')
          .update({
            wins: won ? reverseExisting.wins : reverseExisting.wins + 1,
            losses: won ? reverseExisting.losses + 1 : reverseExisting.losses,
            last_played: new Date().toISOString()
          })
          .eq('id', reverseExisting.id);
      } else {
        await this.supabase
          .from('friend_rankings')
          .insert({
            user_id: opponentId,
            friend_id: this.userId,
            wins: won ? 0 : 1,
            losses: won ? 1 : 0,
            last_played: new Date().toISOString()
          });
      }
      
    } catch (error) {
      console.error('Error actualizando rankings:', error);
    }
  }

  // Obtener partidas asíncronas activas
  async getActiveAsyncGames() {
    try {
      const { data, error } = await this.supabase
        .from('async_games')
        .select(`
          *,
          player1:user_profiles!async_games_player1_id_fkey(nickname, avatar_url),
          player2:user_profiles!async_games_player2_id_fkey(nickname, avatar_url)
        `)
        .or(`player1_id.eq.${this.userId},player2_id.eq.${this.userId}`)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filtrar las expiradas
      const now = new Date();
      const activeGames = data.filter(game => new Date(game.expires_at) > now);
      
      return { success: true, data: activeGames };
    } catch (error) {
      console.error('Error obteniendo juegos activos:', error);
      return { success: false, error: error.message };
    }
  }

  // Marcar como expirado
  async markAsExpired(gameId) {
    try {
      await this.supabase
        .from('async_games')
        .update({ status: 'expired' })
        .eq('id', gameId);
    } catch (error) {
      console.error('Error marcando juego como expirado:', error);
    }
  }

  // Obtener resultados de una partida completada
  getResults() {
    if (!this.currentGame) return null;
    
    const isPlayer1 = this.currentGame.player1_id === this.userId;
    const myScore = isPlayer1 ? this.currentGame.player1_score : this.currentGame.player2_score;
    const opponentScore = isPlayer1 ? this.currentGame.player2_score : this.currentGame.player1_score;
    
    return {
      myScore,
      opponentScore,
      won: myScore > opponentScore,
      draw: myScore === opponentScore,
      totalQuestions: this.questions.length,
      timeRemaining: new Date(this.currentGame.expires_at) - new Date()
    };
  }
}

export default AsyncGameManager;