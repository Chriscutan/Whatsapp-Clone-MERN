//importing
import express from "express";
import mongoose from "mongoose";
import Cors from "cors";
import Pusher from "pusher";
import Messages from "./dbMessages.js";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1530385",
  key: "dda5c0e4335fe3d6a694",
  secret: "b8caa0933783e86861a8",
  cluster: "ap2",
  useTLS: true,
});

//middleware
app.use(express.json());
app.use(Cors());

//DB config
const connection_url =
  "mongodb+srv://admin:i0R7T0NZjKd0iftR@cluster0.fjwox6n.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(connection_url, { useNewUrlParser: true });

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB is connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});
//????

//API routes
app.get("/", (req, res) => {
  res.status(200).send("Hello World");
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

//Listener
app.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
});
