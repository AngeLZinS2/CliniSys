import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquarePlus } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

// --- Types ---
type StaffProfile = {
  id: string;
  name: string;
  avatar: string | null;
};

type ChatRoom = {
  id: string;
  created_at: string;
  status: string;
  staff_id: string | null;
  staff: StaffProfile | null;
};

type MessageSender = {
    id: string;
    name: string;
    avatar: string | null;
}

type ChatMessage = {
    id: string;
    message: string;
    created_at: string;
    sender_id: string;
    sender: MessageSender | null;
};


// --- Hooks ---

/**
 * Fetches and subscribes to all chat rooms for the current patient.
 */
const useChatRooms = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchChatRooms = async () => {
      // 1. Fetch rooms
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id, created_at, status, staff_id')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (roomError) {
        console.error('Error fetching chat rooms:', roomError);
        return;
      }
      if (!roomData) return;

      // 2. Get unique staff IDs
      const staffIds = [...new Set(roomData.map(r => r.staff_id).filter(id => id !== null))] as string[];

      if (staffIds.length === 0) {
        setChatRooms(roomData as ChatRoom[]);
        return;
      }

      // 3. Fetch staff profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', staffIds);
      
      if (profilesError) {
        console.error('Error fetching staff profiles:', profilesError);
        setChatRooms(roomData as ChatRoom[]); // Set rooms without profiles on error
        return;
      }

      // 4. Map profiles to rooms
      const profilesById = new Map(profilesData.map(p => [p.id, p]));
      const roomsWithStaff = roomData.map(r => ({
        ...r,
        staff: r.staff_id ? profilesById.get(r.staff_id) || null : null
      }));

      setChatRooms(roomsWithStaff as ChatRoom[]);
    };

    fetchChatRooms();

    const subscription = supabase
      .channel('public:chat_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms', filter: `patient_id=eq.${user.id}` },
        () => fetchChatRooms() // Refetch rooms on any change
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  return { chatRooms };
};


/**
 * Fetches messages for a specific room and handles sending new messages.
 */
const useChatMessages = (roomId: string | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!roomId) {
            setMessages([]);
            return;
        };

        const fetchMessagesAndSenders = async () => {
            const { data: messageData, error: msgError } = await supabase
                .from('chat_messages')
                .select('id, message, created_at, sender_id')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (msgError) {
                console.error('Error fetching messages:', msgError);
                return;
            }

            const senderIds = [...new Set(messageData.map(m => m.sender_id))];
            if (senderIds.length === 0) {
                setMessages(messageData as ChatMessage[]);
                return;
            }

            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, avatar')
                .in('id', senderIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                setMessages(messageData as ChatMessage[]);
                return;
            }

            const profilesById = new Map(profilesData.map(p => [p.id, p]));
            const messagesWithSenders = messageData.map(m => ({
                ...m,
                sender: profilesById.get(m.sender_id) || null
            }));

            setMessages(messagesWithSenders as ChatMessage[]);
        };

        fetchMessagesAndSenders();

        const subscription = supabase
            .channel(`chat:${roomId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
                async (payload) => {
                    const newMessage = payload.new as any;
                    if (messages.find(m => m.id === newMessage.id)) return; // Already exists
                    
                    const { data: senderData } = await supabase.from('profiles').select('id, name, avatar').eq('id', newMessage.sender_id).single();
                    newMessage.sender = senderData;
                    setMessages((prevMessages) => [...prevMessages, newMessage as ChatMessage]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [roomId, user]);

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


// --- Components ---

const ChatMessageView = ({ roomId }: { roomId: string }) => {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const { messages, sendMessage } = useChatMessages(roomId);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({
                    top: scrollAreaRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }, 100);
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            {msg.sender_id !== user.id && (
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={msg.sender?.avatar || undefined} />
                                    <AvatarFallback>{msg.sender?.name?.charAt(0) || 'S'}</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.sender_id === user.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                            >
                                <p className="text-sm">{msg.message}</p>
                                <p className="text-xs text-right mt-1 opacity-70">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    />
                    <Button type="submit" size="icon" aria-label="Enviar mensagem">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

const PatientChat = () => {
    const { user } = useAuth();
    const { chatRooms } = useChatRooms();
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    // Select the first room by default
    useEffect(() => {
        if (!selectedRoomId && chatRooms.length > 0) {
            setSelectedRoomId(chatRooms[0].id);
        }
    }, [chatRooms, selectedRoomId]);

    const handleCreateNewChat = async () => {
        if (!user) return;
        // Create a new room
        const { data: newRoom, error: newRoomError } = await supabase
            .from('chat_rooms')
            .insert({ patient_id: user.id })
            .select('id')
            .single();

        if (newRoomError) {
            console.error('Error creating chat room:', newRoomError);
        } else {
            setSelectedRoomId(newRoom.id);
        }
    };

    if (!user) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="h-[calc(100vh-150px)] bg-card border rounded-lg shadow-sm overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Conversas</h2>
                                <Button onClick={handleCreateNewChat} size="icon" variant="ghost" aria-label="Nova conversa">
                                    <MessageSquarePlus className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {chatRooms.map((room) => (
                                    <Button
                                        key={room.id}
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start h-auto py-3",
                                            selectedRoomId === room.id && "bg-muted"
                                        )}
                                        onClick={() => setSelectedRoomId(room.id)}
                                    >
                                        <Avatar className="w-10 h-10 mr-3">
                                            <AvatarImage src={room.staff?.avatar || undefined} />
                                            <AvatarFallback>{room.staff?.name?.charAt(0) || 'S'}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="font-semibold truncate">{room.staff?.name || 'Atendimento'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Iniciada em {new Date(room.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={75}>
                    {selectedRoomId ? (
                        <ChatMessageView roomId={selectedRoomId} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <MessageSquarePlus className="w-16 h-16 mb-4" />
                            <h3 className="text-lg font-semibold">Selecione uma conversa</h3>
                            <p className="text-sm">Ou inicie uma nova para começar a conversar.</p>
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default PatientChat;