const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2x9eo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Database collections
    const serviceCollection = client.db('ServiceDB').collection('services');
    const reviewCollection = client.db('ServiceDB').collection('Reviews');

    // ** Services Endpoints **

    // Add a new service
    app.post('/services', async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    // Get all services or filter by `addedBy`
    app.get('/services', async (req, res) => {
      const { addedBy } = req.query;
      const query = addedBy ? { addedBy } : {};
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    });

    // Get a specific service by ID
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // Get top six random services
    app.get('/service/top-six', async (req, res) => {
      try {
        const result = await serviceCollection.aggregate([{ $sample: { size: 6 } }]).toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching random data:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    // Update a specific service
    app.put('/services/:id', async (req, res) => {
      const id = req.params.id;
      const updatedService = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = { $set: updatedService };
      const result = await serviceCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // Delete a specific service
    app.delete('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    // ** Reviews Endpoints **

    // Add a new review
    app.post('/reviews', async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });

    // Get all reviews or filter by user email
    app.get('/reviews', async (req, res) => {
      const { email } = req.query;
      const query = email ? { userEmail: email } : {};
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // Get reviews for a specific service by ID
    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { id };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // Update a specific review
    app.put('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const updatedReview = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: updatedReview };
      const result = await reviewCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
    
      try {
        // Check if the ID is valid
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid review ID." });
        }
    
        // Define the filter for the review to be deleted
        const filter = { _id: new ObjectId(id) };
    
        // Perform the deletion
        const result = await reviewCollection.deleteOne(filter);
    
        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Review deleted successfully.", deletedCount: result.deletedCount });
        } else {
          res.status(404).send({ message: "Review not found or already deleted." });
        }
      } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).send({ message: "Failed to delete review. Please try again." });
      }
    });

    app.post("/users", async (req, res) => {
      const { email, name, image } = req.body;
    
      try {
        // Check if a user with the given email already exists
        const existingUser = await client
          .db("ServiceDB")
          .collection("Users")
          .findOne({ email });
    
        if (existingUser) {
          return res.status(200).send({ message: "User already exists" });
        }
    
        // Add the new user to the database
        const newUser = { email, name, image, createdAt: new Date().toISOString() };
        const result = await client.db("ServiceDB").collection("Users").insertOne(newUser);
    
        res.status(201).send({ message: "User added successfully", result });
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).send({ message: "Failed to add user" });
      }
    });
    app.get("/users", async (req, res) => {
      try {
        const users = await client.db("ServiceDB").collection("Users").find().toArray();
        res.status(200).send(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ message: "Failed to fetch users" });
      }
    });
    

    // MongoDB connection
    // await client.connect();
    // console.log('Connected to MongoDB successfully!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

// Server test route
app.get('/', (req, res) => {
  res.send('Server connected');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
