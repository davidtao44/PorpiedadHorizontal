import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const SessionManager = ({ children }) => {
  const navigate = useNavigate();
  const logoutTimerRef = useRef(null);
  const activityTimerRef = useRef(null);

  const logout = useCallback(async () => {
    console.log('Session expired or inactivity timeout reached. Logging out...');
    await authService.logout();
    navigate('/login');
  }, [navigate]);

  const resetInactivityTimer = useCallback(() => {
    const inactivityTimeout = parseInt(localStorage.getItem('inactivityTimeout') || '30', 10) * 60 * 1000;
    
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }

    activityTimerRef.current = setTimeout(() => {
      console.log('Inactivity timeout reached');
      logout();
    }, inactivityTimeout);

    // Guardar última actividad para sincronización entre pestañas (opcional)
    localStorage.setItem('lastActivity', Date.now().toString());
  }, [logout]);

  useEffect(() => {
    // Si no hay token, no activamos el manager
    if (!localStorage.getItem('token')) return;

    // 1. Configurar tiempo de sesión máximo (Hard limit)
    const sessionTimeout = parseInt(localStorage.getItem('sessionTimeout') || '60', 10) * 60 * 1000;
    
    // Este temporizador se activa una sola vez al cargar el componente (login)
    // En una implementación más robusta, se calcularía en base a la expiración real del JWT
    const startTime = parseInt(localStorage.getItem('sessionStartTime') || Date.now().toString(), 10);
    const timeElapsed = Date.now() - startTime;
    const remainingSessionTime = Math.max(0, sessionTimeout - timeElapsed);

    logoutTimerRef.current = setTimeout(() => {
      console.log('Max session time reached');
      logout();
    }, remainingSessionTime);

    // 2. Configurar tracker de inactividad
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Inicializar timer
    resetInactivityTimer();

    // 3. Sincronización entre pestañas
    const handleStorageChange = (e) => {
      if (e.key === 'lastActivity') {
        // Otra pestaña tuvo actividad, reseteamos nuestro timer local
        resetInactivityTimer();
      }
      if (e.key === 'token' && !e.newValue) {
        // Otra pestaña cerró sesión
        logout();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout, resetInactivityTimer]);

  return <>{children}</>;
};

export default SessionManager;
