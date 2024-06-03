const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
  path: '/socket.io',  // Optional, default is /socket.io
});


app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/todoApp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define models
const User = mongoose.model('User', new mongoose.Schema({ name: String }));
const Todo = mongoose.model('Todo', new mongoose.Schema({
  text: String,
  completed: Boolean,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}));
const Message = mongoose.model('Message', new mongoose.Schema({
  conversationId: String,
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
}));
const Conversation = mongoose.model('Conversation', new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}));

// Routes
app.post('/users', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.status(201).send(user);
});

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.status(200).send(users);
});

app.post('/todos', async (req, res) => {
  const { text, userId } = req.body;
  const todo = new Todo({
    text,
    completed: false,
    userId
  });
  await todo.save();
  res.status(201).send(todo);
});

app.get('/todos', async (req, res) => {
  const todos = await Todo.find();
  res.status(200).send(todos);
});

app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;
  const todo = await Todo.findByIdAndUpdate(id, { text, completed }, { new: true });
  res.status(200).send(todo);
});

app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  await Todo.findByIdAndDelete(id);
  res.status(204).send();
});

// Conversation routes
app.post('/conversations', async (req, res) => {
  const { participants } = req.body;
  const conversation = new Conversation({ participants });
  await conversation.save();
  res.status(201).send(conversation);
});

app.get('/conversations', async (req, res) => {
  const conversations = await Conversation.find().populate('participants');
  res.status(200).send(conversations);
});

// Socket.io setup for real-time chat
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation ${conversationId}`);
  });

  socket.on('sendMessage', async (message) => {
    const newMessage = new Message(message);
    await newMessage.save();
    io.to(message.conversationId).emit('receiveMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Log the server and socket instance for debugging
console.log('HTTP server instance:', server);
console.log('Socket.io server instance:', io);
