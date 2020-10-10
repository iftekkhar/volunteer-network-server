const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const admin = require('firebase-admin')
require('dotenv').config()
const port = 5000
const ObjectId= require('mongodb').ObjectId

const app = express()
app.use(cors())
app.use(bodyParser.json())


var serviceAccount = require("./configs/volunteer-network-ia2020-firebase-adminsdk-vztwo-60cb8257f2.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fpncq.mongodb.net/volunteer-network?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    // Registered Volunteer DataBase Connection
    const events = client.db("volunteer-network").collection("organizations");
    // console.log('db 1 Connected')
    //Post API for Event Registration
    app.post('/add-event', (req, res) => {
        const newEvent = req.body;
        events.insertOne(newEvent)
            .then(result => {
                // console.log(result);
                res.send(result.insertedCount > 0);
            })
    })
    //Get API for Listing all Items
    app.get('/all-events', (req, res) => {
        events.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
});

client.connect(err => {
    // Registered Volunteer DataBase Connection
    const events = client.db("volunteer-network").collection("volunteer-registrations");
    // console.log('db 2 Connected')

    //Post API for Volunteer Registration
    app.post('/register-volunteer', (req, res) => {
        const newRegistration = req.body;
        events.insertOne(newRegistration)
            .then(result => {
                // console.log(result);
                res.send(result.insertedCount > 0);
            })
    })
    //Get API for Individual User Access
    app.get('/registered-events', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    let uid = decodedToken.uid;
                    events.find({ email: req.query.email })
                        .toArray((err, documents) => {
                            res.send(documents)
                        })
                }).catch(function (error) {
                    // Handle error
                });
        }
        else {
            res.status(401).send('Sorry ! Unauthorized Access')
        }


    })
    //Get API for Admin Access
    app.get('/lists-all-volunteers', (req, res) => {
                    events.find({})
                        .toArray((err, documents) => {
                            res.send(documents)
                        })
    


    })
    //Delete API
    app.delete('/delete-user-event-registration/:id', (req, res) => {
        events.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
            // console.log(result);
        })
    })

});



app.get('/', (req, res) => {
    res.send('Server Running')
})

app.listen(port, () => {
    console.log(`Server Running`)
})