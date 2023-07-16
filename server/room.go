package main

import (
	"time"
)

type RoomsList map[string]*Room

type Room struct {
	Name          string    `json:"name"`
	CreatedAt     time.Time `json:"createdAt"`
	deletionTimer time.Time
	IsProtected   bool `json:"isProtected"`
	UserCount     int  `json:"userCount"`
}

func initProtectedRooms() RoomsList {

	list := make(RoomsList)

	general := &Room{
		Name:          "General",
		CreatedAt:     time.Now(),
		deletionTimer: time.Time{},
		IsProtected:   true,
	}
	english := &Room{
		Name:          "English",
		CreatedAt:     time.Now(),
		deletionTimer: time.Time{},
		IsProtected:   true,
	}
	french := &Room{
		Name:          "French",
		CreatedAt:     time.Now(),
		deletionTimer: time.Time{},
		IsProtected:   true,
	}

	list[general.Name] = general
	list[english.Name] = english
	list[french.Name] = french

	return list
}

func (rl RoomsList) RemoveUser(room *Room, client *Client) {
	client.room = rl["General"]
	rl[room.Name].UserCount--
}

func (rl RoomsList) AddUser(room *Room, client *Client) {
	client.room = room
	rl[room.Name].UserCount++
}
