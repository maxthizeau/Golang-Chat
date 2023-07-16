package main

import (
	"context"
	"log"
	"net/http"

	"github.com/rs/cors"
)

func main() {

	// log.Fatal(http.ListenAndServe(":8000", nil))
	mux := http.NewServeMux()

	setupAPI(mux)
	handler := cors.AllowAll().Handler(mux)
	log.Println("Listening on port : 8000")
	log.Fatal(http.ListenAndServe(":8000", handler))
}

func setupAPI(mux *http.ServeMux) {

	ctx := context.Background()

	manager := NewManager(ctx)

	// http.Handle("/", http.FileServer(http.Dir("../frontend")))

	mux.HandleFunc("/ws", manager.serveWS)
	mux.HandleFunc("/login", manager.loginHandler)

}
