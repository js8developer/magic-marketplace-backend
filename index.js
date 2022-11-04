const express = require('express')
const app = express()
const cors = require("cors")
const port = 8081
require("dotenv").config()

app.use(cors());

app.get('/', (req, res) => {
  res.send('Welcome to the magic marketplace!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})