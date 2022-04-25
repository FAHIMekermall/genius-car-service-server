const express = require("express")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const { get } = require("express/lib/response")
require("dotenv").config()
const port = process.env.PORT || 5000
const app = express()

// middleware
app.use(cors())
app.use(express.json())

const verifyToken = async (req, res, next) => {
	const token = req.headers.authorization.split(" ")[1]
	jwt.verify(token, process.env.JWT_SECRET_KEY, (err, token) => {
		if (err) {
			res.status(404).send({ message: "authorization error" })
		} else {
			console.log(token)
			req.email = token.email
			next()
			// if (token.email !== req.body.email) {
			// 	res.status(404).send({ message: "authorization error" })
			// } else {
			// 	next()
			// }
		}
	})
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9iutd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
})

async function run() {
	try {
		await client.connect()
		const serviceCollection = client.db("geniusCar").collection("service")
		const orderCollection = client.db("geniusCar").collection("order")

		app.get("/service", async (req, res) => {
			const query = {}
			const cursor = serviceCollection.find(query)
			const services = await cursor.toArray()
			res.send(services)
		})

		app.get("/service/:id", async (req, res) => {
			const id = req.params.id
			const query = { _id: ObjectId(id) }
			const service = await serviceCollection.findOne(query)
			res.send(service)
		})

		// POST
		app.post("/service", async (req, res) => {
			const newService = req.body
			const result = await serviceCollection.insertOne(newService)
			res.send(result)
		})

		// DELETE
		app.delete("/service/:id", async (req, res) => {
			const id = req.params.id
			const query = { _id: ObjectId(id) }
			const result = await serviceCollection.deleteOne(query)
			res.send(result)
		})

		// Add orders
		app.post("/order", async (req, res) => {
			const orderBody = req.body
			console.log(orderBody)
			const result = await orderCollection.insertOne(orderBody)
			res.send(result)
		})
		app.post("/getOrder", verifyToken, async (req, res) => {
			if (req.email === req.body.email) {
				const query = { email: req.body.email }
				const cursor = orderCollection.find(query)
				const result = await cursor.toArray()
				res.send(result)
			} else {
				res.send({ message: "authorization error" })
			}
		})
	} finally {
	}
}

run().catch(console.dir)

app.get("/", (req, res) => {
	res.send("Running Genius Server")
})

app.post("/jwtAccess", async (req, res) => {
	const userEmail = req.body.email
	const user = jwt.sign({ email: userEmail }, process.env.JWT_SECRET_KEY, {
		expiresIn: "1d",
	})
	res.send(user)
})

app.listen(port, () => {
	console.log("Listening to port", port)
})
