import express, { json } from 'express'
import router from './routes/routes';

const port = 3000
const app = express()

app.use(json());
app.use(router);

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})