import React, { useContext } from "react"
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket"
import { useAuth } from "./AuthProvider"

type Message = {
  from: string
  message: string
  sent: Date
  type: "chat" | "system"
}

export enum WSMessageType {
  SendMessage = "send_message",
  NewMessage = "new_message",
  NewClient = "new_client",
  CreateRoom = "create_room",
  RefreshRoom = "refresh_rooms",
  JoinRoom = "join_room",
  NewUserInRoom = "new_user_in_room",
}

export type RefreshRoomPayload = {
  currentRoom: RoomItem
  activeRooms: RoomItem[]
}

export type RoomItem = {
  name: string
  createdAt: Date
  isProtected: boolean
  userCount: number
}

function isValidRoomItem(payload: any): payload is RoomItem {
  return payload.name !== undefined && payload.createdAt !== undefined && payload.isProtected !== undefined && payload.userCount !== undefined
}

function isValidRefreshRoomPayload(payload: any): payload is RefreshRoomPayload {
  console.log(payload.activeRooms)
  return payload.activeRooms && payload.activeRooms.every(isValidRoomItem)
}

export type WebSocketContextValue = {
  //   ws: WebSocketHook<JsonValue | null, MessageEvent<any> | null>
  messages: Message[]
  rooms: RoomItem[]
  currentRoom: RoomItem | null
  sendMessage(type: WSMessageType, payload: any): void
  getLastWebsocketMessage(): any | null
  createRoom(roomName: string): void
  joinRoom(roomName: string): void
}

const WSConnectionContext = React.createContext<WebSocketContextValue | null>(null)

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL

function isValidWebsocketMessage(message: MessageEvent): boolean {
  const data = JSON.parse(message.data)
  if (!data.type || !data.payload) {
    console.log("Invalid message received", message)
    return false
  }
  return true
}

export const WSConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [rooms, setRooms] = React.useState<RoomItem[]>([])
  const [currentRoom, setCurrentRoom] = React.useState<RoomItem | null>(null)
  const { user, logout } = useAuth()

  const ws = useWebSocket(WS_URL, {
    queryParams: {
      otp: user?.otp ?? "",
      username: user?.username ?? "",
    },
    onOpen: () => {
      console.log("WebSocket connection established.")
    },
    onMessage: (event) => {
      const data = JSON.parse(event.data)

      if (!isValidWebsocketMessage(event)) {
        return
      }

      console.log(event)
      switch (data.type) {
        case WSMessageType.NewMessage:
          console.log("Event : New message received")
          setMessages((messages) => [...messages, { ...data.payload, type: "chat" }])
          break
        case WSMessageType.RefreshRoom:
          console.log("Event : Refresh room received")
          if (!isValidRefreshRoomPayload(data.payload)) {
            alert("Invalid refresh room payload")
            return
          }

          const rooms = data.payload.activeRooms as RoomItem[]
          setRooms(rooms)
          setCurrentRoom(data.payload.currentRoom)

          break
        case WSMessageType.NewUserInRoom:
          console.log("Event : New user in room received")
          setMessages((messages) => [
            ...messages,
            { from: "system", sent: new Date(), message: `User [${data.payload.username}] has joined the [${data.payload.roomName}] room`, type: "system" },
          ])
          break
        default:
          alert("Unsupported message type" + event.type)
          break
      }
    },
    onClose: () => {
      console.log("WebSocket connection closed.")
      logout()
    },
  })

  function sendMessage(type: WSMessageType, payload: any) {
    ws.sendJsonMessage({
      type: type,
      payload: payload,
    })
  }

  function createRoom(roomName: string) {
    sendMessage(WSMessageType.CreateRoom, { name: roomName, createdBy: user?.username })
  }

  function joinRoom(roomName: string) {
    sendMessage(WSMessageType.JoinRoom, { roomName: roomName, username: user?.username })
  }

  function getLastWebsocketMessage() {
    return ws.lastJsonMessage
  }

  return (
    <WSConnectionContext.Provider value={{ messages, rooms, currentRoom, sendMessage, joinRoom, createRoom, getLastWebsocketMessage }}>
      {children}
    </WSConnectionContext.Provider>
  )
}

export const useWSConnection = () => {
  const wsContext = useContext(WSConnectionContext)

  if (!wsContext) {
    throw new Error("useWSConnection has to be used within <WSConnectionProvider>")
  }

  return wsContext
}
