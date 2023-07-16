package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

var (
	pongWait     = 10 * time.Second
	pingInterval = (pongWait * 9) / 10
)

type ClientList map[*Client]string

type Client struct {
	connection *websocket.Conn
	manager    *Manager
	username   string
	room       *Room
	// egress is used to avoid concurrent writes on the websocket connection
	egress chan Event
}

func NewClient(conn *websocket.Conn, manager *Manager, username string) *Client {

	return &Client{
		connection: conn,
		manager:    manager,
		username:   username,
		room:       manager.rooms["General"],
		egress:     make(chan Event),
	}
}

func (c *Client) readMessages() {
	defer func() {
		// cleanup connection
		c.manager.removeClient(c)
	}()

	if err := c.connection.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		log.Println("err on SetReadDeadline")
		return
	}

	// Restrict limit of message
	c.connection.SetReadLimit(512)

	c.connection.SetPongHandler(c.pongHandler)

	for {
		_, payload, err := c.connection.ReadMessage()

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error reading message: %v", err)
			}
			break
		}

		var request Event

		if err := json.Unmarshal(payload, &request); err != nil {
			log.Printf("error marshalling event:%v", err)
			break
		}

		if err := c.manager.routeEvent(request, c); err != nil {
			log.Printf("error reading message: %v", err)
		}
	}
}

func (c *Client) writeMessages() {
	defer func() {
		c.manager.removeClient(c)
	}()

	ticker := time.NewTicker(pingInterval)
	// refreshRoomTicker := time.NewTicker(5 * time.Second)

	for {
		select {
		// In case we have a classic message
		case message, ok := <-c.egress:
			{

				if !ok {
					if err := c.connection.WriteMessage(websocket.CloseMessage, nil); err != nil {
						log.Println("connection closed: ", err)
					}
					return
				}

				data, err := json.Marshal(message)

				if err != nil {
					log.Println(err)
					return
				}

				if err := c.connection.WriteMessage(websocket.TextMessage, data); err != nil {
					log.Printf("failed to send message: %v", err)
				}
				log.Println("message sent")
			}

			// In case the ticker says its time for a ping
		case <-ticker.C:
			{

				log.Println("ping")
				// Send a Ping to the Client
				if err := c.connection.WriteMessage(websocket.PingMessage, []byte("")); err != nil {
					log.Println("writemsg err: ", err)
					return
				}
			}
		}
	}
}

func (c *Client) pongHandler(pongMsg string) error {
	log.Println("pong")
	return c.connection.SetReadDeadline(time.Now().Add(pongWait))
}
