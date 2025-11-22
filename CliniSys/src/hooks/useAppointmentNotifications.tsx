import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { differenceInHours, parseISO, format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface AppointmentNotification {
  id: string;
  appointmentId: string;
  doctor: string;
  date: string;
  time: string;
  hoursUntil: number;
  read: boolean;
}

export const useAppointmentNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && user.role === 'patient') {
      loadNotifications();
      
      // Verificar notificações a cada 5 minutos
      const interval = setInterval(loadNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_doctor_id_fkey(name)')
        .eq('patient_id', user.id)
        .in('status', ['confirmed', 'scheduled', 'pending'])
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', next48Hours.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      const notifs: AppointmentNotification[] = (appointments || []).map((apt) => {
        const aptDate = parseISO(apt.appointment_date);
        const hoursUntil = differenceInHours(aptDate, now);
        
        return {
          id: apt.id,
          appointmentId: apt.id,
          doctor: apt.profiles?.name || 'Médico não definido',
          date: format(aptDate, 'dd/MM/yyyy'),
          time: format(aptDate, 'HH:mm'),
          hoursUntil,
          read: false,
        };
      });

      setNotifications(notifs);
      setUnreadCount(notifs.length);

      // Mostrar toast para consultas nas próximas 24h
      notifs.forEach((notif) => {
        if (notif.hoursUntil <= 24) {
          const storedNotifs = localStorage.getItem('shown_notifications') || '[]';
          const shownIds = JSON.parse(storedNotifs);
          
          if (!shownIds.includes(notif.id)) {
            toast({
              title: '⏰ Consulta próxima!',
              description: `Você tem consulta com ${notif.doctor} em ${notif.hoursUntil}h - ${notif.date} às ${notif.time}`,
              duration: 8000,
            });
            
            shownIds.push(notif.id);
            localStorage.setItem('shown_notifications', JSON.stringify(shownIds));
          }
        }
      });
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
};
