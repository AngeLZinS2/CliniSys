import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAppointmentNotifications } from '@/hooks/useAppointmentNotifications';

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useAppointmentNotifications();

  const getUrgencyColor = (hoursUntil: number) => {
    if (hoursUntil <= 6) return 'text-destructive';
    if (hoursUntil <= 24) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma consulta próxima
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">
                    Consulta com {notification.doctor}
                  </span>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {notification.date} às {notification.time}
                </div>
                <div className={`text-xs font-medium ${getUrgencyColor(notification.hoursUntil)}`}>
                  {notification.hoursUntil <= 1
                    ? 'Em menos de 1 hora!'
                    : notification.hoursUntil <= 6
                    ? `Em ${notification.hoursUntil} horas`
                    : notification.hoursUntil <= 24
                    ? `Amanhã às ${notification.time}`
                    : `Em ${Math.floor(notification.hoursUntil / 24)} dias`}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
