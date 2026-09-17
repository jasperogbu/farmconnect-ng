import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, MessageSquare, Send, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useChat } from '@/context/ChatContext'
import { chatApi } from '@/lib/api'
import { cn, formatDateTime, initials } from '@/lib/utils'

export default function Messages() {
  const { user } = useAuth()
  const { connected, send, subscribe, refreshUnread } = useChat()
  const [searchParams, setSearchParams] = useSearchParams()

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(searchParams.get('c') ? Number(searchParams.get('c')) : null)
  const [messages, setMessages] = useState([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [typingFrom, setTypingFrom] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const bottomRef = useRef(null)
  const typingTimeout = useRef(null)

  const loadConversations = useCallback(async () => {
    try {
      const list = await chatApi.conversations()
      setConversations(list)
      return list
    } catch (error) {
      toast.error(error.message)
      return []
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return
    setLoadingMessages(true)
    try {
      const list = await chatApi.messages(conversationId)
      setMessages(list)
      await chatApi.markRead(conversationId)
      send({ type: 'read', conversation_id: conversationId })
      refreshUnread()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoadingMessages(false)
    }
  }, [send, refreshUnread])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId, loadMessages])

  // Realtime frames
  useEffect(() => {
    const unsubscribe = subscribe((frame) => {
      if (frame.type === 'message') {
        if (frame.conversation_id === activeId && frame.data) {
          setMessages((prev) =>
            prev.some((m) => m.id === frame.data.id) ? prev : [...prev, frame.data],
          )
        }
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === frame.conversation_id
              ? {
                  ...conversation,
                  last_message: frame.data?.content,
                  last_message_at: frame.data?.created_at,
                  unread_count:
                    frame.conversation_id === activeId ? 0 : conversation.unread_count + 1,
                }
              : conversation,
          ),
        )
      }

      if (frame.type === 'typing' && frame.conversation_id === activeId && frame.user_id !== user.id) {
        setTypingFrom(frame.is_typing ? frame.user_id : null)
      }

      if (frame.type === 'read' && frame.conversation_id === activeId && frame.user_id !== user.id) {
        setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })))
      }
    })
    return unsubscribe
  }, [subscribe, activeId, user.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingFrom])

  function selectConversation(id) {
    setActiveId(id)
    setSearchParams({ c: String(id) })
    setTypingFrom(null)
  }

  function notifyTyping() {
    if (!activeId) return
    send({ type: 'typing', conversation_id: activeId, is_typing: true })
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      send({ type: 'typing', conversation_id: activeId, is_typing: false })
    }, 1500)
  }

  async function submit(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !activeId) return
    setSending(true)
    setDraft('')
    try {
      const delivered = send({ type: 'message', conversation_id: activeId, content })
      if (!delivered) {
        const message = await chatApi.sendMessage(activeId, content)
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
      }
    } catch (error) {
      toast.error(error.message)
      setDraft(content)
    } finally {
      setSending(false)
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeId)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">Communicate directly with your trading partner.</p>
        </div>
        <Badge variant={connected ? 'default' : 'secondary'} className="gap-1">
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? 'Live' : 'Offline'}
        </Badge>
      </div>

      <Card className="grid h-[calc(100vh-14rem)] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <div className={cn('flex flex-col border-r', activeId && 'hidden md:flex')}>
          <div className="border-b p-4">
            <p className="font-semibold">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations"
                  description="Start a chat from a product or farmer page."
                />
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-muted/60',
                    activeId === conversation.id && 'bg-muted',
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials(conversation.other_user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {conversation.other_user.full_name}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge className="h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.last_message || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className={cn('flex flex-col', !activeId && 'hidden md:flex')}>
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation on the left to start chatting."
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => {
                    setActiveId(null)
                    setSearchParams({})
                  }}
                >
                  Back
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials(activeConversation.other_user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{activeConversation.other_user.full_name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {activeConversation.other_user.role} ·{' '}
                    {[activeConversation.other_user.city, activeConversation.other_user.state]
                      .filter(Boolean)
                      .join(', ') || 'Nigeria'}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No messages yet. Say hello 👋
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender_id === user.id
                    return (
                      <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                            mine
                              ? 'rounded-br-sm bg-primary text-primary-foreground'
                              : 'rounded-bl-sm bg-background',
                          )}
                        >
                          <p className="whitespace-pre-line">{message.content}</p>
                          <p
                            className={cn(
                              'mt-1 text-right text-[10px]',
                              mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                            )}
                          >
                            {formatDateTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                {typingFrom && (
                  <p className="text-xs italic text-muted-foreground">
                    {activeConversation.other_user.full_name} is typing…
                  </p>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={submit} className="flex items-center gap-2 border-t p-3">
                <Input
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    notifyTyping()
                  }}
                  placeholder="Type a message…"
                />
                <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
