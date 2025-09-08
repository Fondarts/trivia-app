// Función de debug para enviar invitación manualmente desde consola
window.testInviteToGame = async function(friendId, roomCode) {
    console.log('=== TEST INVITACIÓN MANUAL ===');
    
    if (!window.socialManager) {
        console.error('socialManager no está disponible');
        return;
    }
    
    if (!window.socialManager.inviteToSyncGame) {
        console.error('inviteToSyncGame no existe en socialManager');
        console.log('Métodos disponibles:', Object.keys(window.socialManager));
        return;
    }
    
    roomCode = roomCode || 'TEST' + Math.floor(Math.random() * 1000);
    
    console.log('Enviando invitación:');
    console.log('  - Friend ID:', friendId);
    console.log('  - Room Code:', roomCode);
    
    try {
        const result = await window.socialManager.inviteToSyncGame(friendId, roomCode);
        console.log('Resultado:', result);
        
        if (result.success) {
            console.log('✅ Invitación enviada exitosamente');
        } else {
            console.error('❌ Error:', result.error);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error en invitación:', error);
        return { success: false, error };
    }
};

console.log('Función de test cargada. Usa: testInviteToGame("ID_DEL_AMIGO", "CODIGO_SALA")');
