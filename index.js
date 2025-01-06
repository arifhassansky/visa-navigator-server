require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.koweo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const visaCollection = client.db("VisaDB").collection("Visas");
    const appliedVisaCollection = client
      .db("VisaDB")
      .collection("appliedVisas");

    app.post("/addVisa", async (req, res) => {
      const visaDoc = req.body;
      const result = await visaCollection.insertOne(visaDoc);
      res.send(result);
    });

    app.get("/getVisas", async (req, res) => {
      const visaType = req.query.visaType;
      const search = req.query.search;
      const sort = req.query.sort;
      let query = {};
      let options = {};

      if (sort) options = { sort: { fee: sort === "asc" ? 1 : -1 } };

      if (visaType) {
        query = { visaType: visaType };
      }

      if (search) {
        query.countryName = { $regex: search, $options: "i" };
      }

      const cursor = visaCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/latestVisas", async (req, res) => {
      const result = await visaCollection
        .find()
        .sort({ _id: -1 })
        .limit(8)
        .toArray();
      res.send(result);
    });

    app.get("/visaDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await visaCollection.findOne(query);
      res.send(result);
    });

    app.get("/myAddedVisas", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = visaCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch("/myAddedVisas/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const visaInfo = req.body;

      const updateVisa = {
        $set: {
          countryName: visaInfo.countryName,
          countryPhoto: visaInfo.countryPhoto,
          visaType: visaInfo.visaType,
          processingTime: visaInfo.processingTime,
          ageRestriction: visaInfo.ageRestriction,
          fee: visaInfo.fee,
          validity: visaInfo.validity,
          applicationMethod: visaInfo.applicationMethod,
          description: visaInfo.description,
          requiredDocuments: visaInfo.requiredDocuments,
        },
      };
      const result = await visaCollection.updateOne(query, updateVisa);
      res.send(result);
    });

    app.delete("/deleteVisa/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await visaCollection.deleteOne(query);
      res.send(result);
    });

    // Api for Applied Visas
    app.post("/appliedVisa", async (req, res) => {
      const appliedVisaDoc = req.body;
      const result = await appliedVisaCollection.insertOne(appliedVisaDoc);
      res.send(result);
    });

    app.get("/appliedVisa", async (req, res) => {
      const email = req.query.email;
      const query = { email };

      const cursor = appliedVisaCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/appliedVisa/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await appliedVisaCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Visa Navigator server is running...!");
});

app.listen(port, () => {
  console.log(`Visa Navigator app listening on PORT: ${port}`);
});
