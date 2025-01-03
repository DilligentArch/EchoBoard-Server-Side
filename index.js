const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port=process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2x9eo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const serviceCollection = client.db('ServiceDB').collection('services')
    app.post('/services', async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });
    
    app.get('/services', async (req, res) => {
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });

      app.get('/services', async (req, res) => {
        const { email } = req.query;
    
        if (email) {
            const query = { addedBy: email };
            const result = await serviceCollection.find(query).toArray();
            return res.send(result);
        }
    
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });
    
      app.get('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await serviceCollection.findOne(query);
        res.send(result);
  
  
      });

      app.get('/service/top-six', async (req, res) => {
        try {
            const result = await serviceCollection.aggregate([
                { $sample: { size: 6 } } // Randomly selects 6 documents
            ]).toArray();
    
            res.send(result);
        } catch (error) {
            console.error('Error fetching random data:', error);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    });
    

      app.put("/services/:id", async (req, res) => {
        const id = req.params.id;
        const review = req.body;
  
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateReview = {
          $set: {
            image: review.image,
            title: review.title,
            companyName: review.companyName,
            website: review.website,
            description: review.description,
            category: review.category,
            price: review.price,
           
          
          },
        };
  
        const result = await serviceCollection.updateOne(filter, updateReview, options);
        res.send(result);
      });

      app.delete('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await serviceCollection.deleteOne(query);
        res.send(result);
  
      })





      const reviewCollection = client.db('ServiceDB').collection('Reviews')
    app.post('/reviews', async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });
    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { id }
      const result = await reviewCollection.find(query).toArray();
      res.send(result);


    });




    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('server connected');
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});