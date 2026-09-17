import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { chatApi } from '@/lib/api'

const ChatContext = createContext(null)

function buildSocketUrl(token) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/api/ws/chat?token=${encodeURIComponent(token)}`
}

export function ChatProvider({ children }) {
  const { user, token } = useAuth()
  const socketRef = useRef(null)
  const listenersRef = useRef(new Set())
  const [connected, setConnected] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)

  const emit = useCallback((frame) => {
    listenersRef.current.forEach((listener) => {
      try {
        listener(frame)
      } catch {
        /* ignore listener errors */
      }
    })
  }, [])

  const refreshUnread = useCallback(async () => {
    try {
      const list = await chatApi.conversations()
      setUnreadTotal(list.reduce((sum, c) => sum + (c.unread_count || 0), 0))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!token || !user) {
      setConnected(false)
      setUnreadTotal(0)
      return
    }

    refreshUnread()

    const socket = new WebSocket(buildSocketUrl(token))
    socketRef.current = socket

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)
    socket.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data)
        if (frame.type === 'message' && frame.data?.sender_id !== user.id) {
          setUnreadTotal((count) => count + 1)
        }
        emit(frame)
      } catch {
        /* ignore malformed frames */
      }
    }

    return () => {
      try {
        socket.close()
      } catch {
        /* ignore */
      }
      socketRef.current = null
      setConnected(false)
    }
  }, [token, user?.id, emit, refreshUnread])

  const send = useCallback((payload) => {
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload))
      return true
    }
    return false
  }, [])

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener)
    return () => listenersRef.current.delete(listener)
  }, [])

  return (
    <ChatContext.Provider
      value={{ connected, unreadTotal, send, subscribe, refreshUnread, setUnreadTotal }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within a ChatProvider')
  return ctx
}
