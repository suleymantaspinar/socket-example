const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const formatMessage = require('./utils/messages')
const { userJoin , getCurrentUser } = require('./utils/users')
const { userLeave , getRoomUsers } = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server)

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chatcord Bot'

// Run when client connects
io.on('connection', socket => { 
    socket.on('joinRoom', ({ username, room}) => {
        const user = userJoin( socket.id, username , room)
        
        socket.join( user.room )
        
        // This happens when a client connects WELCOME USER
        socket.emit('message',formatMessage(botName, `Welcome to Chatcord! ${user.username}`));

        // Broadcast when user connects 
        socket.broadcast
            .to( user.room )
						.emit('message', formatMessage(botName, `${ user.username } has joined the chat`));
						
				// Send user and room info
				io.to(user.room).emit('roomUsers',{
					room: user.room,
					users: getRoomUsers( user.room )
				});
    });
    
    // Listen for chatMessages
    socket.on('chatMessage',msg => {
			const user = getCurrentUser( socket.id );
			
			io.to( user.room ).emit('message',formatMessage(user.username, msg));
    })
    
    // Runs when client disconnects
    socket.on('disconnect', () => {
				const user = userLeave( socket.id );
				if( user ){
					io.to( user.room )
					.emit('message',formatMessage(botName, `${user.username} has left to chat`));

					io.to(user.room).emit('roomUsers',{
						room: user.room,
						users: getRoomUsers( user.room )
					})	
				};

    });

});

const PORT =  process.env.PORT || 3000 

server.listen(PORT, () => console.log(`Server running on ${PORT}`));