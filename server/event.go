package main

import (
	"encoding/json"
	"time"
)

type Event struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type EventHandler func(event Event, c *Client) error

const (
	EventSendMessage   = "send_message"
	EventNewMessage    = "new_message"
	EventCreateRoom    = "create_room"
	EventJoinRoom      = "join_room"
	EventRefreshRooms  = "refresh_rooms"
	EventNewUserInRoom = "new_user_in_room"
)

type SendMessageEvent struct {
	Message string `json:"message"`
	From    string `json:"from"`
}

type NewMessageEvent struct {
	SendMessageEvent
	Sent time.Time `json:"sent"`
}

type CreateRoomEvent struct {
	Name      string `json:"name"`
	CreatedBy string `json:"createdBy"`
}

type JoinRoomEvent struct {
	RoomName string `json:"roomName"`
	Username string `json:"username"`
}

type RefreshRoomEvent struct {
	CurrentRoom Room   `json:"currentRoom"`
	ActiveRooms []Room `json:"activeRooms"`
}
