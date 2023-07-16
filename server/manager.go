package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	websocketUpgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     checkOrigin,
	}
)

type Manager struct {
	clients      ClientList
	rooms        RoomsList
	sync.RWMutex // <-- Document this
	otps         RetentionMap
	handlers     map[string]EventHandler // type -> key to grab the correct event handler
}

func NewManager(ctx context.Context) *Manager {
	m := &Manager{
		clients:  make(ClientList),
		rooms:    initProtectedRooms(),
		handlers: make(map[string]EventHandler),
		otps:     NewRetentionMap(ctx, 5*time.Second),
	}

	m.setupEventHandlers()
	go m.refreshRoomsTicker()
	return m
}

func (m *Manager) setupEventHandlers() {
	m.handlers[EventSendMessage] = SendMessage
	m.handlers[EventCreateRoom] = CreateRoom
	m.handlers[EventJoinRoom] = JoinRoom
}

func SendMessage(event Event, c *Client) error {
	log.Println(event)

	var chatevent SendMessageEvent

	if err := json.Unmarshal(event.Payload, &chatevent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	var broadMessage NewMessageEvent
	broadMessage.Sent = time.Now()
	broadMessage.Message = chatevent.Message
	broadMessage.From = chatevent.From

	data, err := json.Marshal(broadMessage)

	if err != nil {
		return fmt.Errorf("failed to marshal broadcast message: %v", err)
	}

	outgoingEvent := Event{
		Payload: data,
		Type:    EventNewMessage,
	}

	for client := range c.manager.clients {
		if c.room == client.room {
			client.egress <- outgoingEvent
		}
	}
	return nil
}

func CreateRoom(event Event, c *Client) error {
	log.Println(event)

	var createRoomEvent CreateRoomEvent

	if err := json.Unmarshal(event.Payload, &createRoomEvent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	room := &Room{
		Name:          createRoomEvent.Name,
		CreatedAt:     time.Now(),
		deletionTimer: time.Now().Add(time.Minute),
		IsProtected:   false,
	}
	c.manager.createRoom(room)
	c.manager.rooms.AddUser(room, c)
	if err := c.manager.broadcastRefreshRoom(); err != nil {
		return fmt.Errorf("error while broadcasting new user in room: %v", err)
	}
	return nil
}

func JoinRoom(event Event, c *Client) error {
	log.Println(event)

	var joinRoomRevent JoinRoomEvent

	if err := json.Unmarshal(event.Payload, &joinRoomRevent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	if _, ok := c.manager.rooms[joinRoomRevent.RoomName]; !ok {

		return fmt.Errorf("cannot find the asked room: %v - %v ", joinRoomRevent.RoomName, c.manager.rooms[joinRoomRevent.RoomName])
	}

	room := c.manager.rooms[joinRoomRevent.RoomName]

	c.manager.rooms.AddUser(room, c)
	if err := c.manager.broadcastNewUserInRoom(room, c); err != nil {
		return fmt.Errorf("error while broadcasting new user in room: %v", err)
	}
	if err := c.manager.broadcastRefreshRoom(); err != nil {
		return fmt.Errorf("error while broadcasting new user in room: %v", err)
	}
	return nil

}

func (m *Manager) broadcastRefreshRoom() error {

	var broadMessage RefreshRoomEvent
	broadMessage.ActiveRooms = m.refreshAndReturnActiveRooms()

	for client := range m.clients {

		broadMessage.CurrentRoom = *client.room
		data, err := json.Marshal(broadMessage)

		if err != nil {
			return fmt.Errorf("failed to marshal broadcast messages: %v", err)
		}

		outgoingEvent := Event{
			Payload: data,
			Type:    EventRefreshRooms,
		}

		client.egress <- outgoingEvent

	}

	return nil
}

func (m *Manager) broadcastNewUserInRoom(r *Room, c *Client) error {

	log.Println("Event : broadcast new user in room")
	var broadMessage JoinRoomEvent
	broadMessage.RoomName = r.Name
	broadMessage.Username = c.username

	data, err := json.Marshal(broadMessage)

	outgoingEvent := Event{
		Payload: data,
		Type:    EventNewUserInRoom,
	}

	if err != nil {
		return fmt.Errorf("failed to marshal broadcast messages: %v", err)
	}

	for client := range m.clients {
		if client.room.Name == r.Name {
			client.egress <- outgoingEvent
		}
	}

	return nil
}

func (m *Manager) refreshRoomsTicker() {

	// ticker := time.NewTicker(1 * time.Second)

	// fmt.Println("Start ticker")
	// go func() {
	// 	tick := time.Tick(500 * time.Millisecond)
	// 	for range tick {
	// 		fmt.Println("Tick")
	// 	}
	// }()
	// fmt.Println("End ticker")

	tick := time.Tick(5 * time.Second)
	for range tick {
		fmt.Println("Refreshing rooms")
		// m.refreshAndReturnActiveRooms()
		m.refreshRoomDeletionTimers()
		m.broadcastRefreshRoom()
	}
	// for range ticker.C {
	// 	// conn := <-ticker.C
	// 	log.Println("tick")

	// }

}

func (m *Manager) routeEvent(event Event, c *Client) error {

	// Check if the event exist in our eventHandler map
	if handler, ok := m.handlers[event.Type]; ok {
		// If err, return the error
		if err := handler(event, c); err != nil {
			return err
		}
		// If everything is ok, return nil, it has been routed
		return nil
	} else {
		// Doesn't exist : throw error
		return errors.New(string("there is no such event type: " + event.Type))
	}
}

func (m *Manager) serveWS(w http.ResponseWriter, r *http.Request) {

	otp := r.URL.Query().Get("otp")
	username := r.URL.Query().Get("username")
	if otp == "" {
		log.Println("otp is undefined")
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if !m.otps.VerifyOTP(otp) {
		log.Println("verify otp failed")
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if username == "" || m.usernameExistsInClients(username) {
		log.Println(username + " already exist or is undefined")
		w.WriteHeader(400)
		return
	}

	log.Println("new connection")

	// Upgrade regular http connection into websocket
	conn, err := websocketUpgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println(err)
		return
	}

	client := NewClient(conn, m, username)
	m.addClient(client)

	// Start client processes
	go client.readMessages()
	go client.writeMessages()

	if err := m.broadcastNewUserInRoom(client.room, client); err != nil {
		log.Printf("error while broadcasting: %v", err)
	}

}

func (m *Manager) usernameExistsInClients(username string) bool {
	for _, name := range m.clients {
		if strings.ToLower(username) == name {
			return true
		}
	}
	return false
}

func (m *Manager) loginHandler(w http.ResponseWriter, r *http.Request) {

	type userLoginRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	var req userLoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// if password := m.usersMap[req.Username]; password != req.Password {
	if true {
		type response struct {
			OTP string `json:"otp"`
		}
		otp := m.otps.NewOTP()
		resp := response{
			OTP: otp.Key,
		}

		data, err := json.Marshal(resp)

		if err != nil {
			log.Println(err)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
		return

	}

	w.WriteHeader(http.StatusUnauthorized)

}

func (m *Manager) addClient(client *Client) {
	m.Lock()
	defer m.Unlock()

	m.clients[client] = client.username
}

func (m *Manager) removeClient(client *Client) {
	m.Lock()
	defer m.Unlock()

	if _, ok := m.clients[client]; ok {
		client.connection.Close()
		delete(m.clients, client)
	}
}

func (m *Manager) createRoom(room *Room) {
	m.Lock()
	defer m.Unlock()
	m.rooms[room.Name] = room
}

func (m *Manager) deleteRoom(room *Room) {
	m.Lock()
	defer m.Unlock()
	delete(m.rooms, room.Name)
}

func (m *Manager) refreshRoomDeletionTimers() error {

	log.Println(strconv.FormatInt(int64(len((m.rooms))), 10) + "lenght")
	for _, room := range m.rooms {
		log.Println("Testing : " + room.Name)
		if room.UserCount <= 0 && room.deletionTimer.Before(time.Now()) && !room.IsProtected {
			m.deleteRoom(room)
		}
		if room.UserCount > 0 {
			m.Lock()
			room.deletionTimer = time.Now().Add(1 * time.Minute)
			m.Unlock()
		}
	}

	return nil

}

func (m *Manager) refreshAndReturnActiveRooms() []Room {

	m.Lock()
	defer m.Unlock()

	activeRooms := []Room{}

	for _, r := range m.rooms {
		userCount := 0
		for c := range m.clients {
			if c.room == r {
				userCount++
			}
		}

		room := *r
		r.UserCount = userCount

		activeRooms = append(activeRooms, room)
	}

	sort.SliceStable(activeRooms, func(i, j int) bool {
		return strings.Compare(strings.ToLower(activeRooms[i].Name), strings.ToLower(activeRooms[j].Name)) > 0
	})
	return activeRooms
}

func checkOrigin(r *http.Request) bool {
	return true
	// origin := r.Header.Get("Origin")

	// return strings.HasPrefix(origin, "http://127.0.0.1:517")

	// switch origin {
	// 	//  should be from env var
	// 	case
	// 	 "http://localhost:517"
	// }
}
