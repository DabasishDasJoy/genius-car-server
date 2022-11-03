const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("App is running");
});
app.listen(port, () => {
  console.log("App is listening to ", port);
});

app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1h" });

  res.send({ token });
});

//database

const uri = `mongodb+srv://${process.env.DB_userName}:${process.env.DB_password}@cluster0.mj0nqa8.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    console.log(decoded); // bar

    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}
const run = async () => {
  try {
    const serviceCollection = client.db("geniusCar").collection("services");
    const serviceOrders = client.db("geniusCar").collection("orders");

    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find({});
      const result = await cursor.toArray();

      res.send(result);
    });
    app.get("/checkout/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    app.post("/checkout", async (req, res) => {
      const order = req.body;
      const result = serviceOrders.insertOne(order);
      res.send(result);
    });

    app.get("/orders", verifyJWT, async (req, res) => {
      let query = {};
      //verify query email
      if (req.decoded.email !== req.query.email) {
        res.status(403).send({ message: "Unauthorized" });
      }
      console.log(req.query.email);
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }

      const cursor = serviceOrders.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
  }
};
run().catch(console.dir);
