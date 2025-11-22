import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, UserCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const useChat = (roomId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          sender:sender_id (
            id,
            raw_user_meta_data
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data.map(m => ({
          ...m,
          sender: {
            ...m.sender,
            // @ts-ignore
            name: m.sender.raw_user_meta_data.name
          }
        })));
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`chat:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newMessage = payload.new;
          supabase.from('users').select('id, raw_user_meta_data').eq('id', newMessage.sender_id).single().then(({ data }) => {
            setMessages((prevMessages) => [...prevMessages, { ...newMessage, sender: { ...data, name: data.raw_user_meta_data.name } }]);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roomId]);

  const sendMessage = async (message: string) => {
    if (!roomId || !user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert([{ room_id: roomId, sender_id: user.id, message }]);

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, sendMessage };
};

const AdminChat = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const { messages, sendMessage } = useChat(selectedRoom?.id);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          created_at,
          status,
          patient:patient_id (
            id,
            name,
            avatar
          ),
          staff:staff_id (
            id,
            name,
            avatar
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
      } else {
        setRooms(data);
      }
    };

    fetchRooms();

    const subscription = supabase
      .channel('chat_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const assignToSelf = async (roomId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('chat_rooms')
      .update({ staff_id: user.id, status: 'open' })
      .eq('id', roomId);

    if (error) {
      console.error('Error assigning chat:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-150px)]">
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle>Atendimentos</CardTitle>
          <CardDescription>Lista de conversas ativas e pendentes.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-3 rounded-lg cursor-pointer border ${selectedRoom?.id === room.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{room.patient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(room.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className={`text-sm ${room.staff ? 'text-green-500' : 'text-orange-500'}`}>
                  {room.staff ? `Atendido por ${room.staff.name}` : 'Aguardando atendimento'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 flex flex-col">
        {selectedRoom ? (
          <>
            <CardHeader className="border-b">
              <CardTitle>Conversa com {selectedRoom.patient.name}</CardTitle>
              {!selectedRoom.staff && (
                <Button size="sm" onClick={() => assignToSelf(selectedRoom.id)} className="mt-2">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Atender
                </Button>
              )}
            </CardHeader>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${
                      msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender_id !== user?.id && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{msg.sender?.name?.charAt(0) || 'P'}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                        msg.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs text-right mt-1 opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  autoComplete="off"
                  disabled={!selectedRoom.staff}
                />
                <Button type="submit" size="icon" disabled={!selectedRoom.staff}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground">Selecione um atendimento para visualizar as mensagens.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminChat;